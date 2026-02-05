import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

type SendBody = {
  sessionId: string
  program_id?: string | null
  prompt: string
}

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ ok: false, error: "No active organization" }, { status: 400 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ ok: false, error: "Organization not found" }, { status: 400 })

    const body = (await req.json().catch(() => null)) as SendBody | null
    if (!body || !body.sessionId || !String(body.prompt).trim()) {
      return NextResponse.json({ ok: false, error: "Missing sessionId or prompt" }, { status: 400 })
    }
    const sessionId = body.sessionId
    const programId = body.program_id || null
    const prompt = String(body.prompt) // preserve newlines and spacing

    // 1) Persist user message immediately
    const { error: insertUserErr } = await supabaseAdmin.from("ai_chat_messages").insert({
      ai_chat_id: sessionId,
      user_id: userId,
      organization_id: orgUuid,
      user_type: "user",
      content: prompt,
    })
    if (insertUserErr) {
      // Don't fail the whole request; still attempt to call webhook
      console.error("Failed to insert user message:", insertUserErr.message)
    }
    // Touch chat's last_used_at immediately on user activity
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

    // 2) Determine webhook URL (always post to the provided n8n webhook,
    // allows optional override via env in non-prod/dev)
    const webhookUrl =
      process.env.N8N_AI_CHAT_WEBHOOK_URL ||
      "https://n8n.axora.info/webhook/176a57ac-a953-436d-aa86-e993fa8adbe8"
    if (!webhookUrl) {
      return NextResponse.json({ ok: false, error: "No webhook URL configured" }, { status: 500 })
    }

    // 3) Call n8n webhook
    const webhookPayload = {
      sessionId,
      program_id: programId,
      prompt,
    }
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(webhookPayload),
    })
    // Try to parse JSON responses like:
    // { response: "..." } OR [ { response: "..." } ]
    let aiResponseText = ""
    try {
      const json = (await res.json()) as unknown
      if (Array.isArray(json)) {
        const first = json[0] as any
        aiResponseText = (first?.response ?? "").toString()
      } else if (json && typeof json === "object") {
        aiResponseText = ((json as any)?.response ?? "").toString()
      } else if (typeof json === "string") {
        aiResponseText = json
      }
    } catch {
      // fall back to text()
      aiResponseText = await res.text().catch(() => "")
    }
    // Preserve newlines/spaces; only fallback if the response is effectively empty
    const effective = (aiResponseText || "")
    if (!effective || effective.replace(/\s/g, "") === "") {
      aiResponseText = "Sorry, I couldn't generate a response."
    }

    // 4) Persist assistant response
    const { error: insertAiErr } = await supabaseAdmin.from("ai_chat_messages").insert({
      ai_chat_id: sessionId,
      user_id: userId,
      organization_id: orgUuid,
      user_type: "agent",
      content: aiResponseText,
    })
    if (insertAiErr) {
      console.error("Failed to insert AI message:", insertAiErr.message)
    }
    // Ensure chat's last_used_at reflects the most recent assistant response
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

    return NextResponse.json({ ok: true, response: aiResponseText })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}


