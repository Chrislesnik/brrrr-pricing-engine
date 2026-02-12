import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ loanId: string }> }
) {
  try {
    const { orgId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })
    const { loanId } = await ctx.params
    if (!loanId) return NextResponse.json({ error: "Missing loan id" }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from("application_background")
      .select("*")
      .eq("application_id", loanId)
      .eq("organization_id", orgUuid)
      .order("party_index", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ rows: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ loanId: string }> }
) {
  try {
    const { orgId } = await auth()
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })
    const { loanId } = await ctx.params
    if (!loanId) return NextResponse.json({ error: "Missing loan id" }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const partyIndex = typeof body.party_index === "number" ? body.party_index : 0

    const row: Record<string, unknown> = {
      application_id: loanId,
      organization_id: orgUuid,
      party_index: partyIndex,
      is_entity: body.is_entity ?? false,
      entity_id: body.entity_id ?? null,
      borrower_id: body.borrower_id ?? null,
      glb: body.glb ?? null,
      dppa: body.dppa ?? null,
      voter: body.voter ?? null,
      entity_name: body.entity_name ?? null,
      entity_type: body.entity_type ?? null,
      ein: body.ein ?? null,
      state_of_formation: body.state_of_formation ?? null,
      date_of_formation: body.date_of_formation ?? null,
      first_name: body.first_name ?? null,
      middle_initial: body.middle_initial ?? null,
      last_name: body.last_name ?? null,
      date_of_birth: body.date_of_birth ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      street: body.street ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      zip: body.zip ?? null,
      county: body.county ?? null,
      province: body.province ?? null,
      country: body.country ?? null,
    }

    const { error } = await supabaseAdmin
      .from("application_background")
      .upsert(row, { onConflict: "application_id,party_index" })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
