/**
 * Aggregate step — count, sum, average, min, max, or group by on input items.
 * Returns {items, count} so downstream nodes receive proper WorkflowItem flow.
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

export type AggregateInput = StepInput &
  DataAwareInput & {
    operation: "count" | "sum" | "average" | "min" | "max" | "groupBy";
    field?: string;
    groupByField?: string;
  };

function executeAggregate(
  input: AggregateInput,
): { items: WorkflowItem[]; count: number } {
  const items = getInputItems(input);
  const op = input.operation || "count";
  const field = sanitizeFieldName(input.field) || "";

  if (op === "count") {
    return {
      items: [{ json: { result: items.length, operation: "count", field: field || "*" } }],
      count: 1,
    };
  }

  if (op === "groupBy") {
    const groupField = sanitizeFieldName(input.groupByField) || field;
    if (!groupField) {
      return {
        items: [{ json: { result: 0, operation: "groupBy", error: "No group by field specified" } }],
        count: 1,
      };
    }
    const groups: Record<string, WorkflowItem[]> = {};
    for (const item of items) {
      const key = String(getFieldValue(item, groupField) ?? "undefined");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    // Return one item per group (like n8n's Summarize with separateItems mode)
    const resultItems: WorkflowItem[] = Object.entries(groups).map(
      ([key, groupItems]) => ({
        json: {
          [groupField]: key,
          count: groupItems.length,
          items: groupItems.map((i) => i.json),
        },
      }),
    );
    return { items: resultItems, count: resultItems.length };
  }

  if (!field) {
    return {
      items: [{ json: { result: 0, operation: op, error: "No field specified" } }],
      count: 1,
    };
  }

  const numbers: number[] = [];
  for (const item of items) {
    const val = getFieldValue(item, field);
    const num = typeof val === "number" ? val : parseFloat(String(val));
    if (Number.isFinite(num)) numbers.push(num);
  }
  if (numbers.length === 0) {
    return {
      items: [{ json: { result: 0, operation: op, field, count: 0 } }],
      count: 1,
    };
  }

  let result: number;
  switch (op) {
    case "sum":
      result = numbers.reduce((a, b) => a + b, 0);
      break;
    case "average":
      result = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      break;
    case "min":
      result = Math.min(...numbers);
      break;
    case "max":
      result = Math.max(...numbers);
      break;
    default:
      result = 0;
  }

  return {
    items: [{ json: { result, operation: op, field, count: numbers.length } }],
    count: 1,
  };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function aggregateStep(
  input: AggregateInput,
): Promise<{ items: WorkflowItem[]; count: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeAggregate(input)));
}
aggregateStep.maxRetries = 0;
