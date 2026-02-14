import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/*  GET /api/deals/[id]/deal-documents/[docId]/parse-status                    */
/*  Returns the latest llama_document_parsed status for the document.          */
/*  Response: { status: string | null, documentFileId: number | null }         */
/* -------------------------------------------------------------------------- */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId, docId } = await params;

    // 1. Look up deal_document to get document_file_id
    const { data: dealDoc, error: fetchError } = await supabaseAdmin
      .from("deal_documents")
      .select("id, document_file_id")
      .eq("id", docId)
      .eq("deal_id", dealId)
      .single();

    if (fetchError || !dealDoc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (!dealDoc.document_file_id) {
      return NextResponse.json({
        status: null,
        documentFileId: null,
      });
    }

    // 2. Query llama_document_parsed for the latest row by created_at
    const { data: parseRow, error: parseError } = await supabaseAdmin
      .from("llama_document_parsed")
      .select("id, document_id, status, created_at")
      .eq("document_id", dealDoc.document_file_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (parseError) {
      console.error("Error querying llama_document_parsed:", parseError);
      return NextResponse.json(
        { error: "Failed to check parse status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: parseRow?.status ?? null,
      documentFileId: dealDoc.document_file_id,
    });
  } catch (error) {
    console.error(
      "[GET /api/deals/[id]/deal-documents/[docId]/parse-status]",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
