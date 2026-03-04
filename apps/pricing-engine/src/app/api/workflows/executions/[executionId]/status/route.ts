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

    // Get execution status
    const { data: execution, error: execErr } = await supabaseAdmin
      .from("workflow_executions")
      .select("id, status, error")
      .eq("id", executionId)
      .eq("user_id", userId)
      .single()

    if (execErr || !execution) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 })
    }

    // Get node statuses from logs
    const { data: logs } = await supabaseAdmin
      .from("workflow_execution_logs")
      .select("node_id, status")
      .eq("execution_id", executionId)

    const nodeStatuses = (logs ?? []).map((log) => ({
      nodeId: log.node_id as string,
      status: log.status as string,
    }))

    return NextResponse.json({
      status: execution.status,
      nodeStatuses,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
