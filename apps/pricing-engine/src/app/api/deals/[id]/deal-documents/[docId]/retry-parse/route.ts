import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/*  POST /api/deals/[id]/deal-documents/[docId]/retry-parse                    */
/*  Re-triggers the n8n document parsing webhook with the same payload that    */
/*  the notify_n8n_on_document_file_insert DB trigger sends.                   */
/* -------------------------------------------------------------------------- */

const N8N_DOCUMENT_PARSE_WEBHOOK =
  "https://n8n.axora.info/webhook/3c632f17-df80-4bdf-923f-bf3f13d7ca2f";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

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

    // 2. Fetch the full document_files row
    const { data: docFile, error: docFileError } = await supabaseAdmin
      .from("document_files")
      .select("*")
      .eq("id", dealDoc.document_file_id)
      .single();

    if (docFileError || !docFile) {
      return NextResponse.json(
        { error: "Document file not found" },
        { status: 404 }
      );
    }

    // 3. Construct the same payload as the DB trigger
    //    trigger builds: to_jsonb(NEW) || jsonb_build_object('file_download_url', file_url)
    //    where file_url = SUPABASE_URL/storage/v1/object/{bucket}/{path}
    const fileDownloadUrl = `${SUPABASE_URL}/storage/v1/object/${docFile.storage_bucket ?? ""}/${docFile.storage_path ?? ""}`;

    const payload = {
      ...docFile,
      file_download_url: fileDownloadUrl,
    };

    // 4. POST to the n8n webhook
    const webhookRes = await fetch(N8N_DOCUMENT_PARSE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookRes.ok) {
      console.error(
        "n8n webhook error:",
        webhookRes.status,
        await webhookRes.text().catch(() => "")
      );
      return NextResponse.json(
        { error: "Failed to trigger document processing" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
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
