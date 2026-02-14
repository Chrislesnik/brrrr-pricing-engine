/**
 * Workflow Executor - walks the node graph and executes each step
 * Uses existing plugin step functions from the workflow builder
 */
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  stepRegistry,
  hasStep,
} from "@/components/workflow-builder/lib/steps/index";
import { triggerStep } from "@/components/workflow-builder/lib/steps/trigger";
import type { StepContext } from "@/components/workflow-builder/lib/steps/step-handler";
import { findActionById } from "@/components/workflow-builder/plugins";

// Types matching the workflow store
type WorkflowNode = {
  id: string;
  type?: string;
  data: {
    label?: string;
    description?: string;
    type: string;
    config?: Record<string, unknown>;
    status?: string;
    enabled?: boolean;
  };
  position: { x: number; y: number };
};

type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
};

type ExecutionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

type NodeOutputs = Record<string, { label: string; data: unknown }>;

export type WorkflowExecutionInput = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggerInput?: Record<string, unknown>;
  executionId: string;
  workflowId: string;
};

/**
 * Process template variables in config values
 * Replaces {{@nodeId:Label.field}} with actual values from previous node outputs
 */
function processTemplates(
  config: Record<string, unknown>,
  outputs: NodeOutputs
): Record<string, unknown> {
  const processed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      const templatePattern = /\{\{@([^:]+):([^}]+)\}\}/g;
      let processedValue = value;

      processedValue = processedValue.replace(
        templatePattern,
        (_match, nodeId: string, rest: string) => {
          const sanitizedNodeId = nodeId.replace(/[^a-zA-Z0-9]/g, "_");
          const output = outputs[sanitizedNodeId];
          if (!output) return _match;

          const dotIndex = rest.indexOf(".");
          if (dotIndex === -1) {
            const data = output.data;
            if (data === null || data === undefined) return "";
            if (typeof data === "object") return JSON.stringify(data);
            return String(data);
          }

          if (output.data === null || output.data === undefined) return "";

          const fieldPath = rest.substring(dotIndex + 1);
          const fields = fieldPath.split(".");
          let current: unknown = output.data;

          // For standardized { success, data } outputs, look inside data
          if (
            current &&
            typeof current === "object" &&
            "success" in (current as Record<string, unknown>) &&
            "data" in (current as Record<string, unknown>) &&
            fields[0] !== "success" &&
            fields[0] !== "data" &&
            fields[0] !== "error"
          ) {
            current = (current as Record<string, unknown>).data;
          }

          for (const field of fields) {
            if (current && typeof current === "object") {
              current = (current as Record<string, unknown>)[field];
            } else {
              return "";
            }
          }

          if (current === null || current === undefined) return "";
          if (typeof current === "object") return JSON.stringify(current);
          return String(current);
        }
      );

      processed[key] = processedValue;
    } else {
      processed[key] = value;
    }
  }

  return processed;
}

/**
 * Get a meaningful display name for a node
 */
function getNodeName(node: WorkflowNode): string {
  if (node.data.label) return node.data.label;
  if (node.data.type === "action") {
    const actionType = node.data.config?.actionType as string;
    return actionType || "Action";
  }
  if (node.data.type === "trigger") {
    return (node.data.config?.triggerType as string) || "Trigger";
  }
  return node.data.type;
}

/**
 * Resolve an action type to its registry label.
 * Supports both namespaced IDs ("perplexity/search") and labels ("Search Web").
 */
function resolveActionType(actionType: string): string {
  // If it's already a registry key (label), return as-is
  if (hasStep(actionType)) return actionType;

  // Try resolving via plugin registry (handles "perplexity/search" -> label "Search Web")
  const action = findActionById(actionType);
  if (action && hasStep(action.label)) return action.label;

  return actionType;
}

/**
 * Look up and call a step function from the registry
 */
async function callPluginStep(
  actionType: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const resolved = resolveActionType(actionType);

  if (hasStep(resolved)) {
    const step = stepRegistry[resolved];
    return step(input);
  }

  return {
    success: false,
    error: { message: `Unknown action type: "${actionType}" (resolved: "${resolved}"). Available actions: ${Object.keys(stepRegistry).join(", ")}` },
  };
}

/**
 * Main workflow executor
 * Walks the node graph from trigger nodes, executing each step in order
 */
export async function executeWorkflow(input: WorkflowExecutionInput) {
  const { nodes, edges, triggerInput = {}, executionId, workflowId } = input;

  console.log("[Executor] Starting workflow execution:", {
    executionId,
    workflowId,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  });

  const outputs: NodeOutputs = {};
  const results: Record<string, ExecutionResult> = {};

  // Build graph maps
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edgesBySource = new Map<string, string[]>();
  for (const edge of edges) {
    const targets = edgesBySource.get(edge.source) || [];
    targets.push(edge.target);
    edgesBySource.set(edge.source, targets);
  }

  // Find trigger nodes (no incoming edges, type "trigger")
  const nodesWithIncoming = new Set(edges.map((e) => e.target));
  const triggerNodes = nodes.filter(
    (node) => node.data.type === "trigger" && !nodesWithIncoming.has(node.id)
  );

  console.log("[Executor] Found", triggerNodes.length, "trigger nodes");

  /**
   * Execute a single node and then its downstream nodes
   */
  async function executeNode(nodeId: string, visited: Set<string> = new Set()) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return;

    // Skip disabled nodes
    if (node.data.enabled === false) {
      const sanitizedNodeId = nodeId.replace(/[^a-zA-Z0-9]/g, "_");
      outputs[sanitizedNodeId] = { label: node.data.label || nodeId, data: null };
      const nextNodes = edgesBySource.get(nodeId) || [];
      await Promise.all(nextNodes.map((nid) => executeNode(nid, visited)));
      return;
    }

    const nodeName = getNodeName(node);
    const stepContext: StepContext = {
      executionId,
      nodeId: node.id,
      nodeName,
      nodeType: node.data.type === "trigger"
        ? (node.data.config?.triggerType as string) || "Trigger"
        : (node.data.config?.actionType as string) || "Action",
    };

    try {
      let result: ExecutionResult;

      if (node.data.type === "trigger") {
        // Execute trigger
        const config = node.data.config || {};
        let triggerData: Record<string, unknown> = {
          triggered: true,
          timestamp: Date.now(),
        };

        // Handle webhook mock request for test runs
        const triggerType = config.triggerType as string;
        if (
          triggerType === "Webhook" &&
          config.webhookMockRequest &&
          (!triggerInput || Object.keys(triggerInput).length === 0)
        ) {
          try {
            const mockData = JSON.parse(config.webhookMockRequest as string);
            triggerData = { ...triggerData, ...mockData };
          } catch {
            // ignore parse errors
          }
        } else if (triggerInput && Object.keys(triggerInput).length > 0) {
          triggerData = { ...triggerData, ...triggerInput };
        }

        const triggerResult = await triggerStep({
          triggerData,
          _context: stepContext,
        });

        result = { success: triggerResult.success, data: triggerResult.data };
      } else if (node.data.type === "action") {
        const config = node.data.config || {};
        const actionType = config.actionType as string | undefined;

        if (!actionType) {
          result = {
            success: false,
            error: `Action node "${nodeName}" has no action type configured`,
          };
          results[nodeId] = result;
          return;
        }

        // Process template variables in config
        const processedConfig = processTemplates({ ...config }, outputs);

        // Add step context
        processedConfig._context = stepContext;

        // Execute the step
        const stepResult = await callPluginStep(actionType, processedConfig);

        // Check result format
        const isErrorResult =
          stepResult &&
          typeof stepResult === "object" &&
          "success" in (stepResult as Record<string, unknown>) &&
          (stepResult as { success: boolean }).success === false;

        if (isErrorResult) {
          const errorResult = stepResult as {
            success: false;
            error?: string | { message: string };
          };
          const errorMessage =
            typeof errorResult.error === "string"
              ? errorResult.error
              : errorResult.error?.message || `Step "${actionType}" failed`;
          result = { success: false, error: errorMessage };
        } else {
          result = { success: true, data: stepResult };
        }
      } else {
        result = { success: false, error: `Unknown node type: ${node.data.type}` };
      }

      // Store results
      results[nodeId] = result;
      const sanitizedNodeId = nodeId.replace(/[^a-zA-Z0-9]/g, "_");
      outputs[sanitizedNodeId] = { label: node.data.label || nodeId, data: result.data };

      // Execute downstream nodes
      if (result.success) {
        const isConditionNode =
          node.data.type === "action" &&
          node.data.config?.actionType === "Condition";

        if (isConditionNode) {
          const conditionResult = (result.data as { condition?: boolean })?.condition;
          if (conditionResult === true) {
            const nextNodes = edgesBySource.get(nodeId) || [];
            await Promise.all(nextNodes.map((nid) => executeNode(nid, visited)));
          }
        } else {
          const nextNodes = edgesBySource.get(nodeId) || [];
          await Promise.all(nextNodes.map((nid) => executeNode(nid, visited)));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[Executor] Error executing node:", nodeId, errorMessage);
      results[nodeId] = { success: false, error: errorMessage };
    }
  }

  // Execute from trigger nodes
  const workflowStartTime = Date.now();

  try {
    await Promise.all(triggerNodes.map((trigger) => executeNode(trigger.id)));

    const finalSuccess = Object.values(results).every((r) => r.success);
    const duration = Date.now() - workflowStartTime;

    console.log("[Executor] Workflow completed:", {
      success: finalSuccess,
      duration,
      resultCount: Object.keys(results).length,
    });

    // Update execution record
    await supabaseAdmin
      .from("workflow_executions")
      .update({
        status: finalSuccess ? "success" : "error",
        output: Object.values(results).at(-1)?.data ?? null,
        error: Object.values(results).find((r) => !r.success)?.error ?? null,
        completed_at: new Date().toISOString(),
        duration: duration.toString(),
      })
      .eq("id", executionId);

    return { success: finalSuccess, results, outputs };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Executor] Fatal error:", errorMessage);

    await supabaseAdmin
      .from("workflow_executions")
      .update({
        status: "error",
        error: errorMessage,
        completed_at: new Date().toISOString(),
        duration: (Date.now() - workflowStartTime).toString(),
      })
      .eq("id", executionId);

    return { success: false, results, outputs, error: errorMessage };
  }
}
