import { streamText, type UIMessage, convertToModelMessages } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const {
    messages,
    model,
    webSearch,
  }: {
    messages: UIMessage[]
    model?: string
    webSearch?: boolean
  } = await req.json()

  const result = streamText({
    model: webSearch ? "perplexity/sonar" : model ?? "openai/gpt-4o",
    messages: convertToModelMessages(messages),
    system:
      "You are an AI assistant that helps loan officers price loans and answer questions succinctly.",
  })

  return result.toTextStreamResponse()
}


