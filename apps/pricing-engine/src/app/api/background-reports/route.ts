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
      .is("archived_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[GET /api/background-reports] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const reports = data ?? []

    // Batch-fetch linked document_files via junction table
    const reportIds = reports.map((r) => r.id as string)
    const linkedDocsMap = new Map<string, {
      document_file_id: number
      storage_bucket: string
      storage_path: string
      document_name: string | null
      file_type: string | null
      file_size: number | null
    }>()

    if (reportIds.length > 0) {
      const { data: links } = await supabaseAdmin
        .from("document_files_background_reports")
        .select("background_report_id, document_file_id, document_files:document_file_id (storage_bucket, storage_path, document_name, file_type, file_size)")
        .in("background_report_id", reportIds)

      for (const link of links ?? []) {
        const df = (link as any).document_files
        if (df?.storage_bucket && df?.storage_path) {
          linkedDocsMap.set(link.background_report_id as string, {
            document_file_id: link.document_file_id as number,
            storage_bucket: df.storage_bucket,
            storage_path: df.storage_path,
            document_name: df.document_name ?? null,
            file_type: df.file_type ?? null,
            file_size: df.file_size ?? null,
          })
        }
      }
    }

    // Generate signed download URLs and derive status from junction table
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const linked = linkedDocsMap.get(report.id as string)
        const derivedStatus = linked ? "completed" : "pending"

        if (!linked) return { ...report, status: derivedStatus, download_url: null, linked_doc: null }

        let downloadUrl: string | null = null
        try {
          const { data: signed } = await supabaseAdmin.storage
            .from(linked.storage_bucket)
            .createSignedUrl(linked.storage_path, 60 * 5)
          downloadUrl = signed?.signedUrl ?? null
        } catch {
          // non-fatal
        }

        return {
          ...report,
          status: derivedStatus,
          download_url: downloadUrl,
          linked_doc: {
            document_file_id: linked.document_file_id,
            document_name: linked.document_name,
            file_type: linked.file_type,
            file_size: linked.file_size,
            storage_path: linked.storage_path,
          },
        }
      })
    )

    return NextResponse.json({ reports: enrichedReports })
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
