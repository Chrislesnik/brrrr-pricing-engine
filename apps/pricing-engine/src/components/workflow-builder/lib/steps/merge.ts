/**
 * Merge step — combines data from multiple workflow branches.
 * Modes: append, byPosition, byField.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type MergeInput = StepInput & {
  mode: "append" | "byPosition" | "byField";
  joinField?: string;
  _nodeOutputs?: Record<string, unknown>;
};

type Item = { json: Record<string, unknown> };

function collectBranches(nodeOutputs: Record<string, unknown>): Item[][] {
  const branches: Item[][] = [];
  for (const val of Object.values(nodeOutputs)) {
    if (!val) continue;
    const items: Item[] = [];
    if (Array.isArray(val)) {
      for (const v of val) {
        if (v && typeof v === "object" && "json" in v) items.push(v as Item);
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

function getField(item: Item, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = item.json;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object") current = (current as Record<string, unknown>)[part];
    else return undefined;
  }
  return current;
}

function executeMerge(input: MergeInput): { items: Item[]; count: number } {
  const branches = collectBranches(input._nodeOutputs ?? {});
  const mode = input.mode || "append";

  if (branches.length === 0) {
    return { items: [], count: 0 };
  }

  if (mode === "append") {
    const items = branches.flat();
    return { items, count: items.length };
  }

  if (mode === "byPosition") {
    const maxLen = Math.max(...branches.map((b) => b.length));
    const items: Item[] = [];
    for (let i = 0; i < maxLen; i++) {
      const merged: Record<string, unknown> = {};
      for (let b = 0; b < branches.length; b++) {
        const item = branches[b][i];
        if (item) Object.assign(merged, item.json);
      }
      items.push({ json: merged });
    }
    return { items, count: items.length };
  }

  if (mode === "byField") {
    const joinField = (input.joinField || "").trim();
    if (!joinField || branches.length < 2) {
      const items = branches.flat();
      return { items, count: items.length };
    }
    // Use first branch as base, join with others
    const base = branches[0];
    const items: Item[] = [];
    for (const baseItem of base) {
      const baseKey = String(getField(baseItem, joinField) ?? "");
      const merged: Record<string, unknown> = { ...baseItem.json };
      for (let b = 1; b < branches.length; b++) {
        const match = branches[b].find(
          (item) => String(getField(item, joinField) ?? "") === baseKey
        );
        if (match) Object.assign(merged, match.json);
      }
      items.push({ json: merged });
    }
    return { items, count: items.length };
  }

  const items = branches.flat();
  return { items, count: items.length };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function mergeStep(
  input: MergeInput,
): Promise<{ items: Item[]; count: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeMerge(input)));
}
mergeStep.maxRetries = 0;
