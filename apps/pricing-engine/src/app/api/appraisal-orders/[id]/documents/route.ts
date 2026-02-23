import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { nanoid } from "nanoid"

export const runtime = "nodejs"

const BUCKET = "appraisal-documents"

/**
 * GET /api/appraisal-orders/[id]/documents
 * List all documents attached to an appraisal.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { id } = await params
    const appraisalId = parseInt(id, 10)
    if (isNaN(appraisalId)) {
      return NextResponse.json({ error: "Invalid appraisal ID" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("appraisal_documents")
      .select("id, appraisal_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at")
      .eq("appraisal_id", appraisalId)
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with uploader names
    const uploaderIds = [...new Set((data ?? []).map((d) => d.uploaded_by).filter(Boolean))]
    let uploaderMap = new Map<string, string>()
    if (uploaderIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("clerk_user_id, first_name, last_name")
        .in("clerk_user_id", uploaderIds)

      uploaderMap = new Map(
        (users ?? []).map((u: { clerk_user_id: string; first_name: string | null; last_name: string | null }) => [
          u.clerk_user_id,
          [u.first_name, u.last_name].filter(Boolean).join(" ") || "Unknown",
        ])
      )
    }

    const documents = (data ?? []).map((d) => ({
      ...d,
      uploaded_by_name: uploaderMap.get(d.uploaded_by) ?? "Unknown",
    }))

    return NextResponse.json({ documents })
  } catch (e) {
    console.error("[GET /api/appraisal-orders/[id]/documents]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/appraisal-orders/[id]/documents
 * Upload a file to Supabase Storage and create an appraisal_documents row.
 * Body: FormData { file }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { id } = await params
    const appraisalId = parseInt(id, 10)
    if (isNaN(appraisalId)) {
      return NextResponse.json({ error: "Invalid appraisal ID" }, { status: 400 })
    }

    // Verify ownership
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("appraisal")
      .select("id")
      .eq("id", appraisalId)
      .eq("organization_id", orgUuid)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const fileExt = file.name.split(".").pop() || "bin"
    const uniqueId = nanoid()
    const storagePath = `${orgUuid}/${appraisalId}/${uniqueId}.${fileExt}`

    const fileBuffer = await file.arrayBuffer()
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadErr) {
      console.error("[POST /api/appraisal-orders/[id]/documents] upload error:", uploadErr)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    const { data: doc, error: insertErr } = await supabaseAdmin
      .from("appraisal_documents")
      .insert({
        appraisal_id: appraisalId,
        organization_id: orgUuid,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: userId,
      })
      .select("id, appraisal_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at")
      .single()

    if (insertErr || !doc) {
      // Rollback storage upload
      await supabaseAdmin.storage.from(BUCKET).remove([storagePath])
      console.error("[POST /api/appraisal-orders/[id]/documents] insert error:", insertErr)
      return NextResponse.json({ error: "Failed to save document record" }, { status: 500 })
    }

    return NextResponse.json({ document: doc })
  } catch (e) {
    console.error("[POST /api/appraisal-orders/[id]/documents]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/appraisal-orders/[id]/documents
 * Remove a document from storage and delete the row.
 * Body: { docId: number }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { id } = await params
    const appraisalId = parseInt(id, 10)
    if (isNaN(appraisalId)) {
      return NextResponse.json({ error: "Invalid appraisal ID" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const docId = body.docId
    if (!docId) {
      return NextResponse.json({ error: "docId is required" }, { status: 400 })
    }

    const { data: doc, error: fetchErr } = await supabaseAdmin
      .from("appraisal_documents")
      .select("id, file_path")
      .eq("id", docId)
      .eq("appraisal_id", appraisalId)
      .eq("organization_id", orgUuid)
      .single()

    if (fetchErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Remove from storage
    if (doc.file_path) {
      await supabaseAdmin.storage.from(BUCKET).remove([doc.file_path])
    }

    // Delete the row
    const { error: deleteErr } = await supabaseAdmin
      .from("appraisal_documents")
      .delete()
      .eq("id", docId)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[DELETE /api/appraisal-orders/[id]/documents]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
