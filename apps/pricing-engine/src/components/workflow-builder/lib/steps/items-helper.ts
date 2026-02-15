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
 */
export function getFieldValue(item: WorkflowItem, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = item.json;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
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
