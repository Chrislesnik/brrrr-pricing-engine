"use client";

import { useMemo } from "react";
import { usePELogicRules, type PEInputDef } from "@/context/pe-logic-rules-context";
import {
  evaluateOperator,
  resolveConditionValue,
  type LogicResult,
} from "@/lib/logic-engine";
import { evaluateExpression } from "@/lib/expression-evaluator";
import type { LogicCondition, LogicRule } from "@/context/logic-rules-context";

const EMPTY_RESULT: LogicResult = {
  hiddenFields: new Set<string>(),
  requiredFields: new Set<string>(),
  recalcFields: new Set<string>(),
  computedValues: {},
};

const MAX_CASCADE_PASSES = 10;

/**
 * React hook that evaluates PE input logic rules against current loan scenario values.
 *
 * Consumes PELogicRulesContext for cached rules, re-evaluates whenever
 * `currentValues` changes.
 *
 * @param currentValues - Current pricing engine input values keyed by input_id
 * @param inputDefs     - Optional input field definitions (falls back to context)
 * @returns LogicResult with hiddenFields, requiredFields, computedValues
 */
export function usePELogicEngine(
  currentValues: Record<string, unknown>,
  inputDefs?: PEInputDef[]
): LogicResult {
  const { rules: peRules, inputs: contextInputs, loading } = usePELogicRules();
  const defs = inputDefs ?? contextInputs;

  const result = useMemo(() => {
    if (loading || peRules.length === 0) return EMPTY_RESULT;

    const hiddenFields = new Set<string>();
    const requiredFields = new Set<string>();
    const recalcFields = new Set<string>();
    const computedValues: Record<string, unknown> = {};

    const categoryInputMap = new Map<number, string[]>();
    for (const inp of defs) {
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
      recalcFields.clear();

      for (const rule of peRules) {
        const conditionsMet = evaluateRuleConditions(rule, workingValues);

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
            case "recalculate":
              recalcFields.add(targetId);
              break;
            case "no_recalculate":
              recalcFields.delete(targetId);
              break;
            case "value":
              if (action.value_text !== undefined && action.value_text !== null) {
                computedValues[targetId] = action.value_text;
              }
              break;
            case "field":
              if (action.value_field) {
                computedValues[targetId] = workingValues[action.value_field] ?? null;
              }
              break;
            case "expression":
              if (action.value_expression) {
                computedValues[targetId] = evaluateExpression(
                  action.value_expression,
                  workingValues
                );
              }
              break;
          }
        }
      }

      workingValues = { ...currentValues, ...computedValues };

      const newSnapshot = JSON.stringify(computedValues);
      if (newSnapshot === prevSnapshot) break;
    }

    return { hiddenFields, requiredFields, recalcFields, computedValues };
  }, [peRules, defs, currentValues, loading]);

  return result;
}

function evaluateRuleConditions(
  rule: { type: "AND" | "OR"; conditions: Array<{ field: string; operator: string; value: string; value_type: string; value_field?: string; value_expression?: string }> },
  currentValues: Record<string, unknown>
): boolean {
  if (!rule.conditions || rule.conditions.length === 0) return true;

  const evaluate = (c: { field: string; operator: string; value: string; value_type: string; value_field?: string; value_expression?: string }) => {
    const fieldValue = currentValues[c.field] ?? null;
    const cond = c as unknown as LogicCondition;
    const compareValue = resolveConditionValue(cond, currentValues);
    return evaluateOperator(c.operator, fieldValue, compareValue);
  };

  if (rule.type === "OR") {
    return rule.conditions.some(evaluate);
  }
  return rule.conditions.every(evaluate);
}
