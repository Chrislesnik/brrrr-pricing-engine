import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

// GET /api/programs/:id/documents/url?path=...
// Returns a signed URL for a document stored in program-docs bucket.
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: programId } = await ctx.params
  const storagePath = req.nextUrl.searchParams.get("path")

  if (!programId) {
    return NextResponse.json({ error: "Missing program id" }, { status: 400 })
  }

  if (!storagePath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 })
  }

  // Verify the document belongs to this program
  const { data: doc, error: docError } = await supabaseAdmin
    .from("program_documents")
    .select("id")
    .eq("program_id", programId)
    .eq("storage_path", storagePath)
    .single()

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  // Generate a signed URL (valid for 1 hour)
  const { data, error } = await supabaseAdmin.storage
    .from("program-docs")
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate signed URL" },
      { status: 500 }
    )
  }

  return NextResponse.json({ url: data.signedUrl })
}
