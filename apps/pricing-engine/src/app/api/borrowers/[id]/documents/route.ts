import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: borrowerId } = await params
    const categoryId = req.nextUrl.searchParams.get("categoryId")

    const { data: borrower } = await supabaseAdmin
      .from("borrowers")
      .select("id")
      .eq("id", borrowerId)
      .maybeSingle()

    if (!borrower) {
      return NextResponse.json({ error: "Borrower not found" }, { status: 404 })
    }

    let query = supabaseAdmin
      .from("document_files_borrowers")
      .select(`
        document_file_id,
        document_files!inner (
          id,
          uuid,
          document_name,
          file_type,
          uploaded_at,
          storage_bucket,
          storage_path,
          document_category_id,
          archived_at,
          document_status_id
        )
      `)
      .eq("borrower_id", borrowerId)

    const { data: rows, error } = await query

    if (error) {
      console.error("Borrower documents query error:", error.message)
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
    }

    const allFiltered = (rows ?? [])
      .map((r: any) => r.document_files)
      .filter((f: any) => f && !f.archived_at)
      .filter((f: any) => f.storage_bucket === "persons")

    const categoryIds = [...new Set(allFiltered.map((f: any) => f.document_category_id).filter(Boolean))]

    const filtered = categoryId
      ? allFiltered.filter((f: any) => String(f.document_category_id) === categoryId)
      : allFiltered

    const documents = await Promise.all(
      filtered.map(async (f: any) => {
        let downloadUrl: string | null = null
        if (f.storage_bucket && f.storage_path) {
          const { data } = await supabaseAdmin.storage
            .from(f.storage_bucket)
            .createSignedUrl(f.storage_path, 3600)
          downloadUrl = data?.signedUrl ?? null
        }
        return {
          id: f.id,
          uuid: f.uuid,
          documentName: f.document_name,
          fileType: f.file_type,
          uploadedAt: f.uploaded_at,
          downloadUrl,
          documentCategoryId: f.document_category_id,
        }
      }),
    )

    return NextResponse.json({ documents, categoryIds })
  } catch (err) {
    console.error("Borrower documents error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
