/**
 * Aggregate step — count, sum, average, min, max, or group by on input items.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import { getInputItems, getFieldValue, type DataAwareInput } from "./items-helper";
import type { WorkflowItem } from "../types/items";

export type AggregateInput = StepInput & DataAwareInput & {
  operation: "count" | "sum" | "average" | "min" | "max" | "groupBy";
  field?: string;
  groupByField?: string;
};

function executeAggregate(input: AggregateInput): Record<string, unknown> {
  const items = getInputItems(input);
  const op = input.operation || "count";
  const field = (input.field || "").trim();

  if (op === "count") {
    return { result: items.length, operation: "count", field: field || "*" };
  }

  if (op === "groupBy") {
    const groupField = (input.groupByField || field || "").trim();
    if (!groupField) return { result: 0, operation: "groupBy", error: "No group by field specified" };
    const groups: Record<string, WorkflowItem[]> = {};
    for (const item of items) {
      const key = String(getFieldValue(item, groupField) ?? "undefined");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return { groups, groupCount: Object.keys(groups).length, operation: "groupBy", field: groupField };
  }

  if (!field) return { result: 0, operation: op, error: "No field specified" };

  const numbers: number[] = [];
  for (const item of items) {
    const val = getFieldValue(item, field);
    const num = typeof val === "number" ? val : parseFloat(String(val));
    if (Number.isFinite(num)) numbers.push(num);
  }
  if (numbers.length === 0) return { result: 0, operation: op, field, count: 0 };

  switch (op) {
    case "sum": return { result: numbers.reduce((a, b) => a + b, 0), operation: op, field, count: numbers.length };
    case "average": return { result: numbers.reduce((a, b) => a + b, 0) / numbers.length, operation: op, field, count: numbers.length };
    case "min": return { result: Math.min(...numbers), operation: op, field, count: numbers.length };
    case "max": return { result: Math.max(...numbers), operation: op, field, count: numbers.length };
    default: return { result: 0, operation: op, field };
  }
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function aggregateStep(
  input: AggregateInput,
): Promise<Record<string, unknown>> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeAggregate(input)));
}
aggregateStep.maxRetries = 0;
