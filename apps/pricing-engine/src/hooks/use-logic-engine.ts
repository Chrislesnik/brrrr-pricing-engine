"use client";

import { useMemo } from "react";
import { useLogicRules, type InputDef } from "@/context/logic-rules-context";
import { evaluateRules, type LogicResult } from "@/lib/logic-engine";

/**
 * React hook that evaluates all logic rules against the current form values.
 *
 * Consumes the LogicRulesContext for cached rules, re-evaluates whenever
 * `currentValues` changes, and returns the computed LogicResult.
 *
 * @param currentValues - Current form values keyed by input_id
 * @param inputDefs     - Optional input field definitions (falls back to context)
 * @returns LogicResult with hiddenFields, requiredFields, and computedValues
 */
export function useLogicEngine(
  currentValues: Record<string, unknown>,
  inputDefs?: InputDef[]
): LogicResult {
  const { rules, inputs: contextInputs, loading } = useLogicRules();
  const defs = inputDefs ?? contextInputs;

  return useMemo(() => {
    // Don't evaluate while rules are still loading
    if (loading || rules.length === 0) {
      return {
        hiddenFields: new Set<string>(),
        requiredFields: new Set<string>(),
        computedValues: {},
      };
    }

    return evaluateRules(rules, defs, currentValues);
  }, [rules, defs, currentValues, loading]);
}
