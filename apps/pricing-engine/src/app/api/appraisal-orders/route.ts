import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId, getUserRoleInOrg, isPrivilegedRole } from "@/lib/orgs"
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
        appraisal_borrowers (borrower_id, borrowers:borrower_id (id, first_name, last_name)),
        integration_setup:amc_id (id, name, integration_settings (id, name))
      `)
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[GET /api/appraisal-orders] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let orders = data ?? []

    const userRole = await getUserRoleInOrg(orgUuid, userId)
    if (!isPrivilegedRole(userRole) && orders.length > 0) {
      const appraisalIds = orders.map((o) => String(o.id))
      const { data: myAssignments } = await supabaseAdmin
        .from("role_assignments")
        .select("resource_id")
        .eq("resource_type", "appraisal")
        .eq("user_id", userId)
        .in("resource_id", appraisalIds)
      const myIds = new Set((myAssignments ?? []).map((a) => a.resource_id as string))
      orders = orders.filter((o) => myIds.has(String(o.id)))
    }

    return NextResponse.json({ orders })
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

    // Auto-create role assignments (best-effort, never blocks the response)
    try {
      if (data.deal_id) {
        // Deal assignments take priority -- copy them all
        const { data: dealAssignments } = await supabaseAdmin
          .from("role_assignments")
          .select("role_type_id, user_id, organization_id")
          .eq("resource_type", "deal")
          .eq("resource_id", data.deal_id)

        const rows = (dealAssignments ?? []).map((a) => ({
          resource_type: "appraisal" as const,
          resource_id: String(data.id),
          role_type_id: a.role_type_id,
          user_id: a.user_id,
          organization_id: a.organization_id,
          created_by: userId,
        }))

        // Also include creator as AE if not already in deal assignments
        const creatorInDeal = (dealAssignments ?? []).some((a) => a.user_id === userId)
        if (!creatorInDeal) {
          rows.push({
            resource_type: "appraisal",
            resource_id: String(data.id),
            role_type_id: 6,
            user_id: userId,
            organization_id: orgUuid,
            created_by: userId,
          })
        }

        if (rows.length) {
          await supabaseAdmin.from("role_assignments").upsert(rows, {
            onConflict: "resource_type,resource_id,role_type_id,user_id",
          })
        }
      } else {
        // No deal -- assign creator as Account Executive
        await supabaseAdmin.from("role_assignments").upsert(
          {
            resource_type: "appraisal",
            resource_id: String(data.id),
            role_type_id: 6,
            user_id: userId,
            organization_id: orgUuid,
            created_by: userId,
          },
          { onConflict: "resource_type,resource_id,role_type_id,user_id" }
        )
      }
    } catch (assignErr) {
      console.error("[POST /api/appraisal-orders] Auto-assign error (non-blocking):", assignErr)
    }

    return NextResponse.json({ order: data })
  } catch (e) {
    console.error("[POST /api/appraisal-orders] Unexpected error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
