import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { data: member, error: memErr } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .maybeSingle()
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })
    const orgMemberId = (member?.id as string) ?? null
    if (!orgMemberId) return NextResponse.json({ error: "Organization member not found" }, { status: 404 })

    const { data, error } = await supabaseAdmin
      .from("default_broker_settings")
      .select("allow_ysp, allow_buydown_rate, allow_white_labeling, program_visibility, rates")
      .eq("organization_id", orgUuid)
      .eq("organization_member_id", orgMemberId)
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

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const body = (await req.json().catch(() => ({}))) as {
      allow_ysp?: boolean
      allow_buydown_rate?: boolean
      allow_white_labeling?: boolean
      program_visibility?: unknown
      rates?: unknown
    }

    // Resolve organization_member_id for this user within the org
    const { data: member, error: memErr } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .single()
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })
    const orgMemberId = (member?.id as string) ?? null
    if (!orgMemberId) return NextResponse.json({ error: "Organization member not found" }, { status: 404 })

    const payload = {
      organization_id: orgUuid,
      organization_member_id: orgMemberId,
      allow_ysp: body.allow_ysp === true,
      allow_buydown_rate: body.allow_buydown_rate === true,
      allow_white_labeling: body.allow_white_labeling === true,
      program_visibility: body.program_visibility ?? {},
      rates: body.rates ?? [],
    }

    const { error } = await supabaseAdmin
      .from("default_broker_settings")
      .upsert(payload, { onConflict: "organization_id,organization_member_id" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


