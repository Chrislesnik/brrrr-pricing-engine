import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: brokerOrgId } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    if (!brokerOrgId) return NextResponse.json({ error: "Missing broker org id" }, { status: 400 })

    const { data: brokerOrg, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("id", brokerOrgId)
      .eq("is_internal_yn", false)
      .maybeSingle()
    if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })
    if (!brokerOrg) return NextResponse.json({ error: "Broker organization not found" }, { status: 404 })

    const { data, error } = await supabaseAdmin
      .from("custom_broker_settings")
      .select("allow_ysp, allow_buydown_rate, allow_white_labeling, program_visibility, rates")
      .eq("organization_id", orgUuid)
      .eq("broker_org_id", brokerOrgId)
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
    const { id: brokerOrgId } = await context.params
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    if (!brokerOrgId) return NextResponse.json({ error: "Missing broker org id" }, { status: 400 })

    const { data: brokerOrg, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("id", brokerOrgId)
      .eq("is_internal_yn", false)
      .maybeSingle()
    if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })
    if (!brokerOrg) return NextResponse.json({ error: "Broker organization not found" }, { status: 404 })

    const body = (await req.json().catch(() => ({}))) as {
      allow_ysp?: boolean
      allow_buydown_rate?: boolean
      allow_white_labeling?: boolean
      program_visibility?: unknown
      rates?: unknown
    }

    const { data: member } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .maybeSingle()
    const orgMemberId = (member?.id as string) ?? null

    const payload = {
      "default": false,
      allow_ysp: body.allow_ysp === true,
      allow_buydown_rate: body.allow_buydown_rate === true,
      allow_white_labeling: body.allow_white_labeling === true,
      program_visibility: body.program_visibility ?? {},
      rates: body.rates ?? [],
    }

    const { error, data } = await supabaseAdmin
      .from("custom_broker_settings")
      .update(payload)
      .eq("organization_id", orgUuid)
      .eq("broker_org_id", brokerOrgId)
      .select("broker_org_id")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (!data || data.length === 0) {
      const { error: insertErr } = await supabaseAdmin
        .from("custom_broker_settings")
        .insert({
          organization_id: orgUuid,
          organization_member_id: orgMemberId,
          broker_org_id: brokerOrgId,
          ...payload,
        })
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
      return NextResponse.json({ ok: true, created: true })
    }

    return NextResponse.json({ ok: true, updated: data.length })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
