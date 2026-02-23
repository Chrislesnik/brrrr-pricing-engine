import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

export const runtime = "nodejs";

const CHAT_API_KEY = process.env.APPRAISAL_CHAT_API_KEY;
const SYSTEM_USER_ID = "system-amc-bot";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

/**
 * POST /api/appraisal-orders/[id]/chat
 * Allows n8n (or any external system) to push a message into an appraisal's
 * Liveblocks chat room. Authenticated via x-api-key header.
 *
 * Body: { message: string, senderName?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    if (!CHAT_API_KEY || apiKey !== CHAT_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const appraisalId = id;
    const roomId = `appraisal:${appraisalId}`;

    const body = await req.json().catch(() => null);
    if (!body?.message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const { message } = body as {
      message: string;
      senderName?: string;
    };

    // Create a new thread in the appraisal room with the system user
    const thread = await liveblocks.createThread({
      roomId,
      data: {
        comment: {
          userId: SYSTEM_USER_ID,
          body: {
            version: 1,
            content: [
              {
                type: "paragraph",
                children: [{ text: message }],
              },
            ],
          },
        },
      },
    });

    return NextResponse.json({
      threadId: thread.id,
      commentId: thread.comments[0]?.id ?? null,
    });
  } catch (e) {
    console.error("[POST /api/appraisal-orders/[id]/chat]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
