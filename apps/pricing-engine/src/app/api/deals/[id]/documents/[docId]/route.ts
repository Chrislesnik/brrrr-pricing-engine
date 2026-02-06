import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// DELETE /api/deals/:id/documents/:docId
// Delete a document from a deal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId, docId } = await params;

    // Get document info
    const { data: docFile, error: docError } = await supabaseAdmin
      .from("document_files")
      .select("id, storage_bucket, storage_path")
      .eq("id", docId)
      .single();

    if (docError || !docFile) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Verify document is linked to this deal
    const { data: linkExists } = await supabaseAdmin
      .from("deal_document_participants")
      .select("deal_id")
      .eq("deal_id", dealId)
      .eq("document_file_id", docId)
      .single();

    if (!linkExists) {
      return NextResponse.json(
        { error: "Document not associated with this deal" },
        { status: 403 }
      );
    }

    // Delete from storage
    if (docFile.storage_bucket && docFile.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(docFile.storage_bucket)
        .remove([docFile.storage_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }
    }

    // Delete the link
    await supabaseAdmin
      .from("deal_document_participants")
      .delete()
      .eq("deal_id", dealId)
      .eq("document_file_id", docId);

    // Delete document record (this will cascade delete other links if any)
    const { error: deleteError } = await supabaseAdmin
      .from("document_files")
      .delete()
      .eq("id", docId);

    if (deleteError) {
      console.error("Error deleting document:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
