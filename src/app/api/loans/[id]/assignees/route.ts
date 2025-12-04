import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const orgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null

    const { data, error } = await supabaseAdmin
      .from("loans")
      .select("assigned_to_user_id, organization_id")
      .eq("id", id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (orgUuid && data.organization_id && data.organization_id !== orgUuid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const ids = Array.isArray(data.assigned_to_user_id) ? (data.assigned_to_user_id as string[]) : []
    return NextResponse.json({ userIds: ids })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const body = (await req.json().catch(() => null)) as { userIds?: string[] } | null
    if (!body || !Array.isArray(body.userIds)) {
      return NextResponse.json({ error: "Missing userIds" }, { status: 400 })
    }
    const userIds = body.userIds.filter((v) => typeof v === "string")

    // Optional: verify userIds belong to the same org
    const orgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null
    if (orgUuid) {
      const { data: validMembers, error: membersErr } = await supabaseAdmin
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgUuid)
      if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 500 })
      const validSet = new Set((validMembers ?? []).map((m) => m.user_id as string))
      for (const uid of userIds) {
        if (!validSet.has(uid)) {
          return NextResponse.json({ error: "One or more users not in organization" }, { status: 400 })
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("loans")
      .update({ assigned_to_user_id: userIds })
      .eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


