/**
 * Filter step — removes items that don't match conditions.
 * Evaluates conditions PER ITEM so each item is individually tested.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import { getInputItems, getFieldValue, type DataAwareInput } from "./items-helper";
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

/**
 * Resolve a condition value against the current item.
 * - If the value looks like a field path (no spaces, contains only word chars and dots),
 *   try to read it from item.json. If found, use the item value.
 * - Template-resolved values (from {{@...}}) are already literal strings and pass through.
 * - Explicit literals (numbers, quoted strings) pass through as-is.
 */
function resolveValue(raw: string, item: WorkflowItem): string {
  if (!raw || raw.trim() === "") return raw;

  const trimmed = raw.trim();

  // If it looks like a number literal, pass through
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return trimmed;

  // If it looks like a boolean literal, pass through
  if (trimmed === "true" || trimmed === "false") return trimmed;

  // If it contains template syntax (already resolved or leftover), pass through
  if (trimmed.includes("{{") || trimmed.includes("}}")) return trimmed;

  // If it looks like a field path (word chars, dots, brackets -- no spaces),
  // try to read from the item's json
  if (/^[\w.[\]]+$/.test(trimmed)) {
    const itemValue = getFieldValue(item, trimmed);
    if (itemValue !== undefined) {
      if (itemValue === null) return "";
      if (typeof itemValue === "object") return JSON.stringify(itemValue);
      return String(itemValue);
    }
  }

  // Otherwise pass through as literal
  return raw;
}

/**
 * Resolve a structured condition's values against a specific item.
 */
function resolveConditionForItem(
  condition: StructuredCondition,
  item: WorkflowItem,
): StructuredCondition {
  return {
    match: condition.match,
    conditions: condition.conditions.map((cond) => ({
      ...cond,
      leftValue: resolveValue(cond.leftValue, item),
      rightValue: resolveValue(cond.rightValue, item),
    })),
  };
}

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

  // Evaluate conditions PER ITEM -- resolve field values from each item's json
  const kept: WorkflowItem[] = [];
  const rejected: WorkflowItem[] = [];
  for (const item of items) {
    const resolvedCondition = resolveConditionForItem(structured, item);
    if (evaluateConditions(resolvedCondition)) {
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
