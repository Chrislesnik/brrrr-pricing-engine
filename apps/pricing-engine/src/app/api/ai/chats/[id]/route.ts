export const runtime = "nodejs"

function resolveId(req: Request, params: { id?: string } | undefined): string {
  let id = String(params?.id || "").trim()
  if (!id) {
    try {
      const url = new URL(req.url)
      const parts = url.pathname.split("/")
      id = String(parts.pop() || parts.pop() || "").trim()
    } catch {
      id = ""
    }
  }
  return id
}
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 200 })
    }
    const params = await context.params
    const id = resolveId(req, params)
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing chat id" }, { status: 200 })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ ok: false, error: "Org not found" }, { status: 200 })

    const body = await req.json().catch(() => ({}))
    const name =
      typeof body?.name === "string" && body.name.trim().length ? body.name.trim().slice(0, 120) : undefined
    if (!name) return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 200 })

    const { data, error } = await supabaseAdmin
      .from("ai_chats")
      .update({ name, last_used_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .select("id, name, created_at, last_used_at")
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
    }
    return NextResponse.json({ ok: true, chat: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update chat"
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 200 })
    }
    const params = await context.params
    const id = resolveId(req, params)
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing chat id" }, { status: 200 })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ ok: false, error: "Org not found" }, { status: 200 })

    const { error } = await supabaseAdmin
      .from("ai_chats")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
    }
    // Rely on ON DELETE CASCADE in the database to remove messages
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete chat"
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  }
}


