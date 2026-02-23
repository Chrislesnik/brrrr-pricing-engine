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
      .from("application_appraisal")
      .select("*")
      .eq("application_id", loanId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ row: data })
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

    const row: Record<string, unknown> = {
      application_id: loanId,
      organization_id: orgUuid,
      amc_id: body.amc_id ?? null,
      lender: body.lender ?? null,
      investor: body.investor ?? null,
      transaction_type: body.transaction_type ?? null,
      loan_type: body.loan_type ?? null,
      loan_type_other: body.loan_type_other ?? null,
      loan_number: body.loan_number ?? null,
      priority: body.priority ?? null,
      borrower_name: body.borrower_name ?? null,
      borrower_email: body.borrower_email ?? null,
      borrower_phone: body.borrower_phone ?? null,
      borrower_alt_phone: body.borrower_alt_phone ?? null,
      property_type: body.property_type ?? null,
      occupancy_type: body.occupancy_type ?? null,
      property_address: body.property_address ?? null,
      property_city: body.property_city ?? null,
      property_state: body.property_state ?? null,
      property_zip: body.property_zip ?? null,
      property_county: body.property_county ?? null,
      contact_person: body.contact_person ?? null,
      contact_name: body.contact_name ?? null,
      contact_email: body.contact_email ?? null,
      contact_phone: body.contact_phone ?? null,
      other_access_info: body.other_access_info ?? null,
      product: body.product ?? null,
      loan_amount: body.loan_amount ?? null,
      sales_price: body.sales_price ?? null,
      due_date: body.due_date ?? null,
    }

    const { error } = await supabaseAdmin
      .from("application_appraisal")
      .upsert(row, { onConflict: "application_id" })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
