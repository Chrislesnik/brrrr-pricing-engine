export const runtime = "nodejs"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export async function GET() {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json({ items: [] })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ items: [] })
    const { data, error } = await supabaseAdmin
      .from("ai_chats")
      .select("id, name, created_at, last_used_at")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .order("last_used_at", { ascending: false })
    if (error) {
      return NextResponse.json({ items: [], error: error.message }, { status: 200 })
    }
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list chats"
    return NextResponse.json({ items: [], error: msg }, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 200 })
    }
    let name = "New chat"
    try {
      const body = await req.json()
      if (typeof body?.name === "string" && body.name.trim().length) {
        name = body.name.trim().slice(0, 120)
      }
    } catch {
      // ignore body parse issues; fall back to default name
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ ok: false, error: "Org not found" }, { status: 200 })
    const { data, error } = await supabaseAdmin
      .from("ai_chats")
      .insert({ user_id: userId, organization_id: orgUuid, name, last_used_at: new Date().toISOString() })
      .select("id, name, created_at, last_used_at")
      .single()
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
    }
    return NextResponse.json({ ok: true, chat: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create chat"
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  }
}


