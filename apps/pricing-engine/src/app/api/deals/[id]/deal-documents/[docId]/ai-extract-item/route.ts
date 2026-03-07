import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractSingleItem } from "@/lib/ai-extract";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { item, dealDocument } = body;

    if (!item || !dealDocument) {
      return NextResponse.json(
        { error: "item and dealDocument are required" },
        { status: 400 }
      );
    }

    const results = await extractSingleItem(item, dealDocument);

    return NextResponse.json(results);
  } catch (error) {
    console.error("[POST /ai-extract-item]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
