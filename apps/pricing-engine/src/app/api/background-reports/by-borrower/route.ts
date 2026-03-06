import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!clerkOrgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 })
    }

    const orgUuid = await getOrgUuidFromClerkId(clerkOrgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization mapping not found" }, { status: 400 })
    }

    const borrowerId = req.nextUrl.searchParams.get("borrowerId")
    if (!borrowerId) {
      return NextResponse.json({ reports: [] })
    }

    const { data, error } = await supabaseAdmin
      .from("background_reports")
      .select("id, type, created_at, borrower_id, entity_id, archived_at")
      .eq("organization_id", orgUuid)
      .eq("borrower_id", borrowerId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Background reports by-borrower error:", error.message)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    const rows = data ?? []
    const reportIds = rows.map((r: any) => r.id as string)

    const linkedDocsMap = new Map<string, { storage_bucket: string; storage_path: string; document_name: string | null }>()

    if (reportIds.length > 0) {
      const { data: links } = await supabaseAdmin
        .from("document_files_background_reports")
        .select("background_report_id, document_file_id, document_files:document_file_id (storage_bucket, storage_path, document_name)")
        .in("background_report_id", reportIds)

      for (const link of links ?? []) {
        const df = (link as any).document_files
        if (df?.storage_bucket && df?.storage_path) {
          linkedDocsMap.set(link.background_report_id as string, {
            storage_bucket: df.storage_bucket,
            storage_path: df.storage_path,
            document_name: df.document_name ?? null,
          })
        }
      }
    }

    const reports = await Promise.all(
      rows.map(async (r: any) => {
        let downloadUrl: string | null = null
        const linkedDoc = linkedDocsMap.get(r.id)
        if (linkedDoc) {
          const { data: signed } = await supabaseAdmin.storage
            .from(linkedDoc.storage_bucket)
            .createSignedUrl(linkedDoc.storage_path, 60 * 5)
          downloadUrl = signed?.signedUrl ?? null
        }
        return {
          id: r.id,
          name: linkedDoc?.document_name || `Background Report - ${(r.created_at as string).slice(0, 10)}`,
          type: r.type,
          createdAt: r.created_at,
          downloadUrl,
        }
      }),
    )

    return NextResponse.json({ reports })
  } catch (err) {
    console.error("Background reports by-borrower error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
