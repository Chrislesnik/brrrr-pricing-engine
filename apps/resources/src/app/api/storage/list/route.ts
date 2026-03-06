import { NextRequest, NextResponse } from "next/server";
import { listFiles } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const folder = request.nextUrl.searchParams.get("folder") || "";

  try {
    const result = await listFiles(folder);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files", files: [], folders: [] },
      { status: 500 }
    );
  }
}
