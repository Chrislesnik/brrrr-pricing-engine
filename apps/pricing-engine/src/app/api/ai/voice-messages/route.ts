import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

interface VoiceMessage {
  role: "user" | "assistant"
  content: string
}

interface VoiceMessagesBody {
  chatId: string
  messages: VoiceMessage[]
}

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ ok: false, error: "No active organization" }, { status: 400 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ ok: false, error: "Organization not found" }, { status: 400 })

    const body = (await req.json().catch(() => null)) as VoiceMessagesBody | null
    if (!body?.chatId || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ ok: false, error: "Missing chatId or messages" }, { status: 400 })
    }

    const rows = body.messages.map((m) => ({
      ai_chat_id: body.chatId,
      user_id: userId,
      organization_id: orgUuid,
      user_type: m.role === "user" ? "user" : "agent",
      content: m.content,
    }))

    const { error } = await supabaseAdmin.from("ai_chat_messages").insert(rows)
    if (error) {
      console.error("Failed to insert voice messages:", error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    await supabaseAdmin
      .from("ai_chats")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", body.chatId)
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)

    return NextResponse.json({ ok: true, inserted: rows.length })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
