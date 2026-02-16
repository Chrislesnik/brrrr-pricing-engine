/**
 * Limit step — takes the first or last N items from input.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import { getInputItems, type DataAwareInput } from "./items-helper";
import type { WorkflowItem } from "../types/items";

export type LimitInput = StepInput & DataAwareInput & {
  maxItems: string;
  from: string;
};

function executeLimit(input: LimitInput): { items: WorkflowItem[]; count: number; originalCount: number } {
  const allItems = getInputItems(input);
  const max = Math.max(0, parseInt(input.maxItems || "1", 10) || 1);
  const fromEnd = (input.from || "beginning") === "end";
  const limited = fromEnd ? allItems.slice(-max) : allItems.slice(0, max);
  return { items: limited, count: limited.length, originalCount: allItems.length };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function limitStep(
  input: LimitInput,
): Promise<{ items: WorkflowItem[]; count: number; originalCount: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeLimit(input)));
}
limitStep.maxRetries = 0;
