import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

const BUCKET = "appraisal-documents"

/**
 * GET /api/appraisal-orders/[id]/documents/[docId]/url
 * Returns a signed download URL for an appraisal document.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { id, docId } = await params
    const appraisalId = parseInt(id, 10)
    const documentId = parseInt(docId, 10)

    if (isNaN(appraisalId) || isNaN(documentId)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 })
    }

    const { data: doc, error: fetchErr } = await supabaseAdmin
      .from("appraisal_documents")
      .select("id, file_name, file_path")
      .eq("id", documentId)
      .eq("appraisal_id", appraisalId)
      .eq("organization_id", orgUuid)
      .single()

    if (fetchErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (!doc.file_path) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, 3600)

    if (error || !data?.signedUrl) {
      console.error("[GET .../documents/[docId]/url] signed URL error:", error)
      return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl, fileName: doc.file_name })
  } catch (e) {
    console.error("[GET .../documents/[docId]/url]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
