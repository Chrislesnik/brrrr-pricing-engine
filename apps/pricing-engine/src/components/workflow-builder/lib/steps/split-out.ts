/**
 * Split Out step — explodes an array field into individual items.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type SplitOutInput = StepInput & {
  fieldPath: string;
  includeOtherFields: string; // "true" | "false"
  _nodeOutputs?: Record<string, unknown>;
};

type Item = { json: Record<string, unknown> };

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
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
  return items.length > 0 ? items : [{ json: {} }];
}

function executeSplitOut(input: SplitOutInput): { items: Item[]; count: number } {
  const fieldPath = (input.fieldPath || "").trim();
  const includeOthers = input.includeOtherFields !== "false";
  const sourceItems = collectItems(input._nodeOutputs ?? {});

  if (!fieldPath) {
    return { items: sourceItems, count: sourceItems.length };
  }

  const result: Item[] = [];

  for (const item of sourceItems) {
    const value = getNestedValue(item.json, fieldPath);

    if (!Array.isArray(value)) {
      result.push(item);
      continue;
    }

    for (const element of value) {
      if (includeOthers) {
        const base = { ...item.json };
        // Set the field path to the individual element
        const parts = fieldPath.split(".");
        if (parts.length === 1) {
          base[parts[0]] = element;
        } else {
          // For nested paths, just set the top-level key
          base[parts[0]] = element;
        }
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
): Promise<{ items: Item[]; count: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeSplitOut(input)));
}
splitOutStep.maxRetries = 0;
