/**
 * Limit step — takes the first or last N items from input.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type LimitInput = StepInput & {
  maxItems: string;
  from: string; // "beginning" | "end"
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

function executeLimit(input: LimitInput): { items: Item[]; count: number; originalCount: number } {
  const allItems = collectItems(input._nodeOutputs ?? {});
  const max = Math.max(0, parseInt(input.maxItems || "1", 10) || 1);
  const fromEnd = (input.from || "beginning") === "end";

  const limited = fromEnd ? allItems.slice(-max) : allItems.slice(0, max);

  return {
    items: limited,
    count: limited.length,
    originalCount: allItems.length,
  };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function limitStep(
  input: LimitInput,
): Promise<{ items: Item[]; count: number; originalCount: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeLimit(input)));
}
limitStep.maxRetries = 0;
