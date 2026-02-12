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

    // Get document info from deal_documents (also verifies deal ownership)
    const { data: dealDoc, error: docError } = await supabaseAdmin
      .from("deal_documents")
      .select("id, storage_path, file_name")
      .eq("id", docId)
      .eq("deal_id", dealId)
      .single();

    if (docError || !dealDoc) {
      return NextResponse.json(
        { error: "Document not found for this deal" },
        { status: 404 }
      );
    }

    if (!dealDoc.storage_path) {
      return NextResponse.json(
        { error: "Document has no associated file" },
        { status: 404 }
      );
    }

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabaseAdmin.storage
      .from("deals")
      .createSignedUrl(dealDoc.storage_path, 3600);

    if (error || !data?.signedUrl) {
      console.error("Error generating signed URL:", error);
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.signedUrl,
      fileName: dealDoc.file_name,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
