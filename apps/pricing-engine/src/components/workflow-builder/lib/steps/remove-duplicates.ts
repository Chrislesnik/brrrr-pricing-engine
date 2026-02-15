/**
 * Remove Duplicates step — deduplicates items by a key field.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type RemoveDuplicatesInput = StepInput & {
  dedupField: string;
  keep: "first" | "last";
  _nodeOutputs?: Record<string, unknown>;
};

type Item = { json: Record<string, unknown> };

function collectItems(nodeOutputs: Record<string, unknown>): Item[] {
  const items: Item[] = [];
  for (const val of Object.values(nodeOutputs)) {
    if (!val) continue;
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
  }
  return items;
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

function executeRemoveDuplicates(input: RemoveDuplicatesInput): {
  items: Item[];
  count: number;
  removedCount: number;
} {
  const items = collectItems(input._nodeOutputs ?? {});
  const field = (input.dedupField || "").trim();
  const keepMode = input.keep || "first";

  if (!field) {
    return { items, count: items.length, removedCount: 0 };
  }

  if (keepMode === "last") {
    // Reverse, dedup keeping first (which is actually last), then reverse back
    const reversed = [...items].reverse();
    const seen = new Set<string>();
    const deduped: Item[] = [];
    for (const item of reversed) {
      const key = String(getField(item, field) ?? "");
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }
    deduped.reverse();
    return { items: deduped, count: deduped.length, removedCount: items.length - deduped.length };
  }

  // Keep first
  const seen = new Set<string>();
  const deduped: Item[] = [];
  for (const item of items) {
    const key = String(getField(item, field) ?? "");
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return { items: deduped, count: deduped.length, removedCount: items.length - deduped.length };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function removeDuplicatesStep(
  input: RemoveDuplicatesInput,
): Promise<{ items: Item[]; count: number; removedCount: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeRemoveDuplicates(input)));
}
removeDuplicatesStep.maxRetries = 0;
