/**
 * Server-only workflow logging functions
 * Uses Supabase admin client for direct DB access
 */
import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type LogStepStartParams = {
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  input?: unknown;
};

export type LogStepStartResult = {
  logId: string;
  startTime: number;
};

/**
 * Log the start of a step execution
 */
export async function logStepStartDb(
  params: LogStepStartParams
): Promise<LogStepStartResult> {
  // Resolve workflow_node_id from the execution's workflow_id + node flow ID
  let workflowNodeId: string | null = null;
  try {
    const { data: exec } = await supabaseAdmin
      .from("workflow_executions")
      .select("workflow_id")
      .eq("id", params.executionId)
      .single();
    if (exec?.workflow_id) {
      const { data: wn } = await supabaseAdmin
        .from("workflow_nodes")
        .select("id")
        .eq("workflow_id", exec.workflow_id)
        .eq("flow_node_id", params.nodeId)
        .single();
      if (wn) workflowNodeId = wn.id as string;
    }
  } catch {
    // Non-blocking — continue without the FK
  }

  const { data, error } = await supabaseAdmin
    .from("workflow_execution_logs")
    .insert({
      execution_id: params.executionId,
      node_id: params.nodeId,
      node_name: params.nodeName,
      node_type: params.nodeType,
      status: "running",
      input: params.input ?? null,
      started_at: new Date().toISOString(),
      workflow_node_id: workflowNodeId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[workflow-logging] Failed to log step start:", error);
    return { logId: "", startTime: Date.now() };
  }

  return {
    logId: data.id as string,
    startTime: Date.now(),
  };
}

export type LogStepCompleteParams = {
  logId: string;
  startTime: number;
  status: "success" | "error";
  output?: unknown;
  error?: string;
};

/**
 * Log the completion of a step execution
 */
export async function logStepCompleteDb(
  params: LogStepCompleteParams
): Promise<void> {
  const duration = Date.now() - params.startTime;

  const { error } = await supabaseAdmin
    .from("workflow_execution_logs")
    .update({
      status: params.status,
      output: params.output ?? null,
      error: params.error ?? null,
      completed_at: new Date().toISOString(),
      duration: duration.toString(),
    })
    .eq("id", params.logId);

  if (error) {
    console.error("[workflow-logging] Failed to log step complete:", error);
  }
}

export type LogWorkflowCompleteParams = {
  executionId: string;
  status: "success" | "error";
  output?: unknown;
  error?: string;
  startTime: number;
};

/**
 * Log the completion of a workflow execution
 */
export async function logWorkflowCompleteDb(
  params: LogWorkflowCompleteParams
): Promise<void> {
  const duration = Date.now() - params.startTime;

  const { error } = await supabaseAdmin
    .from("workflow_executions")
    .update({
      status: params.status,
      output: params.output ?? null,
      error: params.error ?? null,
      completed_at: new Date().toISOString(),
      duration: duration.toString(),
    })
    .eq("id", params.executionId);

  if (error) {
    console.error("[workflow-logging] Failed to log workflow complete:", error);
  }
}
