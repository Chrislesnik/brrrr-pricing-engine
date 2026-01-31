import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function ensureFloifyIntegration(orgUuid: string, userId: string) {
  const type = "floify"
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

export async function GET(req: NextRequest) {
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
      .eq("type", "floify")
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ row: null })

    const { data: floifyRow, error: floifyErr } = await supabaseAdmin
      .from("integrations_floify")
      .select("x_api_key, user_api_key")
      .eq("integration_id", data.id)
      .maybeSingle()
    if (floifyErr) return NextResponse.json({ error: floifyErr.message }, { status: 500 })

    return NextResponse.json({
      row: {
        integration_id: data.id,
        status: data.status,
        x_api_key: floifyRow?.x_api_key ?? null,
        user_api_key: floifyRow?.user_api_key ?? null,
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
    const xApiKey = (body?.x_api_key as string | undefined)?.trim()
    const userApiKey = (body?.user_api_key as string | undefined)?.trim()
    if (!xApiKey) return NextResponse.json({ error: "x_api_key required" }, { status: 400 })
    if (!userApiKey) return NextResponse.json({ error: "user_api_key required" }, { status: 400 })

    const integrationId = await ensureFloifyIntegration(orgUuid, userId)

    const { error: upErr } = await supabaseAdmin
      .from("integrations_floify")
      .upsert({ integration_id: integrationId, x_api_key: xApiKey, user_api_key: userApiKey })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, integration_id: integrationId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
