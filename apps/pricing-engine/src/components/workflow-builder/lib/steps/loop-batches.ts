/**
 * Loop Over Batches step — collects items and returns metadata.
 * The actual batching and iteration is handled by the executor.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type LoopBatchesInput = StepInput & {
  batchSize: string;
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

function executeLoopBatches(input: LoopBatchesInput): {
  items: Item[];
  batchSize: number;
  totalBatches: number;
  done: false;
} {
  const batchSize = Math.max(1, parseInt(input.batchSize || "1", 10) || 1);
  const allItems = collectItems(input._nodeOutputs ?? {});
  const totalBatches = Math.max(1, Math.ceil(allItems.length / batchSize));

  return {
    items: allItems,
    batchSize,
    totalBatches,
    done: false,
  };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function loopBatchesStep(
  input: LoopBatchesInput,
): Promise<{
  items: Item[];
  batchSize: number;
  totalBatches: number;
  done: false;
}> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeLoopBatches(input)));
}
loopBatchesStep.maxRetries = 0;
