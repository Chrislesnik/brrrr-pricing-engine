import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

// GET /api/programs/:id/documents
// Returns documents stored for a program (metadata only).
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const programId = params.id
  if (!programId) {
    return NextResponse.json({ error: "Missing program id" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("program_documents")
    .select("id, title, storage_path, mime_type, status, created_at")
    .eq("program_id", programId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ documents: data ?? [] })
}


