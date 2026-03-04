import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { restoreRecord } from "@/lib/archive-helpers";

// DELETE /api/deals/:id/documents/:docId
// Archive a document from a deal (soft delete — storage files are kept)
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

    // Check for restore action
    const url = new URL(request.url);
    if (url.searchParams.get("action") === "restore") {
      const { error } = await restoreRecord("deal_documents", docId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Get document info from deal_documents
    const { data: dealDoc, error: docError } = await supabaseAdmin
      .from("deal_documents")
      .select("id")
      .eq("id", docId)
      .eq("deal_id", dealId)
      .single();

    if (docError || !dealDoc) {
      return NextResponse.json(
        { error: "Document not found for this deal" },
        { status: 404 }
      );
    }

    // Archive instead of delete — storage files are preserved
    const now = new Date().toISOString();
    const { error: archiveError } = await supabaseAdmin
      .from("deal_documents")
      .update({ archived_at: now, archived_by: userId })
      .eq("id", docId)
      .eq("deal_id", dealId);

    if (archiveError) {
      console.error("Error archiving document:", archiveError);
      return NextResponse.json(
        { error: "Failed to archive document" },
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
