export const runtime = "nodejs"

import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { auth } from "@clerk/nextjs/server"
import { fetchDealContext, buildDealSystemPrompt } from "@/lib/ai/deal-context"

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * POST /api/chat/ai-private
 *
 * Private AI chat endpoint for the side panel.
 * Streams AI responses back. Not posted to Liveblocks.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { dealId, messages } = body as {
      dealId?: string
      messages: UIMessage[]
    }

    if (!messages || messages.length === 0) {
      return new Response("messages is required", { status: 400 })
    }

    // Build system prompt with deal context if available
    let systemPrompt =
      "You are a helpful AI assistant in a private deal messaging panel. You help users understand their deals, answer questions about loan details, and assist with pricing and documentation. Be concise and action-oriented."

    if (dealId) {
      const ctx = await fetchDealContext(dealId)
      systemPrompt = buildDealSystemPrompt(ctx)
    }

    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      messages: modelMessages,
      maxOutputTokens: 2048,
    })

    return result.toUIMessageStreamResponse()
  } catch (e) {
    console.error("[POST /api/chat/ai-private]", e)
    return new Response(
      e instanceof Error ? e.message : "Unknown error",
      { status: 500 }
    )
  }
}
