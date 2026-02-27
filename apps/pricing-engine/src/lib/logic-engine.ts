/**
 * Logic engine — evaluates rules against current form values.
 *
 * Supports:
 *  - Condition operators (text, number, date, boolean)
 *  - Action types: visible, not_visible, required, not_required, value, field, expression
 *  - Cascading evaluation (max 10 passes)
 *  - Last-rule-wins conflict resolution
 *  - Undo for visibility/required when conditions become false
 */

import { evaluateExpression } from "./expression-evaluator";
import type { LogicRule, LogicCondition, LogicAction, InputDef } from "@/context/logic-rules-context";

/* -------------------------------------------------------------------------- */
/*  Public types                                                               */
/* -------------------------------------------------------------------------- */

export interface LogicResult {
  /** Fields that should be hidden */
  hiddenFields: Set<string>;
  /** Fields that should be required */
  requiredFields: Set<string>;
  /** Fields that require re-calculation when changed */
  recalcFields: Set<string>;
  /** Computed values that should be set (input_id -> value) */
  computedValues: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/*  Condition evaluation                                                       */
/* -------------------------------------------------------------------------- */

export function toNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return NaN;
  if (typeof val === "boolean") return val ? 1 : 0;
  const n = Number(val);
  return n;
}

export function toString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

export function evaluateOperator(
  operator: string,
  fieldValue: unknown,
  compareValue: unknown
): boolean {
  const fStr = toString(fieldValue).toLowerCase();
  const cStr = toString(compareValue).toLowerCase();
  const fNum = toNumber(fieldValue);
  const cNum = toNumber(compareValue);

  switch (operator) {
    // Existence
    case "exists":
      return fieldValue !== null && fieldValue !== undefined;
    case "does_not_exist":
      return fieldValue === null || fieldValue === undefined;

    // Empty
    case "is_empty":
      return fStr === "" || fieldValue === null || fieldValue === undefined;
    case "is_not_empty":
      return fStr !== "" && fieldValue !== null && fieldValue !== undefined;

    // Equality
    case "equals":
      return fStr === cStr;
    case "not_equals":
      return fStr !== cStr;

    // Text operators
    case "contains":
      return fStr.includes(cStr);
    case "does_not_contain":
      return !fStr.includes(cStr);
    case "starts_with":
      return fStr.startsWith(cStr);
    case "does_not_start_with":
      return !fStr.startsWith(cStr);
    case "ends_with":
      return fStr.endsWith(cStr);
    case "does_not_end_with":
      return !fStr.endsWith(cStr);

    // Numeric operators
    case "greater_than":
      return !isNaN(fNum) && !isNaN(cNum) && fNum > cNum;
    case "less_than":
      return !isNaN(fNum) && !isNaN(cNum) && fNum < cNum;
    case "greater_than_or_equal":
      return !isNaN(fNum) && !isNaN(cNum) && fNum >= cNum;
    case "less_than_or_equal":
      return !isNaN(fNum) && !isNaN(cNum) && fNum <= cNum;

    // Date operators (compare as strings — ISO format sorts correctly)
    case "is_after":
      return fStr > cStr;
    case "is_before":
      return fStr < cStr;
    case "is_after_or_equal":
      return fStr >= cStr;
    case "is_before_or_equal":
      return fStr <= cStr;

    // Boolean
    case "is_true":
      return fieldValue === true || fStr === "true" || fStr === "yes";
    case "is_false":
      return fieldValue === false || fStr === "false" || fStr === "no";

    default:
      return false;
  }
}

/**
 * Resolve what the condition is comparing against, based on value_type.
 */
export function resolveConditionValue(
  cond: LogicCondition,
  currentValues: Record<string, unknown>
): unknown {
  const vt = cond.value_type || "value";

  switch (vt) {
    case "field":
      return cond.value_field ? (currentValues[cond.value_field] ?? null) : null;
    case "expression":
      return cond.value_expression
        ? evaluateExpression(cond.value_expression, currentValues)
        : null;
    case "value":
    default:
      return cond.value;
  }
}

/**
 * Evaluate whether a single condition passes.
 */
export function evaluateCondition(
  cond: LogicCondition,
  currentValues: Record<string, unknown>
): boolean {
  const fieldValue = currentValues[cond.field] ?? null;
  const compareValue = resolveConditionValue(cond, currentValues);
  return evaluateOperator(cond.operator, fieldValue, compareValue);
}

/**
 * Evaluate whether a rule's conditions pass (AND = all, OR = any).
 */
export function evaluateRuleConditions(
  rule: LogicRule,
  currentValues: Record<string, unknown>
): boolean {
  if (!rule.conditions || rule.conditions.length === 0) return true;

  if (rule.type === "OR") {
    return rule.conditions.some((c) => evaluateCondition(c, currentValues));
  }
  // AND (default)
  return rule.conditions.every((c) => evaluateCondition(c, currentValues));
}

/**
 * Resolve an action's value based on its value_type.
 */
function resolveActionValue(
  action: LogicAction,
  currentValues: Record<string, unknown>
): unknown {
  const vt = action.value_type;

  switch (vt) {
    case "value":
      return action.value_text ?? "";
    case "field":
      return action.value_field ? (currentValues[action.value_field] ?? null) : null;
    case "expression":
      return action.value_expression
        ? evaluateExpression(action.value_expression, currentValues)
        : null;
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Main evaluation function                                                   */
/* -------------------------------------------------------------------------- */

const MAX_CASCADE_PASSES = 10;

/**
 * Evaluate all logic rules against the current form values.
 *
 * @param rules         - All logic rules from the database
 * @param inputDefs     - Input field definitions (for type info)
 * @param currentValues - Current form values keyed by input_id
 * @returns LogicResult with hidden fields, required fields, and computed values
 */
export function evaluateRules(
  rules: LogicRule[],
  inputDefs: InputDef[],
  currentValues: Record<string, unknown>
): LogicResult {
  const hiddenFields = new Set<string>();
  const requiredFields = new Set<string>();
  const computedValues: Record<string, unknown> = {};

  const categoryInputMap = new Map<number, string[]>();
  for (const inp of inputDefs) {
    if (inp.category_id) {
      const existing = categoryInputMap.get(inp.category_id) ?? [];
      existing.push(inp.id);
      categoryInputMap.set(inp.category_id, existing);
    }
  }

  let workingValues = { ...currentValues };

  for (let pass = 0; pass < MAX_CASCADE_PASSES; pass++) {
    const prevSnapshot = JSON.stringify(computedValues);

    hiddenFields.clear();
    requiredFields.clear();

    for (const rule of rules) {
      const conditionsMet = evaluateRuleConditions(rule, workingValues);

      if (!conditionsMet) {
        continue;
      }

      for (const action of rule.actions) {
        if (action.category_id && action.target_type === "category") {
          const inputIds = categoryInputMap.get(action.category_id) ?? [];
          if (action.value_type === "not_visible") {
            for (const id of inputIds) hiddenFields.add(id);
          } else if (action.value_type === "visible") {
            for (const id of inputIds) hiddenFields.delete(id);
          }
          continue;
        }

        const targetId = action.input_id;
        if (!targetId) continue;

        switch (action.value_type) {
          case "visible":
            hiddenFields.delete(targetId);
            break;
          case "not_visible":
            hiddenFields.add(targetId);
            break;
          case "required":
            requiredFields.add(targetId);
            break;
          case "not_required":
            requiredFields.delete(targetId);
            break;
          case "value":
          case "field":
          case "expression": {
            const computed = resolveActionValue(action, workingValues);
            if (computed !== null && computed !== undefined) {
              computedValues[targetId] = computed;
            }
            break;
          }
        }
      }
    }

    workingValues = { ...currentValues, ...computedValues };

    const newSnapshot = JSON.stringify(computedValues);
    if (newSnapshot === prevSnapshot) break;
  }

  return { hiddenFields, requiredFields, recalcFields: new Set<string>(), computedValues };
}

/* -------------------------------------------------------------------------- */
/*  Async evaluation (supports SQL conditions)                                 */
/* -------------------------------------------------------------------------- */

/**
 * Evaluate a single SQL condition by calling the server-side evaluate endpoint.
 */
async function evaluateSqlCondition(
  cond: LogicCondition,
  dealId: string
): Promise<boolean> {
  if (!cond.sql_expression) return false;

  try {
    const res = await fetch("/api/task-logic-rules/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql_expression: cond.sql_expression,
        deal_id: dealId,
      }),
    });

    if (!res.ok) return false;

    const json = await res.json();
    return !!json.result;
  } catch {
    console.error("[evaluateSqlCondition] Failed to evaluate SQL condition");
    return false;
  }
}

/**
 * Evaluate a single condition — sync for input conditions, async for SQL.
 */
async function evaluateConditionAsync(
  cond: LogicCondition,
  currentValues: Record<string, unknown>,
  dealId: string
): Promise<boolean> {
  const sourceType = cond.source_type || "input";

  if (sourceType === "sql") {
    return evaluateSqlCondition(cond, dealId);
  }

  // Default: sync input-based evaluation
  return evaluateCondition(cond, currentValues);
}

/**
 * Evaluate whether a rule's conditions pass (AND/OR), with async SQL support.
 * SQL conditions within a rule are evaluated in parallel.
 */
async function evaluateRuleConditionsAsync(
  rule: LogicRule,
  currentValues: Record<string, unknown>,
  dealId: string
): Promise<boolean> {
  if (!rule.conditions || rule.conditions.length === 0) return true;

  // Evaluate all conditions in parallel
  const results = await Promise.all(
    rule.conditions.map((c) =>
      evaluateConditionAsync(c, currentValues, dealId)
    )
  );

  if (rule.type === "OR") {
    return results.some(Boolean);
  }
  // AND (default)
  return results.every(Boolean);
}

/**
 * Async version of evaluateRules that supports SQL conditions.
 *
 * For rules containing only input conditions, evaluation is synchronous.
 * For rules with SQL conditions, calls the server evaluate endpoint.
 * Cascade logic is preserved (max 10 passes).
 *
 * @param rules         - All logic rules from the database
 * @param inputDefs     - Input field definitions (for type info)
 * @param currentValues - Current form values keyed by input_id
 * @param dealId        - The deal UUID for SQL condition evaluation
 * @returns Promise<LogicResult>
 */
export async function evaluateRulesAsync(
  rules: LogicRule[],
  inputDefs: InputDef[],
  currentValues: Record<string, unknown>,
  dealId: string
): Promise<LogicResult> {
  const hiddenFields = new Set<string>();
  const requiredFields = new Set<string>();
  const computedValues: Record<string, unknown> = {};

  const categoryInputMap = new Map<number, string[]>();
  for (const inp of inputDefs) {
    if (inp.category_id) {
      const existing = categoryInputMap.get(inp.category_id) ?? [];
      existing.push(inp.id);
      categoryInputMap.set(inp.category_id, existing);
    }
  }

  let workingValues = { ...currentValues };

  for (let pass = 0; pass < MAX_CASCADE_PASSES; pass++) {
    const prevSnapshot = JSON.stringify(computedValues);

    hiddenFields.clear();
    requiredFields.clear();

    for (const rule of rules) {
      const hasSql = rule.conditions?.some(
        (c) => c.source_type === "sql"
      );

      const conditionsMet = hasSql
        ? await evaluateRuleConditionsAsync(rule, workingValues, dealId)
        : evaluateRuleConditions(rule, workingValues);

      if (!conditionsMet) continue;

      for (const action of rule.actions) {
        if (action.category_id && action.target_type === "category") {
          const inputIds = categoryInputMap.get(action.category_id) ?? [];
          if (action.value_type === "not_visible") {
            for (const id of inputIds) hiddenFields.add(id);
          } else if (action.value_type === "visible") {
            for (const id of inputIds) hiddenFields.delete(id);
          }
          continue;
        }

        const targetId = action.input_id;
        if (!targetId) continue;

        switch (action.value_type) {
          case "visible":
            hiddenFields.delete(targetId);
            break;
          case "not_visible":
            hiddenFields.add(targetId);
            break;
          case "required":
            requiredFields.add(targetId);
            break;
          case "not_required":
            requiredFields.delete(targetId);
            break;
          case "value":
          case "field":
          case "expression": {
            const computed = resolveActionValue(action, workingValues);
            if (computed !== null && computed !== undefined) {
              computedValues[targetId] = computed;
            }
            break;
          }
        }
      }
    }

    workingValues = { ...currentValues, ...computedValues };

    const newSnapshot = JSON.stringify(computedValues);
    if (newSnapshot === prevSnapshot) break;
  }

  return { hiddenFields, requiredFields, recalcFields: new Set<string>(), computedValues };
}

/**
 * Check whether any rules contain SQL conditions.
 */
export function hasSqlConditions(rules: LogicRule[]): boolean {
  return rules.some((r) =>
    r.conditions?.some((c) => c.source_type === "sql")
  );
}
