import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractAllForDocument } from "@/lib/ai-extract";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId, docId } = await params;
    const body = await request.json().catch(() => ({}));

    const documentTypeId = body.document_type_id;
    const documentFileId = body.document_file_id;
    const dealDocumentId = Number(docId);

    if (!documentTypeId || !documentFileId) {
      return NextResponse.json(
        { error: "document_type_id and document_file_id are required" },
        { status: 400 }
      );
    }

    const results = await extractAllForDocument(
      documentTypeId,
      documentFileId,
      dealDocumentId
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("[POST /ai-extract]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
