import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

type RouteContext = { params: Promise<{ executionId: string }> }

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { executionId } = await context.params

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the execution belongs to the user
    const { data: execution, error: execErr } = await supabaseAdmin
      .from("workflow_executions")
      .select("id, workflow_id, user_id, status, input, output, error, started_at, completed_at, duration")
      .eq("id", executionId)
      .eq("user_id", userId)
      .single()

    if (execErr || !execution) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 })
    }

    // Get detailed logs
    const { data: logs } = await supabaseAdmin
      .from("workflow_execution_logs")
      .select("id, node_id, node_name, node_type, status, input, output, error, started_at, completed_at, duration")
      .eq("execution_id", executionId)
      .order("started_at", { ascending: true })

    return NextResponse.json({
      execution: {
        id: execution.id,
        workflowId: execution.workflow_id,
        userId: execution.user_id,
        status: execution.status,
        input: execution.input,
        output: execution.output,
        error: execution.error,
        startedAt: execution.started_at,
        completedAt: execution.completed_at,
        duration: execution.duration,
        workflow: { id: execution.workflow_id, name: "", nodes: [], edges: [] },
      },
      logs: (logs ?? []).map((log) => ({
        id: log.id,
        executionId,
        nodeId: log.node_id,
        nodeName: log.node_name,
        nodeType: log.node_type,
        status: log.status,
        input: log.input,
        output: log.output,
        error: log.error,
        startedAt: log.started_at,
        completedAt: log.completed_at,
        duration: log.duration,
      })),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
