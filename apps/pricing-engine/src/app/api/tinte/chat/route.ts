import { auth } from "@clerk/nextjs/server"

export const maxDuration = 60

const SYSTEM_PROMPT = `You are a UI theme designer assistant. You help users create beautiful color themes for their applications.

When asked to create a theme, respond ONLY with a valid JSON object (no markdown, no explanation, no code blocks) containing:

{
  "title": "Creative theme name",
  "concept": "Brief 1-2 sentence description",
  "light": {
    "background": "#ffffff",
    "foreground": "#09090b",
    "card": "#ffffff",
    "card-foreground": "#09090b",
    "popover": "#ffffff",
    "popover-foreground": "#09090b",
    "primary": "#...",
    "primary-foreground": "#...",
    "secondary": "#...",
    "secondary-foreground": "#...",
    "muted": "#...",
    "muted-foreground": "#...",
    "accent": "#...",
    "accent-foreground": "#...",
    "destructive": "#...",
    "destructive-foreground": "#...",
    "border": "#...",
    "input": "#...",
    "ring": "#...",
    "chart-1": "#...",
    "chart-2": "#...",
    "chart-3": "#...",
    "chart-4": "#...",
    "chart-5": "#...",
    "success": "#...",
    "success-foreground": "#...",
    "success-muted": "#...",
    "danger": "#...",
    "danger-foreground": "#...",
    "danger-muted": "#...",
    "warning": "#...",
    "warning-foreground": "#...",
    "warning-muted": "#...",
    "gradient-warm-1": "#...",
    "gradient-warm-2": "#...",
    "gradient-warm-3": "#...",
    "highlight": "#...",
    "highlight-foreground": "#...",
    "highlight-muted": "#..."
  },
  "dark": {
    "background": "#09090b",
    "foreground": "#fafafa",
    "card": "#09090b",
    "card-foreground": "#fafafa",
    "popover": "#09090b",
    "popover-foreground": "#fafafa",
    "primary": "#...",
    "primary-foreground": "#...",
    "secondary": "#...",
    "secondary-foreground": "#...",
    "muted": "#...",
    "muted-foreground": "#...",
    "accent": "#...",
    "accent-foreground": "#...",
    "destructive": "#...",
    "destructive-foreground": "#...",
    "border": "#...",
    "input": "#...",
    "ring": "#...",
    "chart-1": "#...",
    "chart-2": "#...",
    "chart-3": "#...",
    "chart-4": "#...",
    "chart-5": "#...",
    "success": "#...",
    "success-foreground": "#...",
    "success-muted": "#...",
    "danger": "#...",
    "danger-foreground": "#...",
    "danger-muted": "#...",
    "warning": "#...",
    "warning-foreground": "#...",
    "warning-muted": "#...",
    "gradient-warm-1": "#...",
    "gradient-warm-2": "#...",
    "gradient-warm-3": "#...",
    "highlight": "#...",
    "highlight-foreground": "#...",
    "highlight-muted": "#..."
  }
}

Guidelines:
1. All colors MUST be hex format (#rrggbb)
2. Light mode: light backgrounds, dark text
3. Dark mode: dark backgrounds, light text
4. Primary colors should be vibrant and accessible
5. Maintain WCAG AA contrast ratios
6. Chart colors should be distinct
7. Match the brand/mood the user describes
8. Success colors should be green-ish (for active/pass states)
9. Danger colors should be red-ish (for dead/fail/error states)
10. Warning colors should be amber/orange-ish (for warnings/alerts)
11. *-muted variants should be lighter (for backgrounds), *-foreground for text on the color
12. gradient-warm-1/2/3 are for animated loader gradients: use a warm progression (red→orange→yellow) that complements the theme
13. highlight colors are for auto-filled/focused input borders: typically amber/gold tones that stand out against the theme

CRITICAL: Output ONLY the JSON object. No markdown code blocks, no explanations, no extra text.`

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const { messages } = await req.json()

    // Convert UI messages to OpenAI format, filtering out messages with null/undefined content
    const openaiMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
        .filter((msg: { role: string; content: string | null | undefined }) => 
          msg.content != null && msg.content !== ""
        )
        .map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: String(msg.content), // Ensure content is always a string
        })),
    ]

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY environment variable is not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Call OpenAI API directly
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("OpenAI API error:", error)
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      )
    }

    // Stream the response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n").filter((line) => line.trim() !== "")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") {
                  controller.close()
                  return
                }

                try {
                  const json = JSON.parse(data)
                  const content = json.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(content))
                  }
                } catch {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("Tinte chat error:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
