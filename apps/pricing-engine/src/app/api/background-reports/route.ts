import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/background-reports
 * List all background reports for the current org, joined with borrower/entity names.
 */
export async function GET() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("background_reports")
      .select(`
        *,
        borrowers:borrower_id (id, first_name, last_name),
        entities:entity_id (id, entity_name)
      `)
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[GET /api/background-reports] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reports: data ?? [] })
  } catch (e) {
    console.error("[GET /api/background-reports] Unexpected error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/background-reports
 * Create a new background report.
 * Body: { borrower_id?, entity_id?, is_entity, report_type?, notes?, file_name?, storage_path?, file_size?, file_type? }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    const {
      borrower_id,
      entity_id,
      is_entity = false,
      report_type,
      status: reportStatus,
      report_date,
      notes,
      file_name,
      storage_path,
      file_size,
      file_type,
    } = body

    if (!borrower_id && !entity_id) {
      return NextResponse.json(
        { error: "Either borrower_id or entity_id is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("background_reports")
      .insert({
        organization_id: orgUuid,
        borrower_id: borrower_id || null,
        entity_id: entity_id || null,
        is_entity: !!is_entity,
        report_type: report_type || null,
        status: reportStatus || "pending",
        report_date: report_date || null,
        notes: notes || null,
        file_name: file_name || null,
        storage_path: storage_path || null,
        file_size: file_size || null,
        file_type: file_type || null,
        created_by: userId,
      })
      .select(`
        *,
        borrowers:borrower_id (id, first_name, last_name),
        entities:entity_id (id, entity_name)
      `)
      .single()

    if (error) {
      console.error("[POST /api/background-reports] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ report: data })
  } catch (e) {
    console.error("[POST /api/background-reports] Unexpected error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
