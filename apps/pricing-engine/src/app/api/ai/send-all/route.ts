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

HOW TO RESPOND:
- Give ONE single best answer to the user's question. Pick the most relevant or most favorable response from all programs and state it clearly, mentioning which program (**bolded**) it comes from.
- Do NOT list each program separately. Do NOT repeat the answer for every program. The user wants one concise answer, not a breakdown.
- Only mention a second program if its answer is meaningfully different AND relevant (e.g. one allows something another doesn't). Keep it to one extra sentence at most.
- If the user explicitly asks to compare all programs or asks "what does each program say", then and only then provide a per-program breakdown.

ACCURACY:
- Report EXACTLY what the program's response says. Never fabricate or guess values.
- Each program's data is independent — never merge or average values across programs.`

  const userContent = `The user asked: "${prompt}"

Below are the responses from each program. Pick the single best answer and attribute it to the program by name.

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
