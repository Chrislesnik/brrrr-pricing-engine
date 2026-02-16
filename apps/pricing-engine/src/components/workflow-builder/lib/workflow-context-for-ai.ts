/**
 * Builds a structured text description of the current workflow's upstream nodes
 * and their output fields, suitable for inclusion in an AI system prompt.
 */
import type { WorkflowNode, WorkflowEdge } from "./workflow-store";
import { findActionById } from "../plugins";

type FieldInfo = { field: string; description: string };

function getNodeDisplayName(node: WorkflowNode): string {
  if (node.data.label) return node.data.label;
  const actionType = node.data.config?.actionType as string | undefined;
  if (actionType) {
    const action = findActionById(actionType);
    if (action?.label) return action.label;
    return actionType;
  }
  if (node.data.type === "trigger") return "Trigger";
  return node.id;
}

function getNodeOutputFields(node: WorkflowNode): FieldInfo[] {
  const actionType = node.data.config?.actionType as string | undefined;

  if (node.data.type === "trigger") {
    return [
      { field: "triggered", description: "boolean" },
      { field: "timestamp", description: "number (ms)" },
    ];
  }

  if (actionType === "HTTP Request") {
    return [
      { field: "data", description: "Response data (object)" },
      { field: "status", description: "HTTP status code (number)" },
    ];
  }

  if (actionType === "Database Query") {
    return [
      { field: "rows", description: "Query result rows (array)" },
      { field: "count", description: "Number of rows (number)" },
    ];
  }

  if (actionType === "Condition") {
    return [{ field: "condition", description: "boolean (true/false)" }];
  }

  if (actionType === "Wait") {
    return [
      { field: "waited", description: "boolean" },
      { field: "duration", description: "number (ms)" },
    ];
  }

  if (actionType === "Set Fields") {
    const fieldsJson = node.data.config?.fields as string | undefined;
    if (fieldsJson) {
      try {
        const rows = JSON.parse(fieldsJson) as Array<{ name: string; type: string }>;
        return rows
          .filter((r) => r.name?.trim())
          .map((r) => ({ field: r.name.trim(), description: r.type }));
      } catch { /* ignore */ }
    }
    return [{ field: "output", description: "object" }];
  }

  if (actionType === "Code") {
    return [
      { field: "items", description: "array of {json: {...}} items" },
      { field: "logs", description: "array of console output strings" },
    ];
  }

  // Supabase Get Row
  if (actionType?.includes("get-row") || actionType === "Get Row") {
    const fields: FieldInfo[] = [
      { field: "row", description: "The matched row (object)" },
      { field: "found", description: "boolean" },
    ];
    const outputSchema = node.data.config?.outputSchema as string | undefined;
    if (outputSchema) {
      try {
        const schema = JSON.parse(outputSchema) as Array<{ name: string; type: string }>;
        for (const s of schema) {
          fields.push({ field: `row.${s.name}`, description: s.type });
        }
      } catch { /* ignore */ }
    }
    return fields;
  }

  // Supabase Get Many
  if (actionType?.includes("get-many") || actionType === "Get Many") {
    const fields: FieldInfo[] = [
      { field: "rows", description: "array of row objects" },
      { field: "count", description: "number" },
    ];
    const outputSchema = node.data.config?.outputSchema as string | undefined;
    if (outputSchema) {
      try {
        const schema = JSON.parse(outputSchema) as Array<{ name: string; type: string }>;
        for (const s of schema) {
          fields.push({ field: `rows[0].${s.name}`, description: s.type });
        }
      } catch { /* ignore */ }
    }
    return fields;
  }

  // AI Generate Text
  if (actionType?.includes("generate-text") || actionType === "Generate Text") {
    return [{ field: "text", description: "string" }];
  }

  // Plugin actions with outputFields
  if (actionType) {
    const action = findActionById(actionType);
    if (action?.outputFields?.length) {
      return action.outputFields;
    }
  }

  return [{ field: "data", description: "unknown" }];
}

/**
 * Walk upstream from currentNodeId to collect all ancestor nodes.
 */
function getUpstreamNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  currentNodeId: string,
): WorkflowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const result: WorkflowNode[] = [];

  function walk(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    // Find all edges that target this node
    for (const edge of edges) {
      if (edge.target === nodeId && edge.source !== currentNodeId) {
        const sourceNode = nodeMap.get(edge.source);
        if (sourceNode) {
          walk(edge.source);
          result.push(sourceNode);
        }
      }
    }
  }

  walk(currentNodeId);
  return result;
}

/**
 * Build a structured text context of all upstream nodes for the AI.
 */
export function buildWorkflowContextForAI(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  currentNodeId: string,
): string {
  const upstream = getUpstreamNodes(nodes, edges, currentNodeId);

  if (upstream.length === 0) {
    return "No upstream nodes connected. $input will be empty.";
  }

  const sections = upstream.map((node) => {
    const name = getNodeDisplayName(node);
    const actionType = node.data.config?.actionType as string || node.data.type;
    const fields = getNodeOutputFields(node);
    const fieldLines = fields.map((f) => `  - ${f.field} (${f.description})`).join("\n");

    return `### Upstream Node: "${name}" (${actionType})
Output fields:
${fieldLines}
Access via: $node['${name}'].json.fieldName`;
  });

  return `## Workflow Context\n\n${sections.join("\n\n")}`;
}
