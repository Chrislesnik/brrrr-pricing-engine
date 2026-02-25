/**
 * Shared helper for data-aware step functions to get input items.
 * Prefers _nodeItems (properly normalized WorkflowItem[]) over legacy _nodeOutputs.
 */
import type { WorkflowItem } from "../types/items";

export type DataAwareInput = {
  _nodeItems?: Record<string, WorkflowItem[]>;
  _nodeOutputs?: Record<string, unknown>;
};

/**
 * Get all input items from upstream nodes, preferring _nodeItems format.
 */
export function getInputItems(input: DataAwareInput): WorkflowItem[] {
  // Prefer _nodeItems (properly normalized from executor)
  if (input._nodeItems) {
    const all: WorkflowItem[] = [];
    for (const items of Object.values(input._nodeItems)) {
      if (Array.isArray(items)) all.push(...items);
    }
    if (all.length > 0) return all;
  }
  // Legacy fallback from _nodeOutputs
  return collectFromLegacy(input._nodeOutputs ?? {});
}

/**
 * Get input items separated by branch (for Merge node).
 * Returns an array of item arrays, one per upstream node.
 */
export function getInputBranches(input: DataAwareInput): WorkflowItem[][] {
  if (input._nodeItems) {
    const branches: WorkflowItem[][] = [];
    for (const items of Object.values(input._nodeItems)) {
      if (Array.isArray(items) && items.length > 0) {
        branches.push(items);
      }
    }
    if (branches.length > 0) return branches;
  }
  // Legacy fallback
  return collectBranchesFromLegacy(input._nodeOutputs ?? {});
}

/**
 * Get a nested field value from an item.
 * Supports dot notation (a.b.c) and array index notation (a[0].b).
 */
export function getFieldValue(item: WorkflowItem, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = item.json;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    // Handle array index notation like "items[0]" or bare "[0]"
    const arrayMatch = part.match(/^(.*)\[(\d+)]$/);
    if (arrayMatch) {
      const [, fieldName, indexStr] = arrayMatch;
      if (fieldName && typeof current === "object") {
        current = (current as Record<string, unknown>)[fieldName];
      }
      if (Array.isArray(current)) {
        current = current[parseInt(indexStr, 10)];
      } else {
        return undefined;
      }
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Detect when a config field (like fieldPath or sortField) was template-resolved
 * into the actual data value instead of remaining a field name string.
 *
 * Returns a usable field name string, or null if the value can't be used as a field name.
 * When the input is a non-string (object/array/number from template resolution),
 * returns null so the caller can handle the resolved value directly.
 */
export function sanitizeFieldName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // If it starts with [ or { it's likely a JSON-stringified resolved value
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return null;

  // If it's a pure number, it's a resolved value not a field name
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return null;

  return trimmed;
}

/**
 * When a template like {{@...:NodeName.year}} resolves to the VALUE (e.g., 2014)
 * instead of the field NAME ("year"), try to infer which field the user meant
 * by scanning the input items for a key whose value matches the resolved value.
 */
export function inferFieldName(
  items: WorkflowItem[],
  resolvedValue: unknown,
): string | null {
  if (items.length === 0 || resolvedValue === null || resolvedValue === undefined) {
    return null;
  }

  const sample = items[0].json;
  if (!sample || typeof sample !== "object") return null;

  // Coerce to a comparable string for loose matching
  const target = String(resolvedValue);

  for (const [key, val] of Object.entries(sample)) {
    if (key.startsWith("_")) continue;
    // Exact match (handles numbers, strings, booleans)
    if (val !== null && val !== undefined && String(val) === target) {
      return key;
    }
  }

  return null;
}

// ── Legacy fallback helpers ──

function collectFromLegacy(nodeOutputs: Record<string, unknown>): WorkflowItem[] {
  const items: WorkflowItem[] = [];
  for (const val of Object.values(nodeOutputs)) {
    if (!val) continue;
    if (Array.isArray(val)) {
      for (const v of val) {
        if (v && typeof v === "object" && "json" in v) items.push(v as WorkflowItem);
        else if (v && typeof v === "object") items.push({ json: v as Record<string, unknown> });
      }
    } else if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if ("success" in obj && "data" in obj && obj.data && typeof obj.data === "object") {
        items.push({ json: obj.data as Record<string, unknown> });
      } else {
        items.push({ json: obj });
      }
    }
  }
  return items.length > 0 ? items : [{ json: {} }];
}

function collectBranchesFromLegacy(nodeOutputs: Record<string, unknown>): WorkflowItem[][] {
  const branches: WorkflowItem[][] = [];
  for (const val of Object.values(nodeOutputs)) {
    if (!val) continue;
    const items: WorkflowItem[] = [];
    if (Array.isArray(val)) {
      for (const v of val) {
        if (v && typeof v === "object" && "json" in v) items.push(v as WorkflowItem);
        else if (v && typeof v === "object") items.push({ json: v as Record<string, unknown> });
      }
    } else if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if ("success" in obj && "data" in obj && obj.data && typeof obj.data === "object") {
        items.push({ json: obj.data as Record<string, unknown> });
      } else {
        items.push({ json: obj });
      }
    }
    if (items.length > 0) branches.push(items);
  }
  return branches;
}
