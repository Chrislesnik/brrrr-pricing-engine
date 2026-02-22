import { auth } from "@clerk/nextjs/server"
import { streamText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { cleanAiResponse } from "@/lib/clean-ai-response"

export const runtime = "nodejs"
export const maxDuration = 120

type SendAllBody = {
  sessionId: string
  prompt: string
}

type ProgramRow = {
  id: string
  internal_name: string
  external_name: string
}

function parseWebhookResponse(json: unknown): string {
  if (Array.isArray(json)) {
    return ((json[0] as any)?.response ?? "").toString()
  }
  if (json && typeof json === "object") {
    return ((json as any)?.response ?? "").toString()
  }
  if (typeof json === "string") return json
  return ""
}

export async function POST(req: Request) {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })
  if (!orgId) return new Response("No active organization", { status: 400 })
  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return new Response("Organization not found", { status: 400 })

  const body = (await req.json().catch(() => null)) as SendAllBody | null
  if (!body?.sessionId || !String(body.prompt).trim()) {
    return new Response("Missing sessionId or prompt", { status: 400 })
  }
  const { sessionId, prompt } = body

  // 1) Persist user message
  await supabaseAdmin
    .from("ai_chat_messages")
    .insert({
      ai_chat_id: sessionId,
      user_id: userId,
      organization_id: orgUuid,
      user_type: "user",
      content: prompt,
    })
    .then(({ error }) => {
      if (error) console.error("Failed to insert user message:", error.message)
    })

  try {
    await supabaseAdmin
      .from("ai_chats")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
  } catch {
    // non-fatal
  }

  // 2) Fetch active programs with broker visibility filtering
  const { data: programRows } = await supabaseAdmin
    .from("programs")
    .select("id, internal_name, external_name")
    .eq("status", "active")
    .order("internal_name", { ascending: true })

  let programs: ProgramRow[] = (programRows ?? []).map((p) => ({
    id: p.id as string,
    internal_name: (p.internal_name as string) ?? "",
    external_name: (p.external_name as string) ?? "",
  }))

  const isBroker = orgRole === "org:broker" || orgRole === "broker"

  if (isBroker) {
    const { data: settings } = await supabaseAdmin
      .from("custom_broker_settings")
      .select("program_visibility")
      .eq("broker_org_id", orgUuid)
      .maybeSingle()
    const visibility = (settings?.program_visibility ?? {}) as Record<string, boolean>
    programs = programs.filter((p) => visibility[p.id] === true)
  }

  if (programs.length === 0) {
    return new Response("No programs available", { status: 400 })
  }

  // Build display name map based on user role
  const nameMap = new Map<string, string>()
  for (const p of programs) {
    nameMap.set(
      p.id,
      isBroker
        ? p.external_name || p.internal_name
        : p.internal_name || p.external_name,
    )
  }

  // 3) Fire all webhooks in parallel
  const webhookUrl =
    process.env.N8N_AI_CHAT_WEBHOOK_URL ||
    "https://n8n.axora.info/webhook/f567d7d1-8d33-4ac5-a7d8-ba6cfd6d720e"

  const results = await Promise.allSettled(
    programs.map(async (p) => {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ sessionId, program_id: p.id, prompt }),
      })
      const json = await res.json().catch(() => res.text())
      return { programId: p.id, response: json }
    }),
  )

  // 4) Build per-program context for Claude
  const programSections: string[] = []
  for (let i = 0; i < programs.length; i++) {
    const p = programs[i]
    const displayName = nameMap.get(p.id) ?? "Unknown Program"
    const result = results[i]

    let responseText = ""
    if (result.status === "fulfilled") {
      responseText = cleanAiResponse(parseWebhookResponse(result.value.response))
    }
    if (!responseText.trim()) {
      responseText = "This program did not return a response."
    }

    programSections.push(
      `--- ${displayName} ---\n${responseText}`,
    )
  }

  // 5) Build the list of allowed names for the guardrail
  const allowedNames = programs.map((p) => nameMap.get(p.id)!).join(", ")

  const systemPrompt = `You are a lending guidelines assistant with access to multiple loan programs. The only program names you may use are: ${allowedNames}. Never reveal, guess, or use any other name.

FORMATTING:
- ALWAYS bold program names using markdown **Name** syntax every time you mention one.
- Use markdown for emphasis on key values (bold for important numbers, etc.).

CRITICAL — ACCURACY:
- Report EXACTLY what each program's response says. NEVER fabricate, guess, or average values across programs.
- If Program A says 700 and Program B says 640, those are DIFFERENT values — report them separately. NEVER say "both programs" unless they truly state the identical value.
- Each program's data is independent. Treat each program's response as a separate source of truth.

RESPONSE STRATEGY — choose the right format based on the question type:

1. SIMPLE FACTUAL QUESTIONS (e.g. "what is the minimum/maximum X?", "what is the rate?", "is X allowed?"):
   - Lead with the most favorable value and which program it comes from.
   - If programs differ, list each: "**Program A**: 640 | **Program B**: 700".
   - If every program gives the exact same answer, state it once and note it applies across all programs.

2. ELIGIBILITY / QUALIFICATION QUESTIONS (e.g. "can a borrower with X do Y?", "does the borrower qualify?"):
   - Each program's evaluation is COMPLETELY INDEPENDENT. Never combine or cross-reference results.
   - If a program passes on one criterion but fails on another, it FAILS overall for that program.
   - Present each program separately when they disagree. If all agree, state the single result.

3. USER EXPLICITLY ASKS FOR ALL PROGRAMS (e.g. "what does each program say?", "show me all programs", "compare programs"):
   - Present each program in its own clearly labeled section with full detail.

ALWAYS:
- Be concise and direct.
- Default to the shortest helpful answer. Only expand when the question demands it or programs disagree.`

  const userContent = `The user asked: "${prompt}"

Below are the responses from each program's guidelines. Synthesize them using the response strategy above — default to concise unless the question requires per-program detail.

${programSections.join("\n\n")}`

  // 6) Stream Claude synthesis
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
    onFinish: async ({ text }) => {
      // Persist the complete assistant response
      const { error } = await supabaseAdmin.from("ai_chat_messages").insert({
        ai_chat_id: sessionId,
        user_id: userId,
        organization_id: orgUuid,
        user_type: "agent",
        content: text,
      })
      if (error) console.error("Failed to insert AI message:", error.message)

      try {
        await supabaseAdmin
          .from("ai_chats")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", sessionId)
          .eq("organization_id", orgUuid)
          .eq("user_id", userId)
      } catch {
        // non-fatal
      }
    },
  })

  return result.toTextStreamResponse()
}
