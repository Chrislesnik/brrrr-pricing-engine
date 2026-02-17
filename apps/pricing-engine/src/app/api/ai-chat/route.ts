import { createOpenAI } from "@ai-sdk/openai"
import type { ChatRequestBody } from "@grapesjs/studio-sdk-plugins/dist/aiChat"
import { createStreamResponse } from "@grapesjs/studio-sdk-plugins/dist/aiChat/server"

export async function POST(req: Request) {
  const { messages, projectContext }: ChatRequestBody = await req.json()

  const openaiProvider = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

  return createStreamResponse({
    messages,
    projectContext,
    abortSignal: req.signal,
    model: openaiProvider("gpt-4o"),
    agentCode: { model: openaiProvider("gpt-4o") },
  })
}
