import type { WorkflowNode, WorkflowEdge } from "@/components/workflow-builder/lib/workflow-store";
import { findActionById } from "@/components/workflow-builder/plugins";

export type SchemaField = {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  itemType?: "string" | "number" | "boolean" | "object";
  fields?: SchemaField[];
  description?: string;
};

export type TemplateOption = {
  type: "node" | "field";
  nodeId: string;
  nodeName: string;
  field?: string;
  description?: string;
  template: string;
};

/** Get a human-readable display name for a workflow node. */
export function getNodeDisplayName(node: WorkflowNode): string {
  if (node.data.label) {
    return node.data.label;
  }

  if (node.data.type === "action") {
    const actionType = node.data.config?.actionType as string | undefined;
    if (actionType) {
      const action = findActionById(actionType);
      if (action?.label) {
        return action.label;
      }
    }
    return actionType || "HTTP Request";
  }

  if (node.data.type === "trigger") {
    const triggerType = node.data.config?.triggerType as string | undefined;
    return triggerType || "Manual";
  }

  return "Node";
}

/** Convert a JSON schema array into flat field descriptors. */
export function schemaToFields(
  schema: SchemaField[],
  prefix = ""
): Array<{ field: string; description: string }> {
  const fields: Array<{ field: string; description: string }> = [];

  for (const schemaField of schema) {
    const fieldPath = prefix
      ? `${prefix}.${schemaField.name}`
      : schemaField.name;
    const typeLabel =
      schemaField.type === "array"
        ? `${schemaField.itemType}[]`
        : schemaField.type;
    const description = schemaField.description || `${typeLabel}`;

    fields.push({ field: fieldPath, description });

    if (
      schemaField.type === "object" &&
      schemaField.fields &&
      schemaField.fields.length > 0
    ) {
      fields.push(...schemaToFields(schemaField.fields, fieldPath));
    }

    if (
      schemaField.type === "array" &&
      schemaField.itemType === "object" &&
      schemaField.fields &&
      schemaField.fields.length > 0
    ) {
      const arrayItemPath = `${fieldPath}[0]`;
      fields.push(...schemaToFields(schemaField.fields, arrayItemPath));
    }
  }

  return fields;
}

/** Check if an action type matches any of the given identifiers (supports namespaced IDs). */
export function isActionType(
  actionType: string | undefined,
  ...matches: string[]
): boolean {
  if (!actionType) return false;
  return matches.some(
    (match) =>
      actionType === match ||
      actionType.endsWith(`/${match.toLowerCase().replace(/\s+/g, "-")}`)
  );
}

/** Get the common output fields for a given workflow node based on its action type. */
export function getCommonFields(node: WorkflowNode): Array<{ field: string; description: string }> {
  const actionType = node.data.config?.actionType as string | undefined;

  if (actionType === "HTTP Request") {
    return [
      { field: "data", description: "Response data" },
      { field: "status", description: "HTTP status code" },
    ];
  }

  if (actionType === "Database Query") {
    const dbSchema = node.data.config?.dbSchema as string | undefined;
    if (dbSchema) {
      try {
        const schema = JSON.parse(dbSchema) as SchemaField[];
        if (schema.length > 0) {
          return schemaToFields(schema);
        }
      } catch {
        // fall through
      }
    }
    return [
      { field: "rows", description: "Query result rows" },
      { field: "count", description: "Number of rows" },
    ];
  }

  if (isActionType(actionType, "Generate Text", "ai-gateway/generate-text")) {
    const aiFormat = node.data.config?.aiFormat as string | undefined;
    const aiSchema = node.data.config?.aiSchema as string | undefined;

    if (aiFormat === "object" && aiSchema) {
      try {
        const schema = JSON.parse(aiSchema) as SchemaField[];
        if (schema.length > 0) {
          return schemaToFields(schema, "object");
        }
      } catch {
        // fall through
      }
    }
    return [{ field: "text", description: "Generated text" }];
  }

  if (isActionType(actionType, "Get Row", "supabase/get-row")) {
    const fields: Array<{ field: string; description: string }> = [
      { field: "row", description: "The matched row object" },
      { field: "found", description: "Whether a row was found (true/false)" },
    ];
    const outputSchema = node.data.config?.outputSchema as string | undefined;
    if (outputSchema) {
      try {
        const schema = JSON.parse(outputSchema) as SchemaField[];
        if (schema.length > 0) {
          for (const s of schema) {
            fields.push({ field: `row.${s.name}`, description: s.description || s.type });
          }
          return fields;
        }
      } catch { /* fall through */ }
    }
    const tableColumns = node.data.config?._tableColumns as
      | Array<{ name: string; type: string }>
      | undefined;
    if (tableColumns?.length) {
      for (const col of tableColumns) {
        fields.push({ field: `row.${col.name}`, description: `${col.type} column` });
      }
    }
    return fields;
  }

  if (
    isActionType(actionType, "Get Many", "supabase/get-many") ||
    isActionType(actionType, "Select Rows", "supabase/select")
  ) {
    const fields: Array<{ field: string; description: string }> = [
      { field: "rows", description: "Array of matching rows" },
      { field: "count", description: "Number of rows returned" },
    ];
    const outputSchema = node.data.config?.outputSchema as string | undefined;
    if (outputSchema) {
      try {
        const schema = JSON.parse(outputSchema) as SchemaField[];
        if (schema.length > 0) {
          for (const s of schema) {
            fields.push({ field: `rows[0].${s.name}`, description: s.description || s.type });
          }
          return fields;
        }
      } catch { /* fall through */ }
    }
    const tableColumns = node.data.config?._tableColumns as
      | Array<{ name: string; type: string }>
      | undefined;
    if (tableColumns?.length) {
      for (const col of tableColumns) {
        fields.push({ field: `rows[0].${col.name}`, description: `${col.type} column` });
      }
    }
    return fields;
  }

  if (actionType === "Merge") {
    return [
      { field: "items", description: "Array of merged items" },
      { field: "count", description: "Number of merged items" },
    ];
  }

  if (actionType === "Sort") {
    return [
      { field: "items", description: "Array of sorted items" },
      { field: "count", description: "Number of items" },
    ];
  }

  if (actionType === "Remove Duplicates") {
    return [
      { field: "items", description: "Array of unique items" },
      { field: "count", description: "Number of unique items" },
      { field: "removedCount", description: "Number of duplicates removed" },
    ];
  }

  if (actionType === "Loop Over Batches") {
    return [
      { field: "items", description: "Current batch of items" },
      { field: "batchIndex", description: "Current batch index (0-based)" },
      { field: "totalBatches", description: "Total number of batches" },
      { field: "done", description: "Whether all batches are processed" },
    ];
  }

  if (actionType === "Split Out") {
    return [
      { field: "items", description: "Array of individual items from the split" },
      { field: "count", description: "Number of items produced" },
    ];
  }

  if (actionType === "Limit") {
    return [
      { field: "items", description: "Limited array of items" },
      { field: "count", description: "Number of items returned" },
      { field: "originalCount", description: "Original item count before limit" },
    ];
  }

  if (actionType === "Aggregate") {
    return [
      { field: "result", description: "Aggregation result (number)" },
      { field: "operation", description: "Operation performed" },
      { field: "field", description: "Field aggregated on" },
      { field: "count", description: "Number of values processed" },
      { field: "groups", description: "Grouped items (for Group By)" },
      { field: "groupCount", description: "Number of groups (for Group By)" },
    ];
  }

  if (actionType === "Switch") {
    return [
      { field: "matchedOutput", description: "Name of the matched output branch" },
      { field: "value", description: "The value that was evaluated" },
    ];
  }

  if (actionType === "Filter") {
    return [
      { field: "items", description: "Array of items that passed the filter (kept)" },
      { field: "rejectedItems", description: "Array of items that did not match (rejected)" },
      { field: "keptCount", description: "Number of items kept" },
      { field: "removedCount", description: "Number of items removed" },
    ];
  }

  if (actionType === "DateTime") {
    return [
      { field: "result", description: "The date operation result (string, number, or boolean)" },
      { field: "original", description: "The original date value (ISO string)" },
    ];
  }

  if (actionType === "Code") {
    return [
      { field: "items", description: "Array of output items [{json: {...}}]" },
      { field: "items[0].json", description: "First item's data object" },
      { field: "logs", description: "Captured console.log output" },
    ];
  }

  if (actionType === "Wait") {
    return [
      { field: "waited", description: "Whether the wait completed (true)" },
      { field: "duration", description: "Actual wait duration in ms" },
    ];
  }

  if (actionType === "Set Fields") {
    const fieldsJson = node.data.config?.fields as string | undefined;
    if (fieldsJson) {
      try {
        const rows = JSON.parse(fieldsJson) as Array<{ name: string; type: string }>;
        return rows
          .filter((r) => r.name && r.name.trim())
          .map((r) => ({
            field: r.name.trim(),
            description: `${r.type} field`,
          }));
      } catch { /* fall through */ }
    }
    return [{ field: "output", description: "Set Fields output object" }];
  }

  if (actionType) {
    const action = findActionById(actionType);
    if (action?.outputFields && action.outputFields.length > 0) {
      return action.outputFields;
    }
  }

  if (node.data.type === "trigger") {
    const triggerType = node.data.config?.triggerType as string | undefined;
    const webhookSchema = node.data.config?.webhookSchema as string | undefined;

    if (triggerType === "Webhook" && webhookSchema) {
      try {
        const schema = JSON.parse(webhookSchema) as SchemaField[];
        if (schema.length > 0) {
          return schemaToFields(schema);
        }
      } catch {
        // fall through
      }
    }

    return [
      { field: "triggered", description: "Trigger status" },
      { field: "timestamp", description: "Trigger timestamp" },
      { field: "input", description: "Input data" },
    ];
  }

  return [{ field: "data", description: "Output data" }];
}

/** Find all nodes upstream of the given node by traversing edges backwards. */
export function getUpstreamNodes(
  currentNodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const visited = new Set<string>();
  const upstream: string[] = [];

  const traverse = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const incomingEdges = edges.filter((edge) => edge.target === nodeId);
    for (const edge of incomingEdges) {
      upstream.push(edge.source);
      traverse(edge.source);
    }
  };

  traverse(currentNodeId);
  return nodes.filter((node) => upstream.includes(node.id));
}

/**
 * Build a flat list of template options (nodes + their fields) for a given node.
 * Used by both the TemplateAutocomplete popup and the Monaco completion provider.
 */
export function buildTemplateOptions(
  currentNodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): TemplateOption[] {
  const upstreamNodes = getUpstreamNodes(currentNodeId, nodes, edges);
  const options: TemplateOption[] = [];

  for (const node of upstreamNodes) {
    const nodeName = getNodeDisplayName(node);
    const fields = getCommonFields(node);

    options.push({
      type: "node",
      nodeId: node.id,
      nodeName,
      template: `{{@${node.id}:${nodeName}}}`,
    });

    for (const field of fields) {
      options.push({
        type: "field",
        nodeId: node.id,
        nodeName,
        field: field.field,
        description: field.description,
        template: `{{@${node.id}:${nodeName}.${field.field}}}`,
      });
    }
  }

  return options;
}
