import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

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

    const { data, error } = await supabaseAdmin
      .from("organization_account_managers")
      .select("id, account_manager_id, created_at")
      .eq("organization_id", brokerOrgId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const managerIds = (data ?? []).map((r) => r.account_manager_id as string)
    let managers: { id: string; first_name: string | null; last_name: string | null; user_id: string | null }[] = []
    if (managerIds.length > 0) {
      const { data: members, error: memErr } = await supabaseAdmin
        .from("organization_members")
        .select("id, first_name, last_name, user_id")
        .in("id", managerIds)
      if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })
      managers = (members ?? []).map((m) => ({
        id: m.id as string,
        first_name: (m.first_name as string) ?? null,
        last_name: (m.last_name as string) ?? null,
        user_id: (m.user_id as string) ?? null,
      }))
    }

    const items = (data ?? []).map((row) => {
      const mgr = managers.find((m) => m.id === row.account_manager_id)
      return {
        assignment_id: row.id,
        account_manager_id: row.account_manager_id,
        name: mgr ? [mgr.first_name, mgr.last_name].filter(Boolean).join(" ") || null : null,
        user_id: mgr?.user_id ?? null,
        created_at: row.created_at,
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
    }
    if (!body.account_manager_id) {
      return NextResponse.json({ error: "account_manager_id is required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("organization_account_managers")
      .insert({
        organization_id: brokerOrgId,
        account_manager_id: body.account_manager_id,
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
      .from("organization_account_managers")
      .delete()
      .eq("id", assignmentId)
      .eq("organization_id", brokerOrgId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
