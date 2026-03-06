export const runtime = "nodejs"

import { streamText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { Liveblocks } from "@liveblocks/node"

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const AI_USER_ID = "ai-assistant"

/**
 * POST /api/chat/ai-comment
 *
 * Two modes:
 * 1. postToChat: false — streams AI response (for toolbar preview)
 * 2. postToChat: true  — posts AI response as a Liveblocks comment from "ai-assistant"
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      roomId,
      action,
      prompt,
      content,
      postToChat,
      conversationContext,
    } = body as {
      dealId?: string
      roomId?: string
      threadId?: string
      action?: string
      prompt?: string
      content?: string
      postToChat?: boolean
      conversationContext?: string
    }

    // ── Mode 2: Post existing content to chat ──
    if (postToChat && content && roomId) {
      const thread = await liveblocks.createThread({
        roomId,
        data: {
          comment: {
            userId: AI_USER_ID,
            body: {
              version: 1,
              content: [
                {
                  type: "paragraph" as const,
                  children: [{ text: content }],
                },
              ],
            },
          },
        },
      })

      return NextResponse.json({
        threadId: thread.id,
        commentId: thread.comments[0]?.id ?? null,
      })
    }

    // ── Mode 1: Generate AI response (streaming) ──
    let systemPrompt =
      "You are a helpful AI assistant in a deal messaging channel. "

    switch (action) {
      case "summarize":
        systemPrompt +=
          "Summarize the conversation thread concisely. Focus on key decisions, action items, and open questions."
        break
      case "draft":
        systemPrompt +=
          "Draft a professional response based on the context provided. Be concise and action-oriented."
        break
      case "explain":
        systemPrompt +=
          "Explain the key details of this deal: loan type, property, borrower info, and current status."
        break
      case "pricing":
        systemPrompt +=
          "Help the user understand the pricing for this deal. List the key inputs and any missing required fields."
        break
      default:
        systemPrompt += "Answer the user's question accurately and concisely."
    }

    const userContent =
      prompt || conversationContext || "Help me with this deal."

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      messages: [{ role: "user" as const, content: userContent }],
      maxOutputTokens: 1024,
    })

    return result.toUIMessageStreamResponse()
  } catch (e) {
    console.error("[POST /api/chat/ai-comment]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
