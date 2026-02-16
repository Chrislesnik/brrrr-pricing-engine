/**
 * Split Out step — explodes an array field into individual items.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import { getInputItems, getFieldValue, type DataAwareInput } from "./items-helper";
import type { WorkflowItem } from "../types/items";

export type SplitOutInput = StepInput & DataAwareInput & {
  fieldPath: string;
  includeOtherFields: string;
};

function executeSplitOut(input: SplitOutInput): { items: WorkflowItem[]; count: number } {
  const fieldPath = (input.fieldPath || "").trim();
  const includeOthers = input.includeOtherFields !== "false";
  const sourceItems = getInputItems(input);

  if (!fieldPath) return { items: sourceItems, count: sourceItems.length };

  const result: WorkflowItem[] = [];
  for (const item of sourceItems) {
    const value = getFieldValue(item, fieldPath);
    if (!Array.isArray(value)) {
      result.push(item);
      continue;
    }
    for (const element of value) {
      if (includeOthers) {
        const base = { ...item.json };
        const parts = fieldPath.split(".");
        base[parts[0]] = element;
        result.push({ json: base });
      } else {
        if (element && typeof element === "object") {
          result.push({ json: element as Record<string, unknown> });
        } else {
          result.push({ json: { value: element } });
        }
      }
    }
  }
  return { items: result, count: result.length };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function splitOutStep(
  input: SplitOutInput,
): Promise<{ items: WorkflowItem[]; count: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeSplitOut(input)));
}
splitOutStep.maxRetries = 0;
