export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";
import { supabaseAdmin } from "@/lib/supabase-admin";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const SYSTEM_USER_ID = "system-bridge-bot";

/**
 * POST /api/chat/bridge-comment
 *
 * Bridges comments from document/task rooms to the parent deal channel.
 * Creates or appends to a linked thread in the deal room.
 *
 * Uses `comment_bridge_threads` table with UNIQUE constraint for idempotency.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      sourceRoomId,
      dealId,
      sourceType,
      sourceId,
      sourceName,
      commentBody,
      commentUserId,
    } = body as {
      sourceRoomId: string;
      dealId: string;
      sourceType: "document" | "task";
      sourceId: string;
      sourceName: string;
      commentBody: string;
      commentUserId: string;
    };

    if (!dealId || !sourceType || !sourceId || !commentBody) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const dealRoomId = `deal:${dealId}`;

    // ── Step 1: Check for existing bridge thread (idempotent) ──
    const { data: existing } = await supabaseAdmin
      .from("comment_bridge_threads")
      .select("deal_thread_id")
      .eq("deal_id", dealId)
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .maybeSingle();

    let dealThreadId: string;

    if (existing?.deal_thread_id) {
      // ── Step 2a: Thread exists → append comment as reply ──
      dealThreadId = existing.deal_thread_id;
    } else {
      // ── Step 2b: Create new linked thread ──
      const icon = sourceType === "document" ? "📄" : "✅";
      const label = sourceType === "document" ? "document" : "task";

      // Create thread in deal room with system message
      const thread = await liveblocks.createThread({
        roomId: dealRoomId,
        data: {
          metadata: {
            sourceType,
            sourceId,
            sourceName,
            autoThread: "true",
          },
          comment: {
            userId: SYSTEM_USER_ID,
            body: {
              version: 1,
              content: [
                {
                  type: "paragraph" as const,
                  children: [
                    {
                      text: `${icon} New comment on ${label}: ${sourceName}`,
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      dealThreadId = thread.id;

      // ── Step 3: Persist the mapping (INSERT ON CONFLICT) ──
      const { error: insertError } = await supabaseAdmin
        .from("comment_bridge_threads")
        .insert({
          deal_id: dealId,
          source_type: sourceType,
          source_id: sourceId,
          source_name: sourceName,
          deal_thread_id: dealThreadId,
        });

      if (insertError) {
        // Concurrent insert — another request won the race
        // Fetch the winner's thread ID
        const { data: winner } = await supabaseAdmin
          .from("comment_bridge_threads")
          .select("deal_thread_id")
          .eq("deal_id", dealId)
          .eq("source_type", sourceType)
          .eq("source_id", sourceId)
          .single();

        if (winner) {
          dealThreadId = winner.deal_thread_id;
        }
      }
    }

    // ── Step 4: Append the bridged comment as a reply ──
    const comment = await liveblocks.createComment({
      roomId: dealRoomId,
      threadId: dealThreadId,
      data: {
        userId: commentUserId || userId,
        body: {
          version: 1,
          content: [
            {
              type: "paragraph" as const,
              children: [{ text: commentBody }],
            },
          ],
        },
        metadata: {
          bridgedFrom: sourceRoomId,
          sourceType,
          sourceId,
        },
      },
    });

    return NextResponse.json({
      dealThreadId,
      commentId: comment.id,
    });
  } catch (e) {
    console.error("[POST /api/chat/bridge-comment]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
