/**
 * Split Out step — explodes an array (or object values) into individual items.
 * Matches n8n behavior: objects are converted to arrays via Object.values().
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import {
  getInputItems,
  getFieldValue,
  sanitizeFieldName,
  type DataAwareInput,
} from "./items-helper";
import type { WorkflowItem } from "../types/items";

export type SplitOutInput = StepInput &
  DataAwareInput & {
    fieldPath: string;
    includeOtherFields: string;
  };

/**
 * Coerce a value into an array suitable for splitting.
 * - Arrays: if a single-element array containing a plain object (common when
 *   Set Fields wraps an object with type "array"), unwrap and convert via
 *   Object.values() so the individual entries become separate items.
 *   Multi-element arrays pass through as-is.
 * - Plain objects are converted via Object.values() (matches n8n).
 * - Primitives are wrapped in a single-element array.
 * - null/undefined return null (skip splitting).
 */
function coerceToArray(value: unknown): unknown[] | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    // Single-element array wrapping a plain data object — unwrap and split
    // the inner object's values. This handles the common case where Set Fields
    // wraps an API object (like propertyTaxes) with type "array".
    if (
      value.length === 1 &&
      value[0] &&
      typeof value[0] === "object" &&
      !Array.isArray(value[0])
    ) {
      const inner = value[0] as Record<string, unknown>;
      const vals = Object.values(inner);
      // Only unwrap if the inner object has multiple entries whose values
      // are themselves objects (indicates a key-value map, not a flat record)
      if (vals.length > 1 && vals.every((v) => v && typeof v === "object")) {
        return vals;
      }
    }
    return value;
  }
  if (typeof value === "object") return Object.values(value);
  return [value];
}

function executeSplitOut(
  input: SplitOutInput,
): { items: WorkflowItem[]; count: number } {
  const rawFieldPath = input.fieldPath;
  const includeOthers = input.includeOtherFields !== "false";
  const sourceItems = getInputItems(input);

  const fieldName = sanitizeFieldName(rawFieldPath);

  // If the template resolved to an actual value (object/array) instead of a field name,
  // split that value directly instead of doing a field lookup.
  if (fieldName === null && rawFieldPath != null && rawFieldPath !== "") {
    let directValue: unknown = rawFieldPath;

    // If it was stringified JSON by the template engine, try to parse it
    if (typeof rawFieldPath === "string") {
      try {
        directValue = JSON.parse(rawFieldPath);
      } catch {
        // Not JSON — use as-is (probably a field name that failed sanitize for another reason)
        directValue = rawFieldPath;
      }
    }

    const arr = coerceToArray(directValue);
    if (arr && arr.length > 0) {
      return splitArray(arr, includeOthers, sourceItems, null);
    }

    return { items: sourceItems, count: sourceItems.length };
  }

  if (!fieldName) return { items: sourceItems, count: sourceItems.length };

  const result: WorkflowItem[] = [];
  for (const item of sourceItems) {
    const value = getFieldValue(item, fieldName);
    const arr = coerceToArray(value);
    if (!arr) {
      result.push(item);
      continue;
    }
    for (const element of arr) {
      if (includeOthers) {
        const base = { ...item.json };
        const topKey = fieldName.split(".")[0];
        base[topKey] = element;
        result.push({ json: base });
      } else {
        if (element && typeof element === "object" && !Array.isArray(element)) {
          result.push({ json: element as Record<string, unknown> });
        } else {
          result.push({ json: { value: element } });
        }
      }
    }
  }
  return { items: result, count: result.length };
}

/**
 * Split an already-resolved array value into items.
 */
function splitArray(
  arr: unknown[],
  includeOthers: boolean,
  sourceItems: WorkflowItem[],
  fieldName: string | null,
): { items: WorkflowItem[]; count: number } {
  const result: WorkflowItem[] = [];
  for (const element of arr) {
    if (includeOthers && sourceItems.length > 0) {
      const base = { ...sourceItems[0].json };
      if (fieldName) {
        base[fieldName.split(".")[0]] = element;
      }
      result.push({ json: base });
    } else {
      if (element && typeof element === "object" && !Array.isArray(element)) {
        result.push({ json: element as Record<string, unknown> });
      } else {
        result.push({ json: { value: element } });
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
