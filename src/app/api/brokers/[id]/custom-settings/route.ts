import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: brokerId } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    if (!brokerId) return NextResponse.json({ error: "Missing broker id" }, { status: 400 })

    // Verify the broker belongs to this org
    const { data: broker, error: brokerErr } = await supabaseAdmin
      .from("brokers")
      .select("id")
      .eq("id", brokerId)
      .eq("organization_id", orgUuid)
      .maybeSingle()
    if (brokerErr) return NextResponse.json({ error: brokerErr.message }, { status: 500 })
    if (!broker) return NextResponse.json({ error: "Broker not found" }, { status: 404 })

    const { data, error } = await supabaseAdmin
      .from("custom_broker_settings")
      .select("allow_ysp, allow_buydown_rate, allow_white_labeling, program_visibility, rates")
      .eq("organization_id", orgUuid)
      .eq("broker_id", brokerId)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      allow_ysp: data?.allow_ysp ?? false,
      allow_buydown_rate: data?.allow_buydown_rate ?? false,
      allow_white_labeling: data?.allow_white_labeling ?? false,
      program_visibility: data?.program_visibility ?? {},
      rates: data?.rates ?? [],
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: brokerId } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    if (!brokerId) return NextResponse.json({ error: "Missing broker id" }, { status: 400 })

    // Verify the broker belongs to this org
    const { data: broker, error: brokerErr } = await supabaseAdmin
      .from("brokers")
      .select("id")
      .eq("id", brokerId)
      .eq("organization_id", orgUuid)
      .maybeSingle()
    if (brokerErr) return NextResponse.json({ error: brokerErr.message }, { status: 500 })
    if (!broker) return NextResponse.json({ error: "Broker not found" }, { status: 404 })

    const body = (await req.json().catch(() => ({}))) as {
      allow_ysp?: boolean
      allow_buydown_rate?: boolean
      allow_white_labeling?: boolean
      program_visibility?: unknown
      rates?: unknown
    }

    // Update only; do NOT insert or touch organization_member_id
    const { error, data } = await supabaseAdmin
      .from("custom_broker_settings")
      .update({
        // Mark as customized so permissions show CUSTOM
        "default": false,
        allow_ysp: body.allow_ysp === true,
        allow_buydown_rate: body.allow_buydown_rate === true,
        allow_white_labeling: body.allow_white_labeling === true,
        program_visibility: body.program_visibility ?? {},
        rates: body.rates ?? [],
      })
      .eq("organization_id", orgUuid)
      .eq("broker_id", brokerId)
      .select("broker_id")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Custom settings not initialized for this broker" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, updated: data.length })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


