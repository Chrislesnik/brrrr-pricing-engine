/**
 * Remove Duplicates step — deduplicates items by a key field.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import { getInputItems, getFieldValue, type DataAwareInput } from "./items-helper";
import type { WorkflowItem } from "../types/items";

export type RemoveDuplicatesInput = StepInput & DataAwareInput & {
  dedupField: string;
  keep: "first" | "last";
};

function executeRemoveDuplicates(input: RemoveDuplicatesInput): {
  items: WorkflowItem[];
  count: number;
  removedCount: number;
} {
  const items = getInputItems(input);
  const field = (input.dedupField || "").trim();
  const keepMode = input.keep || "first";

  if (!field) return { items, count: items.length, removedCount: 0 };

  if (keepMode === "last") {
    const reversed = [...items].reverse();
    const seen = new Set<string>();
    const deduped: WorkflowItem[] = [];
    for (const item of reversed) {
      const key = String(getFieldValue(item, field) ?? "");
      if (!seen.has(key)) { seen.add(key); deduped.push(item); }
    }
    deduped.reverse();
    return { items: deduped, count: deduped.length, removedCount: items.length - deduped.length };
  }

  const seen = new Set<string>();
  const deduped: WorkflowItem[] = [];
  for (const item of items) {
    const key = String(getFieldValue(item, field) ?? "");
    if (!seen.has(key)) { seen.add(key); deduped.push(item); }
  }
  return { items: deduped, count: deduped.length, removedCount: items.length - deduped.length };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function removeDuplicatesStep(
  input: RemoveDuplicatesInput,
): Promise<{ items: WorkflowItem[]; count: number; removedCount: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeRemoveDuplicates(input)));
}
removeDuplicatesStep.maxRetries = 0;
