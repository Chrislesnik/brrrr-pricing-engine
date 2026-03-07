import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { startParse } from "@/lib/parse-document";

/* -------------------------------------------------------------------------- */
/*  POST /api/deals/[id]/deal-documents/[docId]/retry-parse                    */
/*  Re-triggers the document parsing pipeline for a given deal document.       */
/* -------------------------------------------------------------------------- */

export async function POST(
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
      return NextResponse.json(
        { error: "No file linked to this document" },
        { status: 400 }
      );
    }

    // 2. Start parse (uploads to LlamaParse with webhook callback)
    const { jobId } = await startParse(dealDoc.document_file_id);

    return NextResponse.json({ ok: true, jobId });
  } catch (error) {
    console.error(
      "[POST /api/deals/[id]/deal-documents/[docId]/retry-parse]",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
