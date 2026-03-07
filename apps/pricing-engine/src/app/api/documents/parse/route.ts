import { NextRequest, NextResponse } from "next/server";
import { startParse } from "@/lib/parse-document";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const documentFileId = body.documentFileId;

    if (!documentFileId || typeof documentFileId !== "number") {
      return NextResponse.json(
        { error: "documentFileId (number) is required" },
        { status: 400 }
      );
    }

    const { parseRowId, jobId } = await startParse(documentFileId);

    return NextResponse.json({ ok: true, parseRowId, jobId });
  } catch (error) {
    console.error("[POST /api/documents/parse]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
