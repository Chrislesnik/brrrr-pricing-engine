import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { getVoiceContext } from "../context"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { cleanAiResponse } from "@/lib/clean-ai-response"

export const runtime = "nodejs"
export const maxDuration = 120

function parseWebhookJson(raw: string): string {
  if (!raw.trim()) return ""
  try {
    const json = JSON.parse(raw) as unknown
    if (Array.isArray(json)) return String((json[0] as any)?.response ?? "")
    if (json && typeof json === "object") return String((json as any)?.response ?? "")
    if (typeof json === "string") return json
  } catch {
    return raw
  }
  return ""
}

async function handleAllPrograms(question: string, sessionId: string, orgUuid: string | null): Promise<string> {
  const { data: programRows } = await supabaseAdmin
    .from("programs")
    .select("id, internal_name, external_name")
    .eq("status", "active")
    .order("internal_name", { ascending: true })

  const programs = (programRows ?? []).map((p) => ({
    id: p.id as string,
    internal_name: (p.internal_name as string) ?? "",
    external_name: (p.external_name as string) ?? "",
  }))

  let isBroker = false
  if (orgUuid) {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("is_internal_yn")
      .eq("id", orgUuid)
      .maybeSingle()
    isBroker = org?.is_internal_yn === false
  }

  if (isBroker && orgUuid) {
    const { data: settings } = await supabaseAdmin
      .from("custom_broker_settings")
      .select("program_visibility")
      .eq("broker_org_id", orgUuid)
      .maybeSingle()
    const visibility = (settings?.program_visibility ?? {}) as Record<string, boolean>
    const filtered = programs.filter((p) => visibility[p.id] === true)
    programs.length = 0
    programs.push(...filtered)
  }

  if (programs.length === 0) return "No programs are currently available."

  const nameMap = new Map<string, string>()
  for (const p of programs) {
    nameMap.set(p.id, isBroker ? p.external_name || p.internal_name : p.internal_name || p.external_name)
  }

  const webhookUrl =
    process.env.N8N_AI_CHAT_WEBHOOK_URL ||
    "https://n8n.axora.info/webhook/f567d7d1-8d33-4ac5-a7d8-ba6cfd6d720e"

  const results = await Promise.allSettled(
    programs.map(async (p) => {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ sessionId, program_id: p.id, prompt: question }),
      })
      return { programId: p.id, raw: await res.text() }
    }),
  )

  const sections: string[] = []
  for (let i = 0; i < programs.length; i++) {
    const displayName = nameMap.get(programs[i].id) ?? "Unknown"
    const r = results[i]
    let text = ""
    if (r.status === "fulfilled") text = cleanAiResponse(parseWebhookJson(r.value.raw))
    if (!text.trim()) text = "This program did not return a response."
    sections.push(`--- ${displayName} ---\n${text}`)
  }

  const allowedNames = programs.map((p) => nameMap.get(p.id)!).join(", ")

  const systemPrompt = `You are a lending guidelines voice assistant. The only program names you may use are: ${allowedNames}. Never reveal any other name.

HOW TO RESPOND:
- Give ONE single best answer. Pick the most relevant or most favorable response from all programs and say which program it comes from.
- Do NOT list each program separately. The user wants one concise answer, not a breakdown.
- Only mention a second program if its answer is meaningfully different and relevant. Keep it brief.
- If the user explicitly asks to compare all programs, only then give a per-program breakdown.
- Report EXACTLY what the program says. Never fabricate or average values.

Keep answers concise and suitable for voice — short sentences, no markdown.`

  const userContent = `The user asked: "${question}"\n\n${sections.join("\n\n")}`

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  })

  return text.trim() || "Sorry, I couldn't generate a response."
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message

    if (message?.type === "tool-calls") {
      const toolCallList = message.toolCallList ?? []
      const results = []

      for (const tc of toolCallList) {
        const toolName = tc.function?.name ?? tc.name ?? ""
        const toolArgs = tc.function?.arguments ?? tc.parameters ?? {}
        const toolCallId = tc.id

        if (toolName === "query_guidelines") {
          const question = String(toolArgs?.question ?? "")
          const ctx = getVoiceContext()
          const programId = ctx.programId
          const sessionId = ctx.sessionId
          const isAllPrograms = !programId || programId === "all"

          let answer = ""

          if (isAllPrograms) {
            try {
              answer = await handleAllPrograms(question, sessionId, ctx.orgUuid)
            } catch {
              answer = "Sorry, I could not retrieve the information right now."
            }
          } else {
            const webhookUrl =
              process.env.N8N_AI_CHAT_WEBHOOK_URL ||
              "https://n8n.axora.info/webhook/f567d7d1-8d33-4ac5-a7d8-ba6cfd6d720e"

            try {
              const res = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
                body: JSON.stringify({ sessionId, program_id: programId, prompt: question }),
              })
              answer = parseWebhookJson(await res.text())
            } catch {
              answer = "Sorry, I could not retrieve the information right now."
            }

            answer = cleanAiResponse(answer)
          }

          if (!answer.trim()) {
            answer = "Sorry, I couldn't generate a response."
          }

          if (sessionId && sessionId !== "voice-session" && question.trim() && ctx.userId && ctx.orgUuid) {
            try {
              await supabaseAdmin.from("ai_chat_messages").insert([
                { ai_chat_id: sessionId, user_id: ctx.userId, organization_id: ctx.orgUuid, user_type: "user", content: question },
                { ai_chat_id: sessionId, user_id: ctx.userId, organization_id: ctx.orgUuid, user_type: "agent", content: answer },
              ])
              await supabaseAdmin
                .from("ai_chats")
                .update({ last_used_at: new Date().toISOString() })
                .eq("id", sessionId)
            } catch {
              // non-fatal
            }
          }

          results.push({
            name: "query_guidelines",
            toolCallId,
            result: answer,
          })
        } else {
          results.push({
            name: toolName,
            toolCallId,
            result: "Unknown tool",
          })
        }
      }

      return NextResponse.json({ results })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
