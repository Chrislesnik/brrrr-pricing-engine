import { WebhookHandler } from "@liveblocks/node";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

let _webhookHandler: WebhookHandler | null = null;
function getWebhookHandler() {
  if (!_webhookHandler) {
    const secret = process.env.LIVEBLOCKS_WEBHOOK_SECRET;
    if (!secret) throw new Error("LIVEBLOCKS_WEBHOOK_SECRET is not configured");
    _webhookHandler = new WebhookHandler(secret);
  }
  return _webhookHandler;
}

type WebhookEventData = Record<string, unknown>;

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  let event: { type: string; data: WebhookEventData };
  try {
    event = getWebhookHandler().verifyRequest({
      headers: request.headers,
      rawBody,
    }) as { type: string; data: WebhookEventData };
  } catch (err) {
    console.error("[liveblocks-webhook] verification failed:", err);
    return new Response("Could not verify webhook call", { status: 400 });
  }

  const { type, data } = event;
  const roomId = (data.roomId as string) ?? "";

  switch (type) {
    case "threadCreated":
    case "commentCreated": {
      if (!roomId.startsWith("deal:")) break;

      const dealId = roomId.replace("deal:", "");
      await supabaseAdmin
        .from("deals")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", dealId);
      break;
    }

    case "roomCreated": {
      console.log(`[liveblocks-webhook] room created: ${roomId}`);
      break;
    }

    case "roomDeleted": {
      console.log(`[liveblocks-webhook] room deleted: ${roomId}`);
      break;
    }

    case "userEnteredRoom":
    case "userLeftRoom": {
      break;
    }

    default:
      break;
  }

  return new Response(null, { status: 200 });
}
