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
  /** Computed values that should be set (input_id -> value) */
  computedValues: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/*  Condition evaluation                                                       */
/* -------------------------------------------------------------------------- */

function toNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return NaN;
  if (typeof val === "boolean") return val ? 1 : 0;
  const n = Number(val);
  return n;
}

function toString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

function evaluateOperator(
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
      return fieldValue === true || fStr === "true";
    case "is_false":
      return fieldValue === false || fStr === "false";

    default:
      return false;
  }
}

/**
 * Resolve what the condition is comparing against, based on value_type.
 */
function resolveConditionValue(
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
function evaluateCondition(
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
function evaluateRuleConditions(
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
  _inputDefs: InputDef[],
  currentValues: Record<string, unknown>
): LogicResult {
  const hiddenFields = new Set<string>();
  const requiredFields = new Set<string>();
  const computedValues: Record<string, unknown> = {};

  // Working copy of values for cascading
  let workingValues = { ...currentValues };

  for (let pass = 0; pass < MAX_CASCADE_PASSES; pass++) {
    const prevSnapshot = JSON.stringify(computedValues);

    // Clear visibility/required each pass (they rebuild from scratch)
    hiddenFields.clear();
    requiredFields.clear();

    // Process rules in order (last rule wins for conflicts)
    for (const rule of rules) {
      const conditionsMet = evaluateRuleConditions(rule, workingValues);

      if (!conditionsMet) {
        // Conditions not met — visibility/required stay at defaults (visible, not required)
        // Computed values are NOT cleared (user may have edited)
        continue;
      }

      // Apply actions
      for (const action of rule.actions) {
        const targetId = action.input_id;
        if (!targetId) continue;

        switch (action.value_type) {
          case "visible":
            hiddenFields.delete(targetId); // ensure visible
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

    // Merge computed values into working values for next cascade pass
    workingValues = { ...currentValues, ...computedValues };

    // Check if anything changed — if not, we've stabilized
    const newSnapshot = JSON.stringify(computedValues);
    if (newSnapshot === prevSnapshot) break;
  }

  return { hiddenFields, requiredFields, computedValues };
}
