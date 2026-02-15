/**
 * Filter step — removes items that don't match conditions.
 * Uses the same structured condition format as the Condition node.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

type ConditionRow = {
  leftValue: string;
  operator: string;
  rightValue: string;
  dataType: string;
};

type StructuredCondition = {
  match: "and" | "or";
  conditions: ConditionRow[];
};

export type FilterInput = StepInput & {
  condition: string; // JSON structured condition (same as Condition node)
  _nodeOutputs?: Record<string, unknown>;
};

function evaluateSingle(cond: ConditionRow): boolean {
  const left = cond.leftValue;
  const right = cond.rightValue;
  const dt = cond.dataType || "string";

  switch (dt) {
    case "string": {
      const l = String(left ?? "");
      const r = String(right ?? "");
      switch (cond.operator) {
        case "equals": return l === r;
        case "not_equals": return l !== r;
        case "contains": return l.includes(r);
        case "not_contains": return !l.includes(r);
        case "starts_with": return l.startsWith(r);
        case "ends_with": return l.endsWith(r);
        case "is_empty": return l.trim() === "";
        case "is_not_empty": return l.trim() !== "";
        default: return l === r;
      }
    }
    case "number": {
      const l = parseFloat(String(left));
      const r = parseFloat(String(right));
      if (isNaN(l)) return false;
      switch (cond.operator) {
        case "equals": return l === r;
        case "not_equals": return l !== r;
        case "greater_than": return l > r;
        case "greater_than_or_equal": return l >= r;
        case "less_than": return l < r;
        case "less_than_or_equal": return l <= r;
        default: return l === r;
      }
    }
    case "boolean": {
      const l = String(left).toLowerCase();
      const truthy = l === "true" || l === "1" || l === "yes";
      switch (cond.operator) {
        case "is_true": return truthy;
        case "is_false": return !truthy;
        default: return truthy;
      }
    }
    case "date": {
      const l = new Date(String(left));
      const r = new Date(String(right));
      if (isNaN(l.getTime())) return false;
      if (isNaN(r.getTime()) && cond.operator !== "is_empty") return false;
      switch (cond.operator) {
        case "equals": return l.getTime() === r.getTime();
        case "is_after": return l.getTime() > r.getTime();
        case "is_before": return l.getTime() < r.getTime();
        default: return l.getTime() === r.getTime();
      }
    }
    default:
      return String(left) === String(right);
  }
}

function evaluateConditions(data: StructuredCondition): boolean {
  if (!data.conditions || data.conditions.length === 0) return true;
  const results = data.conditions.map(evaluateSingle);
  return data.match === "or" ? results.some(Boolean) : results.every(Boolean);
}

function executeFilter(input: FilterInput): {
  items: Array<{ json: Record<string, unknown> }>;
  keptCount: number;
  removedCount: number;
} {
  const conditionValue = input.condition || "";

  // Parse the structured condition
  let structured: StructuredCondition | null = null;
  try {
    const parsed = JSON.parse(conditionValue);
    if (parsed && typeof parsed === "object" && "match" in parsed) {
      structured = parsed as StructuredCondition;
    }
  } catch { /* not structured */ }

  // Get items from upstream (merged from _nodeOutputs)
  const nodeOutputs = input._nodeOutputs ?? {};
  const allValues = Object.values(nodeOutputs).filter(Boolean);
  const items: Array<{ json: Record<string, unknown> }> = [];

  for (const val of allValues) {
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item === "object" && "json" in item) {
          items.push(item as { json: Record<string, unknown> });
        } else if (item && typeof item === "object") {
          items.push({ json: item as Record<string, unknown> });
        }
      }
    } else if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if ("success" in obj && "data" in obj && typeof obj.data === "object" && obj.data !== null) {
        items.push({ json: obj.data as Record<string, unknown> });
      } else {
        items.push({ json: obj });
      }
    }
  }

  // If no structured condition, pass all items through
  if (!structured) {
    return { items, rejectedItems: [], keptCount: items.length, removedCount: 0 };
  }

  // Filter items — conditions reference resolved template values
  // Since templates are already resolved by the executor, just evaluate
  const kept: typeof items = [];
  const rejected: typeof items = [];
  for (const item of items) {
    if (evaluateConditions(structured)) {
      kept.push(item);
    } else {
      rejected.push(item);
    }
  }

  return {
    items: kept,
    rejectedItems: rejected,
    keptCount: kept.length,
    removedCount: rejected.length,
  };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function filterStep(
  input: FilterInput,
): Promise<{ items: Array<{ json: Record<string, unknown> }>; rejectedItems: Array<{ json: Record<string, unknown> }>; keptCount: number; removedCount: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeFilter(input)));
}
filterStep.maxRetries = 0;
