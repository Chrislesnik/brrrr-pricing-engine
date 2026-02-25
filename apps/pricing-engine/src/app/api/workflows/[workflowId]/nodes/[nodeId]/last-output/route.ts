import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{ workflowId: string; nodeId: string }>;
};

/**
 * GET /api/workflows/[workflowId]/nodes/[nodeId]/last-output
 *
 * Returns the output from the most recent successful execution of a
 * specific node within a workflow. Single query, no multi-hop.
 */
export async function GET(_req: Request, context: RouteContext) {
  const { workflowId, nodeId } = await context.params;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("get_node_last_output", {
      p_workflow_id: workflowId,
      p_node_id: nodeId,
    });

    if (error) {
      // Fallback to raw query if RPC doesn't exist yet
      const { data: rows, error: fallbackErr } = await supabaseAdmin
        .from("workflow_execution_logs")
        .select("output, workflow_executions!inner(workflow_id, started_at)")
        .eq("workflow_executions.workflow_id", workflowId)
        .eq("node_id", nodeId)
        .eq("status", "success")
        .not("output", "is", null)
        .order("started_at", { ascending: false, referencedTable: "workflow_executions" })
        .limit(1)
        .single();

      if (fallbackErr || !rows) {
        return NextResponse.json({ output: null });
      }
      return NextResponse.json({ output: rows.output });
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return NextResponse.json({ output: null });
    }

    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ output: row.output ?? row });
  } catch (err) {
    console.error("[last-output]", err);
    return NextResponse.json(
      { error: "Failed to fetch node output" },
      { status: 500 }
    );
  }
}
