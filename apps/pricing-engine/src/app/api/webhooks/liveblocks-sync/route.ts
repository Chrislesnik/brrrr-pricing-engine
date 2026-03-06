import { WebhookHandler } from "@liveblocks/node";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  liveblocksToSlack,
  liveblocksToTeams,
  liveblocksToPlainText,
} from "@/lib/message-format-converter";

// ─── Config ──────────────────────────────────────────────────────────
const WEBHOOK_SECRET = process.env.LIVEBLOCKS_SYNC_WEBHOOK_SECRET!;
const webhookHandler = new WebhookHandler(WEBHOOK_SECRET);

export const runtime = "nodejs";

// ─── Types ───────────────────────────────────────────────────────────
interface LiveblocksCommentEvent {
  type: "commentCreated" | "threadCreated";
  data: {
    roomId: string;
    threadId: string;
    commentId: string;
    createdBy: string;
    body?: {
      version: 1;
      content: Array<{
        type: "paragraph";
        children: Array<
          | { text: string; bold?: boolean; italic?: boolean; strikethrough?: boolean; code?: boolean }
          | { type: "mention"; id: string }
          | { type: "link"; url: string; text?: string }
        >;
      }>;
    };
    metadata?: Record<string, string>;
  };
}

// ─── POST handler ────────────────────────────────────────────────────
export async function POST(request: Request) {
  const body = await request.json();
  const headers = request.headers;

  let event: LiveblocksCommentEvent;
  try {
    event = webhookHandler.verifyRequest({
      headers,
      rawBody: JSON.stringify(body),
    }) as unknown as LiveblocksCommentEvent;
  } catch (err) {
    console.error("[liveblocks-sync] verification failed:", err);
    return new Response("Could not verify webhook call", { status: 400 });
  }

  // Only handle comment creation events
  if (event.type !== "commentCreated" && event.type !== "threadCreated") {
    return new Response(null, { status: 200 });
  }

  const { roomId, threadId, commentId, createdBy, body: commentBody, metadata } =
    event.data;

  // Skip messages that originated from external platforms (echo prevention)
  if (metadata?.source === "slack" || metadata?.source === "teams") {
    return new Response(null, { status: 200 });
  }

  // Skip system bridge bot messages
  if (createdBy === "system-bridge-bot") {
    return new Response(null, { status: 200 });
  }

  // Extract deal ID from room ID (format: "deal:{dealId}")
  const dealMatch = roomId.match(/^deal:(.+)$/);
  if (!dealMatch) {
    // Only sync deal room messages to external platforms
    return new Response(null, { status: 200 });
  }
  const dealId = dealMatch[1];

  // Resolve the organization for this deal
  const { data: deal } = await supabaseAdmin
    .from("deals")
    .select("id, organization_id")
    .eq("id", dealId)
    .single();

  if (!deal) {
    console.error(`[liveblocks-sync] Deal not found: ${dealId}`);
    return new Response(null, { status: 200 });
  }

  const orgId = deal.organization_id as string;

  // Resolve user display name
  let senderName = createdBy;
  if (createdBy === "ai-assistant") {
    senderName = "AI Assistant";
  } else {
    const { data: member } = await supabaseAdmin
      .from("organization_members")
      .select("first_name, last_name")
      .eq("organization_id", orgId)
      .eq("user_id", createdBy)
      .single();
    if (member) {
      senderName = [member.first_name, member.last_name]
        .filter(Boolean)
        .join(" ") || createdBy;
    }
  }

  // Dispatch to Slack and Teams concurrently
  const results = await Promise.allSettled([
    syncToSlack(orgId, dealId, roomId, threadId, commentId, senderName, commentBody),
    syncToTeams(orgId, dealId, roomId, threadId, commentId, senderName, commentBody),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[liveblocks-sync] dispatch error:", result.reason);
    }
  }

  return new Response(null, { status: 200 });
}

// ─── Slack Sync ──────────────────────────────────────────────────────
async function syncToSlack(
  orgId: string,
  dealId: string,
  roomId: string,
  threadId: string,
  commentId: string,
  senderName: string,
  commentBody: LiveblocksCommentEvent["data"]["body"]
) {
  // Check if Slack integration is configured for this org
  const { data: integration } = await supabaseAdmin
    .from("integration_setup")
    .select("config")
    .eq("organization_id", orgId)
    .eq("integration_type", "slack")
    .eq("is_active", true)
    .single();

  if (!integration) return;

  const config = integration.config as Record<string, string>;
  const botToken = config?.bot_token;
  if (!botToken) return;

  // Look up Slack channel mapping
  const { data: channelMap } = await supabaseAdmin
    .from("slack_channel_map")
    .select("slack_channel_id, sync_enabled")
    .eq("organization_id", orgId)
    .eq("deal_id", dealId)
    .single();

  if (!channelMap || !channelMap.sync_enabled) return;

  // Convert message body to Slack mrkdwn
  const mrkdwn = commentBody
    ? liveblocksToSlack(commentBody as Parameters<typeof liveblocksToSlack>[0])
    : "(empty message)";

  const text = `*${senderName}*: ${mrkdwn}`;

  // Post to Slack
  const slackPayload: Record<string, unknown> = {
    channel: channelMap.slack_channel_id,
    text,
    unfurl_links: false,
    metadata: {
      event_type: "liveblocks_sync",
      event_payload: {
        source: "liveblocks",
        liveblocksCommentId: commentId,
        liveblocksThreadId: threadId,
        liveblocksRoomId: roomId,
      },
    },
  };

  // If this is a reply in a thread, look up the parent Slack message ts
  // (Thread replies would need a ts mapping table — for now, post as top-level)

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(slackPayload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[liveblocks-sync] Slack API error:", err);
  } else {
    const result = await res.json();
    if (!result.ok) {
      console.error("[liveblocks-sync] Slack API error:", result.error);
    }
  }
}

// ─── Teams Sync ──────────────────────────────────────────────────────
async function syncToTeams(
  orgId: string,
  dealId: string,
  roomId: string,
  threadId: string,
  commentId: string,
  senderName: string,
  commentBody: LiveblocksCommentEvent["data"]["body"]
) {
  // Check if Teams integration is configured for this org
  const { data: integration } = await supabaseAdmin
    .from("integration_setup")
    .select("config")
    .eq("organization_id", orgId)
    .eq("integration_type", "teams")
    .eq("is_active", true)
    .single();

  if (!integration) return;

  const config = integration.config as Record<string, string>;
  const accessToken = config?.access_token;
  if (!accessToken) return;

  // Look up Teams channel mapping
  const { data: channelMap } = await supabaseAdmin
    .from("teams_channel_map")
    .select("teams_team_id, teams_channel_id, sync_enabled")
    .eq("organization_id", orgId)
    .eq("deal_id", dealId)
    .single();

  if (!channelMap || !channelMap.sync_enabled) return;

  // Convert message body to Teams HTML
  const html = commentBody
    ? liveblocksToTeams(commentBody as Parameters<typeof liveblocksToTeams>[0])
    : "<p>(empty message)</p>";

  const teamsBody = `<p><strong>${senderName}</strong></p>${html}`;

  // Post to Teams via Microsoft Graph API
  const graphUrl = `https://graph.microsoft.com/v1.0/teams/${channelMap.teams_team_id}/channels/${channelMap.teams_channel_id}/messages`;

  const res = await fetch(graphUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: {
        contentType: "html",
        content: teamsBody,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[liveblocks-sync] Teams Graph API error:", err);
  }
}
