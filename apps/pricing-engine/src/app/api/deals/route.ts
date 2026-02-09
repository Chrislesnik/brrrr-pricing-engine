import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

const optionalNumber = (min = 0, max?: number) =>
  z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    max == null
      ? z.number().min(min).optional()
      : z.number().min(min).max(max).optional()
  )

const schema = z.object({
  // Top-level fields that map to deals table columns
  loan_type: z.string().optional(),
  transaction_type: z.string().optional(),
  loan_amount: optionalNumber(0),
  rate: optionalNumber(0),
  status: z.string().optional(),
  property_address: z.string().optional(),
  borrower_first_name: z.string().optional(),
  borrower_last_name: z.string().optional(),
  
  // All other fields go into inputs JSONB
  deal_name: z.string().optional(),
  vesting_type: z.string().optional(),
  guarantor_count: optionalNumber(0),
  lead_source_type: z.string().optional(),
  property_id: optionalNumber(0),
  company_id: z.string().optional(),
  note_date: z.string().optional(),
  mid_fico: optionalNumber(0),
  pricing_is_locked: z.boolean().optional(),
  lead_source_name: z.string().optional(),
  loan_number: z.string().min(1),
  declaration_1_lawsuits: z.boolean().optional(),
  declaration_2_bankruptcy: z.boolean().optional(),
  declaration_3_felony: z.boolean().optional(),
  declaration_5_license: z.boolean().optional(),
  declaration_1_lawsuits_explanation: z.string().optional(),
  declaration_2_bankruptcy_explanation: z.string().optional(),
  declaration_3_felony_explanation: z.string().optional(),
  recourse_type: z.string().optional(),
  payoff_mtg1_amount: optionalNumber(0),
  loan_structure_dscr: z.string().optional(),
  guarantor_fico_score: optionalNumber(0),
  title_company_id: z.string().optional(),
  insurance_carrier_company_id: z.string().optional(),
  cash_out_purpose: z.string().optional(),
  target_closing_date: z.string().optional(),
  date_of_purchase: z.string().optional(),
  loan_amount_total: optionalNumber(0),
  construction_holdback: optionalNumber(0),
  loan_amount_initial: optionalNumber(0),
  loan_term: z.string().optional(),
  title_file_number: z.string().optional(),
  deal_type: z.string().optional(),
  project_type: z.string().optional(),
  deal_stage_1: z.string().optional(),
  deal_stage_2: z.string().optional(),
  deal_disposition_1: z.string().optional(),
  loan_type_rtl: z.string().optional(),
  renovation_cost: optionalNumber(0),
  renovation_completed: z.string().optional(),
  recently_renovated: z.string().optional(),
  purchase_price: optionalNumber(0),
  funding_date: z.string().optional(),
  loan_sale_date: z.string().optional(),
  pricing_file_path: z.string().optional(),
  pricing_file_url: z.string().optional(),
  loan_buyer_company_id: z.string().optional(),
  note_rate: optionalNumber(0),
  cost_of_capital: optionalNumber(0),
  broker_company_id: z.string().optional(),
  escrow_company_id: z.string().optional(),
  ltv_asis: optionalNumber(0),
  ltv_after_repair: optionalNumber(0),
  io_period: optionalNumber(0),
  ppp_term: z.string().optional(),
  ppp_structure_1: z.string().optional(),
})

function dropUndefined<T extends Record<string, unknown>>(obj: T) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!orgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 })
    }

    // Get the organization UUID from Clerk org ID
    const organizationId = await getOrgUuidFromClerkId(orgId)
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const json = await req.json().catch(() => null)
    const parsed = schema.parse(json)

    const cleanText = (value?: string) =>
      value && value.trim().length > 0 ? value.trim() : undefined

    // Build the inputs JSONB object with all deal details
    const inputs = dropUndefined({
      deal_name: cleanText(parsed.deal_name),
      vesting_type: cleanText(parsed.vesting_type),
      guarantor_count: parsed.guarantor_count,
      lead_source_type: cleanText(parsed.lead_source_type),
      property_id: parsed.property_id,
      company_id: cleanText(parsed.company_id),
      note_date: cleanText(parsed.note_date),
      mid_fico: parsed.mid_fico,
      pricing_is_locked: parsed.pricing_is_locked ?? false,
      lead_source_name: cleanText(parsed.lead_source_name),
      loan_number: parsed.loan_number.trim(),
      declaration_1_lawsuits: parsed.declaration_1_lawsuits ?? false,
      declaration_2_bankruptcy: parsed.declaration_2_bankruptcy ?? false,
      declaration_3_felony: parsed.declaration_3_felony ?? false,
      declaration_5_license: parsed.declaration_5_license ?? false,
      declaration_1_lawsuits_explanation: cleanText(parsed.declaration_1_lawsuits_explanation),
      declaration_2_bankruptcy_explanation: cleanText(parsed.declaration_2_bankruptcy_explanation),
      declaration_3_felony_explanation: cleanText(parsed.declaration_3_felony_explanation),
      recourse_type: cleanText(parsed.recourse_type),
      transaction_type: cleanText(parsed.transaction_type),
      payoff_mtg1_amount: parsed.payoff_mtg1_amount,
      loan_structure_dscr: cleanText(parsed.loan_structure_dscr),
      guarantor_fico_score: parsed.guarantor_fico_score,
      title_company_id: cleanText(parsed.title_company_id),
      insurance_carrier_company_id: cleanText(parsed.insurance_carrier_company_id),
      cash_out_purpose: cleanText(parsed.cash_out_purpose),
      target_closing_date: cleanText(parsed.target_closing_date),
      date_of_purchase: cleanText(parsed.date_of_purchase),
      loan_amount_total: parsed.loan_amount_total,
      construction_holdback: parsed.construction_holdback,
      loan_amount_initial: parsed.loan_amount_initial,
      loan_term: cleanText(parsed.loan_term),
      title_file_number: cleanText(parsed.title_file_number),
      deal_type: cleanText(parsed.deal_type),
      project_type: cleanText(parsed.project_type),
      deal_stage_1: cleanText(parsed.deal_stage_1),
      deal_stage_2: cleanText(parsed.deal_stage_2),
      deal_disposition_1: cleanText(parsed.deal_disposition_1),
      loan_type_rtl: cleanText(parsed.loan_type_rtl),
      renovation_cost: parsed.renovation_cost,
      renovation_completed: cleanText(parsed.renovation_completed),
      recently_renovated: cleanText(parsed.recently_renovated),
      purchase_price: parsed.purchase_price,
      funding_date: cleanText(parsed.funding_date),
      loan_sale_date: cleanText(parsed.loan_sale_date),
      pricing_file_path: cleanText(parsed.pricing_file_path),
      pricing_file_url: cleanText(parsed.pricing_file_url),
      loan_buyer_company_id: cleanText(parsed.loan_buyer_company_id),
      note_rate: parsed.note_rate,
      cost_of_capital: parsed.cost_of_capital,
      broker_company_id: cleanText(parsed.broker_company_id),
      escrow_company_id: cleanText(parsed.escrow_company_id),
      ltv_asis: parsed.ltv_asis,
      ltv_after_repair: parsed.ltv_after_repair,
      io_period: parsed.io_period,
      ppp_term: cleanText(parsed.ppp_term),
      ppp_structure_1: cleanText(parsed.ppp_structure_1),
    })

    // Build the row to insert - matches actual deals table schema
    const payload = {
      organization_id: organizationId,
      loan_type: cleanText(parsed.loan_type) || cleanText(parsed.loan_type_rtl),
      transaction_type: cleanText(parsed.transaction_type),
      loan_amount: parsed.loan_amount || parsed.loan_amount_total,
      rate: parsed.rate || parsed.note_rate,
      status: cleanText(parsed.status) || "active",
      property_address: cleanText(parsed.property_address),
      borrower_first_name: cleanText(parsed.borrower_first_name),
      borrower_last_name: cleanText(parsed.borrower_last_name),
      inputs,
      assigned_to_user_id: [userId],
      primary_user_id: userId,
    }

    const { data, error } = await supabaseAdmin
      .from("deals")
      .insert(payload)
      .select("*")
      .single()

    if (error) {
      console.error("[POST /api/deals] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, deal: data })
  } catch (error) {
    console.error("[POST /api/deals] Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
