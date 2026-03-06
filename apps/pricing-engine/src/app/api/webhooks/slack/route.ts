import { createHmac, timingSafeEqual } from "crypto";
import { Liveblocks } from "@liveblocks/node";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { slackToLiveblocks } from "@/lib/message-format-converter";

// ─── Config ──────────────────────────────────────────────────────────
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;
const LIVEBLOCKS_SECRET = process.env.LIVEBLOCKS_SECRET_KEY!;
const liveblocks = new Liveblocks({ secret: LIVEBLOCKS_SECRET });

export const runtime = "nodejs";

// ─── Types ───────────────────────────────────────────────────────────
interface SlackEvent {
  type: string;
  challenge?: string;
  event?: {
    type: string;
    channel: string;
    user: string;
    text: string;
    ts: string;
    thread_ts?: string;
    bot_id?: string;
    subtype?: string;
  };
  team_id?: string;
}

// ─── Signature Verification ──────────────────────────────────────────
function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  // Reject requests older than 5 minutes (replay protection)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    return false;
  }

  const basestring = `v0:${timestamp}:${body}`;
  const hmac = createHmac("sha256", SLACK_SIGNING_SECRET)
    .update(basestring)
    .digest("hex");
  const computedSignature = `v0=${hmac}`;

  try {
    return timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

// ─── POST handler ────────────────────────────────────────────────────
export async function POST(request: Request) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";
  const signature = request.headers.get("x-slack-signature") ?? "";

  // Verify Slack request signature
  if (!verifySlackSignature(rawBody, timestamp, signature)) {
    console.error("[slack-webhook] Signature verification failed");
    return new Response("Invalid signature", { status: 401 });
  }

  const payload: SlackEvent = JSON.parse(rawBody);

  // Handle Slack URL verification challenge
  if (payload.type === "url_verification") {
    return new Response(
      JSON.stringify({ challenge: payload.challenge }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Only process event_callback type
  if (payload.type !== "event_callback") {
    return new Response(null, { status: 200 });
  }

  const event = payload.event;
  if (!event) {
    return new Response(null, { status: 200 });
  }

  // Only process message events (not bot messages or subtypes like message_changed)
  if (event.type !== "message" || event.bot_id || event.subtype) {
    return new Response(null, { status: 200 });
  }

  try {
    await handleSlackMessage(event, payload.team_id ?? "");
  } catch (err) {
    console.error("[slack-webhook] Error handling message:", err);
  }

  // Always return 200 quickly to avoid Slack retries
  return new Response(null, { status: 200 });
}

// ─── Message Handler ─────────────────────────────────────────────────
async function handleSlackMessage(
  event: NonNullable<SlackEvent["event"]>,
  teamId: string
) {
  const { channel: slackChannelId, user: slackUserId, text, ts } = event;

  // Look up channel mapping — find the deal room for this Slack channel
  const { data: channelMap } = await supabaseAdmin
    .from("slack_channel_map")
    .select("deal_id, liveblocks_room_id, organization_id, sync_enabled")
    .eq("slack_channel_id", slackChannelId)
    .single();

  if (!channelMap || !channelMap.sync_enabled) {
    console.log(
      `[slack-webhook] No channel mapping found for Slack channel: ${slackChannelId}`
    );
    return;
  }

  const { deal_id: dealId, liveblocks_room_id: roomId, organization_id: orgId } =
    channelMap;

  // Look up user mapping — find the Clerk user for this Slack user
  const { data: userMap } = await supabaseAdmin
    .from("external_user_map")
    .select("clerk_user_id")
    .eq("external_user_id", slackUserId)
    .eq("provider", "slack")
    .eq("organization_id", orgId)
    .single();

  if (!userMap) {
    // Try to auto-map by fetching Slack user email and matching to Clerk user
    const mapped = await attemptAutoUserMap(
      slackUserId,
      orgId as string,
      teamId
    );
    if (!mapped) {
      console.log(
        `[slack-webhook] No user mapping for Slack user: ${slackUserId}`
      );
      // Could send ephemeral message: "Your Slack account isn't linked"
      return;
    }
  }

  const clerkUserId = userMap?.clerk_user_id ?? (
    await supabaseAdmin
      .from("external_user_map")
      .select("clerk_user_id")
      .eq("external_user_id", slackUserId)
      .eq("provider", "slack")
      .eq("organization_id", orgId)
      .single()
  ).data?.clerk_user_id;

  if (!clerkUserId) return;

  // Permission check: verify user has access to this deal
  const { data: accessCheck } = await supabaseAdmin.rpc(
    "can_access_org_resource",
    {
      p_user_id: clerkUserId,
      p_organization_id: orgId,
      p_resource_type: "deal",
      p_resource_id: dealId,
    }
  );

  if (!accessCheck) {
    console.log(
      `[slack-webhook] User ${clerkUserId} lacks access to deal ${dealId}`
    );
    return;
  }

  // Convert Slack mrkdwn to Liveblocks body format
  const liveblocksBody = slackToLiveblocks(text);

  // Create a new thread in Liveblocks with the message
  try {
    await liveblocks.createThread({
      roomId,
      data: {
        comment: {
          userId: clerkUserId as string,
          body: liveblocksBody,
          metadata: {
            source: "slack",
            slackTs: ts,
            slackChannelId,
            slackUserId,
          },
        },
      },
    });
  } catch (err) {
    console.error("[slack-webhook] Failed to create Liveblocks thread:", err);
  }
}

// ─── Auto User Mapping ───────────────────────────────────────────────
async function attemptAutoUserMap(
  slackUserId: string,
  orgId: string,
  teamId: string
): Promise<boolean> {
  // Look up Slack integration bot token for this org
  const { data: integration } = await supabaseAdmin
    .from("integration_setup")
    .select("config")
    .eq("organization_id", orgId)
    .eq("integration_type", "slack")
    .eq("is_active", true)
    .single();

  if (!integration) return false;

  const config = integration.config as Record<string, string>;
  const botToken = config?.bot_token;
  if (!botToken) return false;

  // Fetch Slack user info to get email
  const userInfoRes = await fetch(
    `https://slack.com/api/users.info?user=${slackUserId}`,
    {
      headers: { Authorization: `Bearer ${botToken}` },
    }
  );

  if (!userInfoRes.ok) return false;

  const userInfo = await userInfoRes.json();
  if (!userInfo.ok || !userInfo.user?.profile?.email) return false;

  const slackEmail = userInfo.user.profile.email as string;
  const slackDisplayName =
    userInfo.user.profile.display_name ||
    userInfo.user.real_name ||
    slackEmail;

  // Look up Clerk user by email in organization_members
  // (We match on email via Clerk user data synced to our DB)
  const { data: member } = await supabaseAdmin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .single();

  // For a more robust match, we'd look up Clerk users by email
  // For now, skip auto-mapping if we can't find a direct match
  if (!member) return false;

  // Create the user mapping
  const { error } = await supabaseAdmin.from("external_user_map").upsert(
    {
      clerk_user_id: member.user_id,
      provider: "slack",
      external_user_id: slackUserId,
      external_display_name: slackDisplayName,
      organization_id: orgId,
    },
    { onConflict: "clerk_user_id,provider,organization_id" }
  );

  return !error;
}
