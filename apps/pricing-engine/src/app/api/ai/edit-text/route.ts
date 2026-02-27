import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export const maxDuration = 30

const SYSTEM_PROMPTS: Record<string, string> = {
  improve:
    "You are a professional editor. Improve the writing quality of the given text while preserving its meaning. Make it clearer, more concise, and more engaging. Return only the improved text, nothing else.",
  fix_grammar:
    "You are a grammar expert. Fix all grammar, spelling, and punctuation errors in the given text. Preserve the original meaning and tone. Return only the corrected text, nothing else.",
  make_shorter:
    "You are a concise editor. Shorten the given text while preserving its key meaning. Remove redundancy and unnecessary words. Return only the shortened text, nothing else.",
  make_longer:
    "You are a content expander. Elaborate on the given text, adding detail and depth while keeping the same tone and style. Return only the expanded text, nothing else.",
  simplify:
    "You are a plain-language editor. Simplify the given text so it is easy to understand at a 6th-grade reading level. Preserve the meaning. Return only the simplified text, nothing else.",
  professional:
    "You are a business writing expert. Rewrite the given text in a professional, formal tone suitable for business communication. Return only the rewritten text, nothing else.",
  casual:
    "You are a casual writing expert. Rewrite the given text in a friendly, conversational tone. Return only the rewritten text, nothing else.",
  continue:
    "You are a skilled writer. Continue writing from where the given text leaves off. Match the existing tone and style. Write 2-3 additional sentences. Return only the continuation (do not repeat the original text).",
  translate:
    "You are a professional translator. Translate the given text into the target language specified. Preserve meaning, tone, and formatting. Return only the translated text, nothing else.",
  generate:
    "You are a skilled content writer for professional emails. Generate well-formatted content based on the user's prompt. Use markdown formatting: headings (##, ###), bold (**text**), italic (*text*), bullet lists (- item), numbered lists (1. item), links, and code blocks where appropriate. Return only the formatted content, nothing else.",
}

export async function POST(req: Request) {
  const { text, action, language, prompt } = (await req.json()) as {
    text: string
    action: string
    language?: string
    prompt?: string
  }

  if (!action) {
    return new Response(JSON.stringify({ error: "action is required" }), {
      status: 400,
    })
  }

  if (action !== "generate" && !text) {
    return new Response(JSON.stringify({ error: "text is required" }), {
      status: 400,
    })
  }

  const systemPrompt = SYSTEM_PROMPTS[action]
  if (!systemPrompt) {
    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
    })
  }

  let userMessage: string
  if (action === "generate") {
    userMessage = prompt || text || ""
  } else if (action === "translate" && language) {
    userMessage = `Translate the following text to ${language}:\n\n${text}`
  } else {
    userMessage = text
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  return result.toTextStreamResponse()
}
