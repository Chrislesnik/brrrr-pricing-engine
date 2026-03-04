import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function ensureFloifyRow(orgUuid: string, userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("integration_setup")
    .select("id")
    .eq("organization_id", orgUuid)
    .eq("user_id", userId)
    .eq("type", "floify")
    .is("name", null)
    .maybeSingle()

  if (data?.id) return data.id as string

  const { data: created, error } = await supabaseAdmin
    .from("integration_setup")
    .insert({ organization_id: orgUuid, user_id: userId, type: "floify", name: null, config: { status: "true" } })
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
      .from("integration_setup")
      .select("id, config")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .eq("type", "floify")
      .is("name", null)
      .maybeSingle()

    if (!data) return NextResponse.json({ row: null })

    const config = (data.config as Record<string, unknown>) || {}
    return NextResponse.json({
      row: {
        integration_id: data.id,
        status: config.status === "true",
        x_api_key: (config.x_api_key as string) || null,
        user_api_key: (config.user_api_key as string) || null,
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

    const rowId = await ensureFloifyRow(orgUuid, userId)

    // Get existing config to preserve status
    const { data: existing } = await supabaseAdmin
      .from("integration_setup")
      .select("config")
      .eq("id", rowId)
      .single()

    const existingConfig = (existing?.config as Record<string, unknown>) || {}
    const updatedConfig = { ...existingConfig, x_api_key: xApiKey, user_api_key: userApiKey, status: "true" }

    const { error } = await supabaseAdmin
      .from("integration_setup")
      .update({ config: updatedConfig })
      .eq("id", rowId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, integration_id: rowId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
