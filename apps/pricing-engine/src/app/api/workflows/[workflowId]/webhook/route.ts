import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrgUuidFromClerkId } from "@/lib/orgs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { executeWorkflow } from "@/lib/workflow-executor";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

type RouteContext = { params: Promise<{ workflowId: string }> };

/**
 * POST /api/workflows/[workflowId]/webhook
 *
 * Webhook endpoint. Receives a JSON payload, executes the workflow
 * synchronously, and returns the HTTP response configured by a
 * "Respond to Webhook" node (or a default 200).
 */
export async function POST(request: Request, context: RouteContext) {
  const { workflowId } = await context.params;

  // Try to resolve authenticated user/org; fall back to nil UUID for external callers
  let userId = NIL_UUID;
  let orgUuid = NIL_UUID;
  try {
    const a = await auth();
    if (a.userId) userId = a.userId;
    if (a.orgId) {
      const resolved = await getOrgUuidFromClerkId(a.orgId);
      if (resolved) orgUuid = resolved;
    }
  } catch {
    // Not authenticated — use nil UUID defaults
  }

  try {
    const { data: action, error: actionErr } = await supabaseAdmin
      .from("automations")
      .select("uuid, name, workflow_data")
      .eq("uuid", workflowId)
      .is("archived_at", null)
      .single();

    if (actionErr || !action) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const workflowData = (action.workflow_data as { nodes?: unknown[]; edges?: unknown[] }) || {};
    const nodes = (workflowData.nodes || []) as Parameters<typeof executeWorkflow>[0]["nodes"];
    const edges = (workflowData.edges || []) as Parameters<typeof executeWorkflow>[0]["edges"];

    if (nodes.length === 0) {
      return NextResponse.json({ error: "Workflow has no nodes" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    const { data: execution, error: execErr } = await supabaseAdmin
      .from("workflow_executions")
      .insert({
        workflow_id: workflowId,
        user_id: userId,
        organization_id: orgUuid,
        status: "running",
        input: body,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (execErr || !execution) {
      return NextResponse.json(
        { error: execErr?.message || "Failed to create execution" },
        { status: 500 }
      );
    }

    const executionId = execution.id as string;

    const result = await executeWorkflow({
      nodes,
      edges,
      triggerInput: body,
      executionId,
      workflowId,
    });

    if (result.webhookResponse) {
      const { statusCode, body: respBody } = result.webhookResponse;
      return NextResponse.json(respBody ?? { success: result.success }, {
        status: statusCode || 200,
      });
    }

    return NextResponse.json(
      { success: result.success, executionId },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    console.error("[Webhook] Execution failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook execution failed" },
      { status: 500 }
    );
  }
}
