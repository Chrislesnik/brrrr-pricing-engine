import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ items: [], error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ items: [], error: "No active organization" }, { status: 400 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ items: [], error: "Organization not found" }, { status: 400 })

    const { id } = await context.params
    if (!id) return NextResponse.json({ items: [], error: "Missing chat id" }, { status: 400 })

    // Verify the chat belongs to this user/org
    const { data: chat, error: chatErr } = await supabaseAdmin
      .from("ai_chats")
      .select("id")
      .eq("id", id)
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .maybeSingle()
    if (chatErr || !chat) {
      return NextResponse.json({ items: [], error: "Chat not found" }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from("ai_chat_messages")
      .select("id, user_type, content, created_at")
      .eq("ai_chat_id", id)
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: true })
    if (error) {
      return NextResponse.json({ items: [], error: error.message }, { status: 200 })
    }
    const items =
      (data ?? []).map((m) => ({
        id: m.id as string,
        role: (m.user_type === "user" ? "user" : "assistant") as "user" | "assistant",
        content: (m.content as string) || "",
        created_at: m.created_at as string,
      })) ?? []
    return NextResponse.json({ items })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ items: [], error: msg }, { status: 500 })
  }
}


