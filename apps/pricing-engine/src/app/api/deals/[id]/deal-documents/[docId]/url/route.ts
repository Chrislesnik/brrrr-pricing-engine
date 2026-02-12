import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/*  GET /api/deals/[id]/deal-documents/[docId]/url                             */
/*  Returns a signed download URL for a deal_document's linked file.           */
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

    // Load deal_document and join to document_files for storage info
    const { data: dealDoc, error: fetchError } = await supabaseAdmin
      .from("deal_documents")
      .select(
        `
        id,
        document_file_id,
        file_name,
        document_files:document_file_id (
          id,
          storage_bucket,
          storage_path,
          document_name
        )
      `
      )
      .eq("id", docId)
      .eq("deal_id", dealId)
      .single();

    if (fetchError || !dealDoc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const docFile = dealDoc.document_files as any;

    if (!docFile?.storage_bucket || !docFile?.storage_path) {
      return NextResponse.json(
        { error: "No file uploaded for this document" },
        { status: 404 }
      );
    }

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabaseAdmin.storage
      .from(docFile.storage_bucket)
      .createSignedUrl(docFile.storage_path, 3600);

    if (error || !data?.signedUrl) {
      console.error("Error generating signed URL:", error);
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.signedUrl,
      fileName: docFile.document_name || dealDoc.file_name,
    });
  } catch (error) {
    console.error(
      "[GET /api/deals/[id]/deal-documents/[docId]/url]",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
