import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-orders
 * List all appraisal orders for the current org, joined with AMC name and borrower.
 */
export async function GET() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("appraisal")
      .select(`
        *,
        borrowers:borrower_id (id, first_name, last_name),
        integration_setup:amc_id (id, name, integration_settings (id, name))
      `)
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[GET /api/appraisal-orders] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders: data ?? [] })
  } catch (e) {
    console.error("[GET /api/appraisal-orders] Unexpected error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/appraisal-orders
 * Create a new appraisal order.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    const {
      amc_id,
      deal_id,
      borrower_id,
      borrower_name,
      loan_number,
      file_number,
      order_type,
      order_status,
      property_address,
      property_city,
      property_state,
      property_zip,
      date_report_ordered,
      date_due,
      date_amc_vendor_assign,
      date_inspection_completed,
      date_report_received,
    } = body

    const { data, error } = await supabaseAdmin
      .from("appraisal")
      .insert({
        organization_id: orgUuid,
        amc_id: amc_id || null,
        deal_id: deal_id || null,
        borrower_id: borrower_id || null,
        borrower_name: borrower_name || null,
        loan_number: loan_number || null,
        file_number: file_number || null,
        order_type: order_type || null,
        order_status: order_status || "Ordered",
        property_address: property_address || null,
        property_city: property_city || null,
        property_state: property_state || null,
        property_zip: property_zip || null,
        date_report_ordered: date_report_ordered || null,
        date_due: date_due || null,
        date_amc_vendor_assign: date_amc_vendor_assign || null,
        date_inspection_completed: date_inspection_completed || null,
        date_report_received: date_report_received || null,
        created_by: userId,
      })
      .select(`
        *,
        borrowers:borrower_id (id, first_name, last_name),
        integration_setup:amc_id (id, name, integration_settings (id, name))
      `)
      .single()

    if (error) {
      console.error("[POST /api/appraisal-orders] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ order: data })
  } catch (e) {
    console.error("[POST /api/appraisal-orders] Unexpected error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
