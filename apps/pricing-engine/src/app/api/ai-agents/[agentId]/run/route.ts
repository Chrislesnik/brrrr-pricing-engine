import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runAgent } from "@/lib/agent-runner";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId } = await params;
    const body = await request.json().catch(() => ({}));
    const { input, deal_id, deal_document_id, document_file_id } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "input (string) is required" },
        { status: 400 }
      );
    }

    const result = await runAgent(agentId, input, {
      deal_id: deal_id ?? undefined,
      deal_document_id: deal_document_id ?? undefined,
      document_file_id: document_file_id ?? undefined,
      trigger: "manual",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/ai-agents/[agentId]/run]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
