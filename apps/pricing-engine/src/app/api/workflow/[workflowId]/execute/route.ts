import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { executeWorkflow } from "@/lib/workflow-executor"

type RouteContext = { params: Promise<{ workflowId: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const { workflowId } = await context.params

    const { orgId, userId } = await auth()
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }

    // Load the workflow (action) by UUID
    const { data: action, error: actionErr } = await supabaseAdmin
      .from("automations")
      .select("uuid, name, workflow_data")
      .eq("uuid", workflowId)
      .single()

    if (actionErr || !action) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    const workflowData = (action.workflow_data as { nodes?: unknown[]; edges?: unknown[] }) || {}
    const nodes = (workflowData.nodes || []) as Parameters<typeof executeWorkflow>[0]["nodes"]
    const edges = (workflowData.edges || []) as Parameters<typeof executeWorkflow>[0]["edges"]

    if (nodes.length === 0) {
      return NextResponse.json({ error: "Workflow has no nodes" }, { status: 400 })
    }

    // Parse input from request body
    const body = await request.json().catch(() => ({}))
    const input = (body.input || {}) as Record<string, unknown>

    // Create execution record
    const { data: execution, error: execErr } = await supabaseAdmin
      .from("workflow_executions")
      .insert({
        workflow_id: workflowId,
        user_id: userId,
        organization_id: orgUuid,
        status: "running",
        input,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (execErr || !execution) {
      return NextResponse.json(
        { error: execErr?.message || "Failed to create execution" },
        { status: 500 }
      )
    }

    const executionId = execution.id as string
    console.log("[API] Created execution:", executionId)

    // Fire-and-forget: execute the workflow in the background
    // We don't await this — the API returns immediately
    executeWorkflow({
      nodes,
      edges,
      triggerInput: input,
      executionId,
      workflowId,
    }).catch((err) => {
      console.error("[API] Background execution failed:", err)
      // Update execution record on fatal error
      supabaseAdmin
        .from("workflow_executions")
        .update({
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", executionId)
        .then(() => {})
    })

    // Return immediately with the execution ID
    return NextResponse.json({
      executionId,
      status: "running",
    })
  } catch (error) {
    console.error("Failed to start workflow execution:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute workflow" },
      { status: 500 }
    )
  }
}
