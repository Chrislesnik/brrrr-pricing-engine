import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId } = await params;

    const { data, error } = await supabaseAdmin
      .from("ai_agent_runs")
      .select("*")
      .eq("agent_id", agentId)
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ runs: data ?? [] });
  } catch (err) {
    console.error("[GET /api/ai-agents/[agentId]/runs]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
