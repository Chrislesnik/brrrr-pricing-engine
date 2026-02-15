/**
 * Filter step — removes items that don't match conditions.
 * Uses the same structured condition format as the Condition node.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import { getInputItems, type DataAwareInput } from "./items-helper";
import type { WorkflowItem } from "../types/items";

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

export type FilterInput = StepInput & DataAwareInput & {
  condition: string;
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
  items: WorkflowItem[];
  rejectedItems: WorkflowItem[];
  keptCount: number;
  removedCount: number;
} {
  const conditionValue = input.condition || "";
  let structured: StructuredCondition | null = null;
  try {
    const parsed = JSON.parse(conditionValue);
    if (parsed && typeof parsed === "object" && "match" in parsed) {
      structured = parsed as StructuredCondition;
    }
  } catch { /* not structured */ }

  const items = getInputItems(input);

  if (!structured) {
    return { items, rejectedItems: [], keptCount: items.length, removedCount: 0 };
  }

  const kept: WorkflowItem[] = [];
  const rejected: WorkflowItem[] = [];
  for (const item of items) {
    if (evaluateConditions(structured)) {
      kept.push(item);
    } else {
      rejected.push(item);
    }
  }

  return { items: kept, rejectedItems: rejected, keptCount: kept.length, removedCount: rejected.length };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function filterStep(
  input: FilterInput,
): Promise<{ items: WorkflowItem[]; rejectedItems: WorkflowItem[]; keptCount: number; removedCount: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeFilter(input)));
}
filterStep.maxRetries = 0;
