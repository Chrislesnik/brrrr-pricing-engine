import { NextRequest, NextResponse } from "next/server"
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

    // Fetch credit reports with borrower join
    const { data: reports, error } = await supabaseAdmin
      .from("credit_reports")
      .select(`
        id, bucket, storage_path, status, created_at, metadata,
        borrower_id, organization_id, aggregator, aggregator_id, report_id,
        borrowers:borrower_id (id, first_name, last_name)
      `)
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[GET /api/credit-report-data] Supabase error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch all data links for these reports
    const reportIds = (reports ?? []).map((r) => r.id as string)
    let dataLinksMap: Record<string, { aggregator: string; aggregator_data_id: string }> = {}

    if (reportIds.length > 0) {
      const { data: links } = await supabaseAdmin
        .from("credit_report_data_links")
        .select("credit_report_id, aggregator, aggregator_data_id")
        .in("credit_report_id", reportIds)

      if (links) {
        for (const link of links) {
          dataLinksMap[link.credit_report_id as string] = {
            aggregator: link.aggregator as string,
            aggregator_data_id: link.aggregator_data_id as string,
          }
        }
      }
    }

    // Fetch xactus scores for linked reports
    const xactusIds = Object.values(dataLinksMap)
      .filter((l) => l.aggregator === "xactus")
      .map((l) => l.aggregator_data_id)

    let xactusScoresMap: Record<string, {
      transunion_score: number | null
      experian_score: number | null
      equifax_score: number | null
      pull_type: string | null
    }> = {}

    if (xactusIds.length > 0) {
      const { data: xactusRows } = await supabaseAdmin
        .from("credit_report_data_xactus")
        .select("id, transunion_score, experian_score, equifax_score, pull_type")
        .in("id", xactusIds)

      if (xactusRows) {
        for (const row of xactusRows) {
          xactusScoresMap[row.id as string] = {
            transunion_score: row.transunion_score as number | null,
            experian_score: row.experian_score as number | null,
            equifax_score: row.equifax_score as number | null,
            pull_type: row.pull_type as string | null,
          }
        }
      }
    }

    // Sign download URLs
    const enriched = await Promise.all(
      (reports ?? []).map(async (report) => {
        const link = dataLinksMap[report.id as string]
        const xactus = link?.aggregator === "xactus"
          ? xactusScoresMap[link.aggregator_data_id] ?? null
          : null

        let downloadUrl: string | null = null
        if (report.storage_path && report.bucket) {
          const { data: signed } = await supabaseAdmin.storage
            .from(report.bucket as string)
            .createSignedUrl(report.storage_path as string, 60 * 5)
          downloadUrl = signed?.signedUrl ?? null
        }

        return {
          ...report,
          aggregator_link: link ?? null,
          transunion_score: xactus?.transunion_score ?? null,
          experian_score: xactus?.experian_score ?? null,
          equifax_score: xactus?.equifax_score ?? null,
          pull_type: xactus?.pull_type ?? null,
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
