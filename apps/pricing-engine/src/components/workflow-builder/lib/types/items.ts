/**
 * Shared item type for workflow data flow.
 * Every node receives and outputs arrays of WorkflowItems.
 */
export type WorkflowItem = {
  json: Record<string, unknown>;
};

/**
 * Normalize any step output into a WorkflowItem array.
 * Handles all existing output formats for backward compatibility.
 */
export function normalizeToItems(data: unknown): WorkflowItem[] {
  if (data === null || data === undefined) return [{ json: {} }];

  // Already an array
  if (Array.isArray(data)) {
    if (data.length === 0) return [{ json: {} }];
    return data.map((d) => {
      if (d && typeof d === "object" && "json" in d) return d as WorkflowItem;
      if (d && typeof d === "object") return { json: d as Record<string, unknown> };
      return { json: { value: d } };
    });
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // Handle { items: [...] } format from data-aware nodes (Filter, Sort, etc.)
    if ("items" in obj && Array.isArray(obj.items)) {
      const items = normalizeToItems(obj.items);
      // Preserve metadata alongside items (keptCount, removedCount, etc.)
      const meta: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k !== "items") meta[k] = v;
      }
      // If there's metadata, attach it to each item under _meta
      if (Object.keys(meta).length > 0 && items.length > 0) {
        items[0] = { json: { ...items[0].json, _meta: meta } };
      }
      return items;
    }

    // Handle { success, data } standardized format (Supabase, HTTP, etc.)
    if ("success" in obj && "data" in obj) {
      const inner = obj.data;
      if (inner === null || inner === undefined) return [{ json: obj }];
      // If data contains row/rows, keep the full structure accessible
      return [{ json: obj }];
    }

    // Handle { condition: boolean } from Condition node
    // Handle { matchedOutput, value } from Switch node
    // Handle { waited, duration } from Wait node
    // Handle { result, original } from DateTime node
    // These are single-item outputs -- wrap as-is
    return [{ json: obj }];
  }

  // Primitive value
  return [{ json: { value: data } }];
}
