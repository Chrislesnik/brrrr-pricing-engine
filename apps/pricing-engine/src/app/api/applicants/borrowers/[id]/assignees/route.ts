import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })
    const { id } = await ctx.params
    const { data, error } = await supabaseAdmin.from("borrowers").select("assigned_to").eq("id", id).eq("organization_id", orgUuid).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const arr = Array.isArray(data?.assigned_to) ? (data?.assigned_to as string[]) : []
    return NextResponse.json({ userIds: arr })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })
    const { id } = await ctx.params
    const body = (await req.json().catch(() => ({}))) as { userIds?: string[] }
    const userIds = Array.isArray(body.userIds) ? body.userIds.filter(Boolean) : []
    const { error } = await supabaseAdmin.from("borrowers").update({ assigned_to: userIds }).eq("id", id).eq("organization_id", orgUuid)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}


