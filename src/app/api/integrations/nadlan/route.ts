import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function ensureNadlanIntegration(orgUuid: string, userId: string) {
  const type = "nadlan"
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
      .eq("type", "nadlan")
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ row: null })

    const { data: nadlanRow, error: nadlanErr } = await supabaseAdmin
      .from("integrations_nadlan")
      .select("username, password")
      .eq("integration_id", data.id)
      .maybeSingle()
    if (nadlanErr) return NextResponse.json({ error: nadlanErr.message }, { status: 500 })

    return NextResponse.json({
      row: {
        integration_id: data.id,
        status: data.status,
        username: nadlanRow?.username ?? null,
        password: nadlanRow?.password ?? null,
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
    const username = (body?.username as string | undefined)?.trim()
    const password = (body?.password as string | undefined)?.trim()
    if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })
    if (!password) return NextResponse.json({ error: "password required" }, { status: 400 })

    const integrationId = await ensureNadlanIntegration(orgUuid, userId)

    const { error: upErr } = await supabaseAdmin
      .from("integrations_nadlan")
      .upsert({ integration_id: integrationId, username, password })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, integration_id: integrationId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
