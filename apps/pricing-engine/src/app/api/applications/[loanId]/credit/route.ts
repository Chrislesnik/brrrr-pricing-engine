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
      .from("application_credit")
      .select("*")
      .eq("application_id", loanId)
      .eq("organization_id", orgUuid)
      .order("guarantor_index", { ascending: true })

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
    const guarantorIndex = typeof body.guarantor_index === "number" ? body.guarantor_index : 0

    const row: Record<string, unknown> = {
      application_id: loanId,
      organization_id: orgUuid,
      guarantor_index: guarantorIndex,
      borrower_id: body.borrower_id ?? null,
      pull_type: body.pull_type ?? "soft",
      include_tu: body.include_tu ?? true,
      include_ex: body.include_ex ?? true,
      include_eq: body.include_eq ?? true,
      first_name: body.first_name ?? null,
      last_name: body.last_name ?? null,
      date_of_birth: body.date_of_birth ?? null,
      street: body.street ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      zip: body.zip ?? null,
      county: body.county ?? null,
      prev_street: body.prev_street ?? null,
      prev_city: body.prev_city ?? null,
      prev_state: body.prev_state ?? null,
      prev_zip: body.prev_zip ?? null,
    }

    const { error } = await supabaseAdmin
      .from("application_credit")
      .upsert(row, { onConflict: "application_id,guarantor_index" })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
