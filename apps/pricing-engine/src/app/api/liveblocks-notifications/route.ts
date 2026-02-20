import { WebhookHandler } from "@liveblocks/node";

const WEBHOOK_SECRET = process.env.LIVEBLOCKS_WEBHOOK_SECRET!;
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
    console.error("[liveblocks-notifications] verification failed:", err);
    return new Response("Could not verify webhook call", { status: 400 });
  }

  if (event.type !== "notification") {
    return new Response(null, { status: 200 });
  }

  const { channel, kind, userId, roomId, inboxNotificationId } = event.data;

  console.log(
    `[liveblocks-notifications] channel=${channel} kind=${kind} user=${userId} room=${roomId} notif=${inboxNotificationId}`
  );

  try {
    switch (channel) {
      case "email":
        await dispatchEmail(kind, userId, roomId, inboxNotificationId);
        break;
      case "slack":
        await dispatchSlack(kind, userId, roomId, inboxNotificationId);
        break;
      case "teams":
        await dispatchTeams(kind, userId, roomId, inboxNotificationId);
        break;
      case "sms":
        await dispatchSms(kind, userId, roomId, inboxNotificationId);
        break;
      default:
        console.log(`[liveblocks-notifications] unhandled channel: ${channel}`);
    }
  } catch (err) {
    console.error(`[liveblocks-notifications] dispatch error:`, err);
  }

  return new Response(null, { status: 200 });
}

async function dispatchEmail(
  kind: string,
  userId: string,
  roomId: string,
  notificationId: string
) {
  // TODO: Integrate with Resend, SendGrid, or other email provider
  console.log(
    `[email] Would send email for kind=${kind} to user=${userId} room=${roomId} notif=${notificationId}`
  );
}

async function dispatchSlack(
  kind: string,
  userId: string,
  roomId: string,
  notificationId: string
) {
  // TODO: Integrate with Slack Incoming Webhook or Slack API
  console.log(
    `[slack] Would send Slack message for kind=${kind} to user=${userId} room=${roomId} notif=${notificationId}`
  );
}

async function dispatchTeams(
  kind: string,
  userId: string,
  roomId: string,
  notificationId: string
) {
  // TODO: Integrate with Microsoft Teams Incoming Webhook
  console.log(
    `[teams] Would send Teams message for kind=${kind} to user=${userId} room=${roomId} notif=${notificationId}`
  );
}

async function dispatchSms(
  kind: string,
  userId: string,
  roomId: string,
  notificationId: string
) {
  // TODO: Integrate with Twilio or other SMS provider
  console.log(
    `[sms] Would send SMS for kind=${kind} to user=${userId} room=${roomId} notif=${notificationId}`
  );
}
