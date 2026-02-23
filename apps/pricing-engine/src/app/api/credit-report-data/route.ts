import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/credit-report-data
 * List all credit reports for the current org, joined with borrower names
 * and aggregator-specific score data via credit_report_data_links.
 */
export async function GET() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    // Fetch credit reports with borrower join — scores live directly on credit_reports
    const { data: reports, error } = await supabaseAdmin
      .from("credit_reports")
      .select(`
        id, status, created_at,
        borrower_id, organization_id, aggregator, report_id,
        transunion_score, experian_score, equifax_score, mid_score,
        pull_type, report_date, data,
        borrowers:borrower_id (id, first_name, last_name)
      `)
      .eq("organization_id", orgUuid)
      .is("archived_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[GET /api/credit-report-data] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch linked document_files via junction table for download URLs
    const reportIds = (reports ?? []).map((r) => r.id as string)
    const linkedDocsMap = new Map<string, { storage_bucket: string; storage_path: string }>()
    if (reportIds.length > 0) {
      const { data: docLinks } = await supabaseAdmin
        .from("document_files_credit_reports")
        .select("credit_report_id, document_files:document_file_id (storage_bucket, storage_path)")
        .in("credit_report_id", reportIds)

      for (const dl of docLinks ?? []) {
        const df = (dl as any).document_files
        if (df?.storage_bucket && df?.storage_path) {
          linkedDocsMap.set(dl.credit_report_id as string, {
            storage_bucket: df.storage_bucket,
            storage_path: df.storage_path,
          })
        }
      }
    }

    // Enrich reports with download URLs
    const enriched = await Promise.all(
      (reports ?? []).map(async (report) => {
        let downloadUrl: string | null = null
        const linkedDoc = linkedDocsMap.get(report.id as string)
        if (linkedDoc) {
          const { data: signed } = await supabaseAdmin.storage
            .from(linkedDoc.storage_bucket)
            .createSignedUrl(linkedDoc.storage_path, 60 * 5)
          downloadUrl = signed?.signedUrl ?? null
        }

        return {
          ...report,
          download_url: downloadUrl,
        }
      })
    )

    return NextResponse.json({ reports: enriched })
  } catch (e) {
    console.error("[GET /api/credit-report-data] Unexpected error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
