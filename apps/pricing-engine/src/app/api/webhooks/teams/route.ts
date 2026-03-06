import { Liveblocks } from "@liveblocks/node";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { teamsToLiveblocks } from "@/lib/message-format-converter";

// ─── Config ──────────────────────────────────────────────────────────
const LIVEBLOCKS_SECRET = process.env.LIVEBLOCKS_SECRET_KEY!;
const liveblocks = new Liveblocks({ secret: LIVEBLOCKS_SECRET });

export const runtime = "nodejs";

// ─── Types ───────────────────────────────────────────────────────────
interface TeamsWebhookPayload {
  value: TeamsNotification[];
  validationTokens?: string[];
}

interface TeamsNotification {
  subscriptionId: string;
  changeType: string;
  resource: string;
  resourceData: {
    id: string;
    "@odata.type": string;
    "@odata.id": string;
  };
  clientState?: string;
  tenantId: string;
}

interface TeamsMessage {
  id: string;
  body: {
    contentType: "html" | "text";
    content: string;
  };
  from: {
    user?: {
      id: string;
      displayName: string;
    };
    application?: {
      id: string;
      displayName: string;
    };
  };
  createdDateTime: string;
  channelIdentity?: {
    teamId: string;
    channelId: string;
  };
}

// ─── POST handler ────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Handle Microsoft Graph subscription validation
  const url = new URL(request.url);
  const validationToken = url.searchParams.get("validationToken");
  if (validationToken) {
    return new Response(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const payload: TeamsWebhookPayload = await request.json();

  // Process each notification
  for (const notification of payload.value) {
    try {
      await handleTeamsNotification(notification);
    } catch (err) {
      console.error("[teams-webhook] Error handling notification:", err);
    }
  }

  // Always return 202 quickly to acknowledge receipt
  return new Response(null, { status: 202 });
}

// ─── Notification Handler ────────────────────────────────────────────
async function handleTeamsNotification(notification: TeamsNotification) {
  // Only handle message creation
  if (notification.changeType !== "created") return;

  // Validate client state for security
  const expectedClientState = process.env.TEAMS_WEBHOOK_CLIENT_STATE;
  if (
    expectedClientState &&
    notification.clientState !== expectedClientState
  ) {
    console.error("[teams-webhook] Client state mismatch");
    return;
  }

  // Extract team and channel ID from the resource path
  // Resource format: /teams/{team-id}/channels/{channel-id}/messages/{message-id}
  const resourceMatch = notification.resource.match(
    /teams\/([^/]+)\/channels\/([^/]+)\/messages\/([^/]+)/
  );
  if (!resourceMatch) {
    console.log(
      `[teams-webhook] Could not parse resource: ${notification.resource}`
    );
    return;
  }

  const [, teamsTeamId, teamsChannelId, messageId] = resourceMatch;

  // Look up channel mapping
  const { data: channelMap } = await supabaseAdmin
    .from("teams_channel_map")
    .select("deal_id, liveblocks_room_id, organization_id, sync_enabled")
    .eq("teams_team_id", teamsTeamId)
    .eq("teams_channel_id", teamsChannelId)
    .single();

  if (!channelMap || !channelMap.sync_enabled) {
    console.log(
      `[teams-webhook] No channel mapping for Teams channel: ${teamsTeamId}/${teamsChannelId}`
    );
    return;
  }

  const { deal_id: dealId, liveblocks_room_id: roomId, organization_id: orgId } =
    channelMap;

  // Fetch the actual message content from Graph API
  const message = await fetchTeamsMessage(
    orgId as string,
    teamsTeamId,
    teamsChannelId,
    messageId
  );
  if (!message) return;

  // Skip bot/application messages (echo prevention)
  if (message.from.application) {
    return;
  }

  const teamsUserId = message.from.user?.id;
  if (!teamsUserId) return;

  // Look up user mapping
  const { data: userMap } = await supabaseAdmin
    .from("external_user_map")
    .select("clerk_user_id")
    .eq("external_user_id", teamsUserId)
    .eq("provider", "teams")
    .eq("organization_id", orgId)
    .single();

  if (!userMap) {
    console.log(
      `[teams-webhook] No user mapping for Teams user: ${teamsUserId}`
    );
    return;
  }

  const clerkUserId = userMap.clerk_user_id as string;

  // Permission check
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
      `[teams-webhook] User ${clerkUserId} lacks access to deal ${dealId}`
    );
    return;
  }

  // Convert Teams HTML to Liveblocks body format
  const content =
    message.body.contentType === "html"
      ? message.body.content
      : `<p>${message.body.content}</p>`;
  const liveblocksBody = teamsToLiveblocks(content);

  // Create Liveblocks thread
  try {
    await liveblocks.createThread({
      roomId,
      data: {
        comment: {
          userId: clerkUserId,
          body: liveblocksBody,
          metadata: {
            source: "teams",
            teamsMessageId: messageId,
            teamsTeamId,
            teamsChannelId,
          },
        },
      },
    });
  } catch (err) {
    console.error("[teams-webhook] Failed to create Liveblocks thread:", err);
  }
}

// ─── Fetch Teams Message ─────────────────────────────────────────────
async function fetchTeamsMessage(
  orgId: string,
  teamId: string,
  channelId: string,
  messageId: string
): Promise<TeamsMessage | null> {
  // Get Teams access token from integration config
  const { data: integration } = await supabaseAdmin
    .from("integration_setup")
    .select("config")
    .eq("organization_id", orgId)
    .eq("integration_type", "teams")
    .eq("is_active", true)
    .single();

  if (!integration) return null;

  const config = integration.config as Record<string, string>;
  const accessToken = config?.access_token;
  if (!accessToken) return null;

  const graphUrl = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages/${messageId}`;

  const res = await fetch(graphUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    console.error(
      `[teams-webhook] Failed to fetch message: ${res.status} ${res.statusText}`
    );
    return null;
  }

  return res.json();
}
