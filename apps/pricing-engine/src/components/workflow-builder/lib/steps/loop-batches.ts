/**
 * Loop Over Batches step — splits items into batches for sequential processing.
 * Returns one batch at a time. The executor routes to "batch" or "done" handle.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type LoopBatchesInput = StepInput & {
  batchSize: string;
  _nodeOutputs?: Record<string, unknown>;
  /** Internal: current batch index (managed by executor on loop-back) */
  _batchIndex?: number;
  /** Internal: all items stored from first call */
  _allItems?: string;
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

function executeLoopBatches(input: LoopBatchesInput): {
  items: Item[];
  batchIndex: number;
  totalBatches: number;
  done: boolean;
  allItems?: Item[];
} {
  const batchSize = Math.max(1, parseInt(input.batchSize || "1", 10) || 1);

  // Collect all items from upstream
  const allItems = collectItems(input._nodeOutputs ?? {});
  const totalBatches = Math.ceil(allItems.length / batchSize);
  const batchIndex = input._batchIndex ?? 0;

  if (allItems.length === 0 || batchIndex >= totalBatches) {
    return {
      items: allItems,
      batchIndex,
      totalBatches,
      done: true,
      allItems,
    };
  }

  const start = batchIndex * batchSize;
  const batch = allItems.slice(start, start + batchSize);
  const isLast = batchIndex >= totalBatches - 1;

  return {
    items: batch,
    batchIndex,
    totalBatches,
    done: isLast,
    allItems: isLast ? allItems : undefined,
  };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function loopBatchesStep(
  input: LoopBatchesInput,
): Promise<{
  items: Item[];
  batchIndex: number;
  totalBatches: number;
  done: boolean;
  allItems?: Item[];
}> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeLoopBatches(input)));
}
loopBatchesStep.maxRetries = 0;
