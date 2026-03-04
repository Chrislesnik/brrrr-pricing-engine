import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

type RouteContext = { params: Promise<{ workflowId: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { workflowId } = await context.params

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("workflow_executions")
      .select("id, workflow_id, user_id, status, input, output, error, started_at, completed_at, duration")
      .eq("workflow_id", workflowId)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const executions = (data ?? []).map((row) => ({
      id: row.id,
      workflowId: row.workflow_id,
      userId: row.user_id,
      status: row.status,
      input: row.input,
      output: row.output,
      error: row.error,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      duration: row.duration,
    }))

    return NextResponse.json(executions)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { workflowId } = await context.params

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete all executions (logs cascade automatically)
    const { error, count } = await supabaseAdmin
      .from("workflow_executions")
      .delete()
      .eq("workflow_id", workflowId)
      .eq("user_id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deletedCount: count ?? 0 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
