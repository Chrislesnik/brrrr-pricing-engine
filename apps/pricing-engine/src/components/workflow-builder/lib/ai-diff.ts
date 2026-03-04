import type {
  ProposedEdgeChange,
  ProposedNodeChange,
  WorkflowEdge,
  WorkflowNode,
} from "./workflow-store";

/**
 * Compare current workflow state with AI-proposed state and produce
 * a categorized list of node and edge changes with human-readable details.
 */
export function diffWorkflow(
  currentNodes: WorkflowNode[],
  currentEdges: WorkflowEdge[],
  proposedNodes: WorkflowNode[],
  proposedEdges: WorkflowEdge[],
): {
  nodeChanges: ProposedNodeChange[];
  edgeChanges: ProposedEdgeChange[];
} {
  const nodeChanges: ProposedNodeChange[] = [];
  const edgeChanges: ProposedEdgeChange[] = [];

  const currentNodeMap = new Map(currentNodes.map((n) => [n.id, n]));
  const proposedNodeMap = new Map(proposedNodes.map((n) => [n.id, n]));

  // Detect added and modified nodes
  for (const proposed of proposedNodes) {
    const current = currentNodeMap.get(proposed.id);
    if (!current) {
      const actionType =
        (proposed.data?.config?.actionType as string) ||
        (proposed.data?.config?.triggerType as string) ||
        proposed.data?.type ||
        "Unknown";
      nodeChanges.push({
        type: "added",
        nodeId: proposed.id,
        label: proposed.data?.label || proposed.id,
        detail: `New ${actionType} node`,
        accepted: true,
        proposedNode: proposed,
      });
    } else {
      const detail = describeNodeDiff(current, proposed);
      if (detail) {
        nodeChanges.push({
          type: "modified",
          nodeId: proposed.id,
          label: proposed.data?.label || current.data?.label || proposed.id,
          detail,
          accepted: true,
          proposedNode: proposed,
          originalNode: current,
        });
      }
    }
  }

  // Detect removed nodes
  for (const current of currentNodes) {
    if (!proposedNodeMap.has(current.id)) {
      const actionType =
        (current.data?.config?.actionType as string) ||
        (current.data?.config?.triggerType as string) ||
        current.data?.type ||
        "Unknown";
      nodeChanges.push({
        type: "removed",
        nodeId: current.id,
        label: current.data?.label || current.id,
        detail: `Remove ${actionType} node`,
        accepted: true,
        originalNode: current,
      });
    }
  }

  // Edge diffing
  const currentEdgeMap = new Map(currentEdges.map((e) => [e.id, e]));
  const proposedEdgeMap = new Map(proposedEdges.map((e) => [e.id, e]));

  for (const proposed of proposedEdges) {
    const current = currentEdgeMap.get(proposed.id);
    if (!current) {
      edgeChanges.push({
        type: "added",
        edgeId: proposed.id,
        accepted: true,
        proposedEdge: proposed,
      });
    } else if (
      current.source !== proposed.source ||
      current.target !== proposed.target ||
      current.sourceHandle !== proposed.sourceHandle
    ) {
      edgeChanges.push({
        type: "modified",
        edgeId: proposed.id,
        accepted: true,
        proposedEdge: proposed,
      });
    }
  }

  for (const current of currentEdges) {
    if (!proposedEdgeMap.has(current.id)) {
      edgeChanges.push({
        type: "removed",
        edgeId: current.id,
        accepted: true,
      });
    }
  }

  return { nodeChanges, edgeChanges };
}

function describeNodeDiff(
  current: WorkflowNode,
  proposed: WorkflowNode,
): string | null {
  const parts: string[] = [];

  const curData = current.data;
  const propData = proposed.data;
  if (!curData || !propData) return null;

  // Trigger type changed
  const curTrigger = curData.config?.triggerType as string | undefined;
  const propTrigger = propData.config?.triggerType as string | undefined;
  if (curTrigger !== propTrigger && (curTrigger || propTrigger)) {
    parts.push(`Trigger: ${curTrigger || "none"} \u2192 ${propTrigger || "none"}`);
  }

  // Action type changed
  const curAction = curData.config?.actionType as string | undefined;
  const propAction = propData.config?.actionType as string | undefined;
  if (curAction !== propAction && (curAction || propAction)) {
    parts.push(`Action: ${curAction || "none"} \u2192 ${propAction || "none"}`);
  }

  // Label changed
  if (curData.label !== propData.label) {
    parts.push(`Label: "${curData.label}" \u2192 "${propData.label}"`);
  }

  // Config fields changed (beyond actionType/triggerType)
  const curConfig = curData.config || {};
  const propConfig = propData.config || {};
  const ignoredKeys = new Set(["actionType", "triggerType"]);
  const allKeys = new Set([
    ...Object.keys(curConfig),
    ...Object.keys(propConfig),
  ]);
  let configChanges = 0;
  for (const key of allKeys) {
    if (ignoredKeys.has(key)) continue;
    if (JSON.stringify(curConfig[key]) !== JSON.stringify(propConfig[key])) {
      configChanges++;
    }
  }
  if (configChanges > 0 && parts.length === 0) {
    parts.push(`${configChanges} config field${configChanges > 1 ? "s" : ""} changed`);
  }

  if (parts.length === 0) return null;
  return parts.join("; ");
}
