/**
 * Loop Over Batches step — collects items and returns metadata.
 * The actual batching and iteration is handled by the executor.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import { getInputItems, type DataAwareInput } from "./items-helper";
import type { WorkflowItem } from "../types/items";

export type LoopBatchesInput = StepInput & DataAwareInput & {
  batchSize: string;
};

function executeLoopBatches(input: LoopBatchesInput): {
  items: WorkflowItem[];
  batchSize: number;
  totalBatches: number;
  done: false;
} {
  const batchSize = Math.max(1, parseInt(input.batchSize || "1", 10) || 1);
  const allItems = getInputItems(input);
  const totalBatches = allItems.length === 0 ? 0 : Math.ceil(allItems.length / batchSize);

  return { items: allItems, batchSize, totalBatches, done: false };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function loopBatchesStep(
  input: LoopBatchesInput,
): Promise<{ items: WorkflowItem[]; batchSize: number; totalBatches: number; done: false }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeLoopBatches(input)));
}
loopBatchesStep.maxRetries = 0;
