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

    // Get document info from deal_documents
    const { data: dealDoc, error: docError } = await supabaseAdmin
      .from("deal_documents")
      .select("id, storage_path")
      .eq("id", docId)
      .eq("deal_id", dealId)
      .single();

    if (docError || !dealDoc) {
      return NextResponse.json(
        { error: "Document not found for this deal" },
        { status: 404 }
      );
    }

    // Delete from storage
    if (dealDoc.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("deals")
        .remove([dealDoc.storage_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }
    }

    // Delete the deal_documents record
    const { error: deleteError } = await supabaseAdmin
      .from("deal_documents")
      .delete()
      .eq("id", docId)
      .eq("deal_id", dealId);

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
