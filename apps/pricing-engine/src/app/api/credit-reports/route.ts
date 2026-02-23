import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const borrowerId = searchParams.get("borrowerId")
    if (!borrowerId) {
      return NextResponse.json({ documents: [] })
    }

    // Fetch credit reports matching filters
    const { data: rows, error } = await supabaseAdmin
      .from("credit_reports")
      .select("id, status, created_at, aggregator")
      .eq("organization_id", orgUuid)
      .eq("borrower_id", borrowerId)
      .contains("assigned_to", [userId])
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Batch-fetch linked document_files for all credit reports via junction table
    const reportIds = (rows ?? []).map((r) => r.id as string)
    const linkedDocsMap = new Map<string, { storage_bucket: string; storage_path: string; document_name: string | null; file_type: string | null }>()

    if (reportIds.length > 0) {
      const { data: links } = await supabaseAdmin
        .from("document_files_credit_reports")
        .select("credit_report_id, document_file_id, document_files:document_file_id (storage_bucket, storage_path, document_name, file_type)")
        .in("credit_report_id", reportIds)

      for (const link of links ?? []) {
        const df = (link as any).document_files
        if (df?.storage_bucket && df?.storage_path) {
          linkedDocsMap.set(link.credit_report_id as string, {
            storage_bucket: df.storage_bucket,
            storage_path: df.storage_path,
            document_name: df.document_name ?? null,
            file_type: df.file_type ?? null,
          })
        }
      }
    }

    const documents: Array<{
      id: string
      name: string
      created_at: string
      status: string | null
      url: string | null
    }> = []

    for (const row of rows ?? []) {
      const reportId = row.id as string
      const rowAggregator = (row as any).aggregator as string | null
      const createdAt = (row.created_at as string) ?? ""

      const linkedDoc = linkedDocsMap.get(reportId)

      const name =
        linkedDoc?.document_name ||
        `Credit Report${rowAggregator ? ` (${rowAggregator})` : ""} - ${createdAt.slice(0, 10)}`

      let url: string | null = null
      if (linkedDoc) {
        const { data: signed } = await supabaseAdmin.storage
          .from(linkedDoc.storage_bucket)
          .createSignedUrl(linkedDoc.storage_path, 60 * 5)
        url = signed?.signedUrl ?? null
      }

      documents.push({
        id: reportId,
        name,
        created_at: createdAt,
        status: ((row.status as string | null) ?? null) as string | null,
        url,
      })
    }

    return NextResponse.json({ documents })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
