import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

const ACCOUNT_EXECUTIVE_ROLE_TYPE_ID = 6

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId: brokerOrgId } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { data: assignments, error } = await supabaseAdmin
      .from("role_assignments")
      .select("id, role_type_id, user_id, created_at")
      .eq("resource_type", "broker_org")
      .eq("resource_id", brokerOrgId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const userIds = (assignments ?? []).map((a) => a.user_id as string).filter(Boolean)
    let membersMap = new Map<string, { first_name: string | null; last_name: string | null; member_id: string }>()

    if (userIds.length > 0) {
      const { data: members } = await supabaseAdmin
        .from("organization_members")
        .select("id, user_id, first_name, last_name")
        .in("user_id", userIds)
      for (const m of members ?? []) {
        membersMap.set(m.user_id as string, {
          first_name: (m.first_name as string) ?? null,
          last_name: (m.last_name as string) ?? null,
          member_id: m.id as string,
        })
      }
    }

    const { data: roleTypes } = await supabaseAdmin
      .from("deal_role_types")
      .select("id, name")

    const roleMap = new Map<number, string>()
    for (const r of roleTypes ?? []) roleMap.set(r.id as number, r.name as string)

    const items = (assignments ?? []).map((a) => {
      const member = membersMap.get(a.user_id as string)
      return {
        assignment_id: a.id,
        account_manager_id: member?.member_id ?? null,
        user_id: a.user_id,
        role_type_id: a.role_type_id,
        role_name: roleMap.get(a.role_type_id as number) ?? null,
        name: member ? [member.first_name, member.last_name].filter(Boolean).join(" ") || null : null,
        created_at: a.created_at,
      }
    })

    return NextResponse.json({ items })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId: brokerOrgId } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const body = (await req.json().catch(() => ({}))) as {
      account_manager_id?: string
      user_id?: string
      role_type_id?: number
    }

    // Support both legacy account_manager_id (org member id) and direct user_id
    let targetUserId = body.user_id
    if (!targetUserId && body.account_manager_id) {
      const { data: mem } = await supabaseAdmin
        .from("organization_members")
        .select("user_id")
        .eq("id", body.account_manager_id)
        .maybeSingle()
      targetUserId = (mem?.user_id as string) ?? undefined
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "user_id or account_manager_id is required" }, { status: 400 })
    }

    const roleTypeId = body.role_type_id ?? ACCOUNT_EXECUTIVE_ROLE_TYPE_ID

    const { data, error } = await supabaseAdmin
      .from("role_assignments")
      .insert({
        resource_type: "broker_org",
        resource_id: brokerOrgId,
        role_type_id: roleTypeId,
        user_id: targetUserId,
        organization_id: orgUuid,
        created_by: userId,
      })
      .select("id")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already assigned" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, id: data.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId: brokerOrgId } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const url = new URL(req.url)
    const assignmentId = url.searchParams.get("assignment_id")
    if (!assignmentId) {
      return NextResponse.json({ error: "assignment_id query param is required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("role_assignments")
      .delete()
      .eq("id", assignmentId)
      .eq("resource_type", "broker_org")
      .eq("resource_id", brokerOrgId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
