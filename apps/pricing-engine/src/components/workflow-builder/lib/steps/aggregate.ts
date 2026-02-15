/**
 * Aggregate step — count, sum, average, min, max, or group by on input items.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type AggregateInput = StepInput & {
  operation: "count" | "sum" | "average" | "min" | "max" | "groupBy";
  field?: string;
  groupByField?: string;
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

function getFieldValue(item: Item, field: string): unknown {
  const parts = field.split(".");
  let current: unknown = item.json;
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

function executeAggregate(input: AggregateInput): Record<string, unknown> {
  const items = collectItems(input._nodeOutputs ?? {});
  const op = input.operation || "count";
  const field = (input.field || "").trim();

  if (op === "count") {
    return { result: items.length, operation: "count", field: field || "*" };
  }

  if (op === "groupBy") {
    const groupField = (input.groupByField || field || "").trim();
    if (!groupField) {
      return { result: 0, operation: "groupBy", error: "No group by field specified" };
    }
    const groups: Record<string, Item[]> = {};
    for (const item of items) {
      const key = String(getFieldValue(item, groupField) ?? "undefined");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return {
      groups,
      groupCount: Object.keys(groups).length,
      operation: "groupBy",
      field: groupField,
    };
  }

  // Numeric operations: sum, average, min, max
  if (!field) {
    return { result: 0, operation: op, error: "No field specified" };
  }

  const numbers: number[] = [];
  for (const item of items) {
    const val = getFieldValue(item, field);
    const num = typeof val === "number" ? val : parseFloat(String(val));
    if (Number.isFinite(num)) numbers.push(num);
  }

  if (numbers.length === 0) {
    return { result: 0, operation: op, field, count: 0 };
  }

  switch (op) {
    case "sum":
      return { result: numbers.reduce((a, b) => a + b, 0), operation: op, field, count: numbers.length };
    case "average":
      return { result: numbers.reduce((a, b) => a + b, 0) / numbers.length, operation: op, field, count: numbers.length };
    case "min":
      return { result: Math.min(...numbers), operation: op, field, count: numbers.length };
    case "max":
      return { result: Math.max(...numbers), operation: op, field, count: numbers.length };
    default:
      return { result: 0, operation: op, field };
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
