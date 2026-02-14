import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function ensureXactusRow(orgUuid: string, userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("workflow_integrations")
    .select("id")
    .eq("organization_id", orgUuid)
    .eq("user_id", userId)
    .eq("type", "xactus")
    .is("name", null)
    .maybeSingle()

  if (data?.id) return data.id as string

  const { data: created, error } = await supabaseAdmin
    .from("workflow_integrations")
    .insert({ organization_id: orgUuid, user_id: userId, type: "xactus", name: null, config: { status: "true" } })
    .select("id")
    .single()
  if (error) throw error
  return created.id as string
}

export async function GET(_req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { data } = await supabaseAdmin
      .from("workflow_integrations")
      .select("id, config")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .eq("type", "xactus")
      .is("name", null)
      .maybeSingle()

    if (!data) return NextResponse.json({ row: null })

    const config = (data.config as Record<string, unknown>) || {}
    return NextResponse.json({
      row: {
        integration_id: data.id,
        status: config.status === "true",
        account_user: (config.account_user as string) || null,
        account_password: (config.account_password as string) || null,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const accountUser = (body?.account_user as string | undefined)?.trim()
    const accountPassword = (body?.account_password as string | undefined)?.trim()
    if (!accountUser) return NextResponse.json({ error: "account_user required" }, { status: 400 })
    if (!accountPassword) return NextResponse.json({ error: "account_password required" }, { status: 400 })

    const rowId = await ensureXactusRow(orgUuid, userId)

    const { data: existing } = await supabaseAdmin
      .from("workflow_integrations")
      .select("config")
      .eq("id", rowId)
      .single()

    const existingConfig = (existing?.config as Record<string, unknown>) || {}
    const updatedConfig = { ...existingConfig, account_user: accountUser, account_password: accountPassword, status: "true" }

    const { error } = await supabaseAdmin
      .from("workflow_integrations")
      .update({ config: updatedConfig })
      .eq("id", rowId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, integration_id: rowId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
