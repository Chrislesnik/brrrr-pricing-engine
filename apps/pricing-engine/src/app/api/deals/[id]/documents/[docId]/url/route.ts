import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET /api/deals/:id/documents/:docId/url
// Get a signed URL for downloading a document
export async function GET(
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
      .select("id, storage_bucket, storage_path, document_name")
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
      .from("document_files_deals")
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

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabaseAdmin.storage
      .from(docFile.storage_bucket || "deals")
      .createSignedUrl(docFile.storage_path || "", 3600);

    if (error || !data?.signedUrl) {
      console.error("Error generating signed URL:", error);
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.signedUrl,
      fileName: docFile.document_name,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
