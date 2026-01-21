import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function ensureXactusIntegration(orgUuid: string, userId: string) {
  const type = "xactus"
  const { data, error } = await supabaseAdmin
    .from("integrations")
    .upsert(
      {
        organization_id: orgUuid,
        user_id: userId,
        type,
        status: true,
      },
      { onConflict: "organization_id,user_id,type" }
    )
    .select("id")
    .maybeSingle()
  if (error) throw error
  return data?.id as string
}

export async function GET(_req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("integrations")
      .select("id, status")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .eq("type", "xactus")
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ row: null })

    const { data: xactusRow, error: xactusErr } = await supabaseAdmin
      .from("integrations_xactus")
      .select("account_user, account_password")
      .eq("integration_id", data.id)
      .maybeSingle()
    if (xactusErr) return NextResponse.json({ error: xactusErr.message }, { status: 500 })

    return NextResponse.json({
      row: {
        integration_id: data.id,
        status: data.status,
        account_user: xactusRow?.account_user ?? null,
        account_password: xactusRow?.account_password ?? null,
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

    const integrationId = await ensureXactusIntegration(orgUuid, userId)

    const { error: upErr } = await supabaseAdmin
      .from("integrations_xactus")
      .upsert({ integration_id: integrationId, account_user: accountUser, account_password: accountPassword })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, integration_id: integrationId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
