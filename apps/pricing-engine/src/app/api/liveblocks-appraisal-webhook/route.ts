import { WebhookHandler } from "@liveblocks/node";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.LIVEBLOCKS_APPRAISAL_WEBHOOK_SECRET!;
const N8N_WEBHOOK_URL =
  "https://n8n.axora.info/webhook/cc4afedd-fc2b-43fb-9913-b5e0048cc09b";

const webhookHandler = new WebhookHandler(WEBHOOK_SECRET);

export async function POST(request: Request) {
  const body = await request.json();
  const headers = request.headers;

  let event;
  try {
    event = webhookHandler.verifyRequest({
      headers,
      rawBody: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[liveblocks-appraisal-webhook] verification failed:", err);
    return new Response("Could not verify webhook call", { status: 400 });
  }

  const { type } = event;

  // Only forward thread/comment events for appraisal rooms
  if (type !== "threadCreated" && type !== "commentCreated") {
    return new Response(null, { status: 200 });
  }

  const roomId: string = (event.data as Record<string, unknown>).roomId as string ?? "";
  if (!roomId.startsWith("appraisal:")) {
    return new Response(null, { status: 200 });
  }

  const appraisalId = roomId.replace("appraisal:", "");

  const payload = {
    appraisalId,
    roomId,
    eventType: type,
    threadId: (event.data as Record<string, unknown>).threadId ?? null,
    commentId: (event.data as Record<string, unknown>).commentId ?? null,
    userId: (event.data as Record<string, unknown>).userId ?? null,
    body: (event.data as Record<string, unknown>).body ?? null,
    createdAt: (event.data as Record<string, unknown>).createdAt ?? new Date().toISOString(),
  };

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        `[liveblocks-appraisal-webhook] n8n responded ${res.status}:`,
        await res.text().catch(() => "")
      );
    }
  } catch (err) {
    console.error("[liveblocks-appraisal-webhook] failed to forward to n8n:", err);
  }

  return new Response(null, { status: 200 });
}
