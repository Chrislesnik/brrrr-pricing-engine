"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useLogicRules, type InputDef } from "@/context/logic-rules-context";
import {
  evaluateRules,
  evaluateRulesAsync,
  hasSqlConditions,
  type LogicResult,
} from "@/lib/logic-engine";

const EMPTY_RESULT: LogicResult = {
  hiddenFields: new Set<string>(),
  requiredFields: new Set<string>(),
  computedValues: {},
};

/** Debounce interval for async SQL evaluation (ms) */
const SQL_DEBOUNCE_MS = 300;

/**
 * React hook that evaluates all logic rules against the current form values.
 *
 * Consumes the LogicRulesContext for cached rules, re-evaluates whenever
 * `currentValues` changes, and returns the computed LogicResult.
 *
 * When `dealId` is provided and rules contain SQL conditions, uses the
 * async evaluation path which calls the server-side evaluate endpoint.
 * Async evaluations are debounced (300ms) to avoid excess API calls.
 *
 * @param currentValues - Current form values keyed by input_id
 * @param inputDefs     - Optional input field definitions (falls back to context)
 * @param dealId        - Optional deal UUID for SQL condition evaluation
 * @returns LogicResult with hiddenFields, requiredFields, computedValues, and evaluating flag
 */
export function useLogicEngine(
  currentValues: Record<string, unknown>,
  inputDefs?: InputDef[],
  dealId?: string
): LogicResult & { evaluating: boolean } {
  const { rules, inputs: contextInputs, loading } = useLogicRules();
  const defs = inputDefs ?? contextInputs;

  // Determine if any rules need async evaluation
  const needsAsync = useMemo(
    () => !!dealId && hasSqlConditions(rules),
    [dealId, rules]
  );

  // Synchronous result (always computed, serves as immediate baseline)
  const syncResult = useMemo(() => {
    if (loading || rules.length === 0) return EMPTY_RESULT;
    return evaluateRules(rules, defs, currentValues);
  }, [rules, defs, currentValues, loading]);

  // Async state for SQL conditions
  const [asyncResult, setAsyncResult] = useState<LogicResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(0); // monotonic counter to ignore stale results

  const runAsync = useCallback(async () => {
    if (!dealId || loading || rules.length === 0) return;

    const callId = ++abortRef.current;
    setEvaluating(true);

    try {
      const result = await evaluateRulesAsync(rules, defs, currentValues, dealId);
      // Only apply if this is still the latest call
      if (callId === abortRef.current) {
        setAsyncResult(result);
      }
    } catch (err) {
      console.error("[useLogicEngine] Async evaluation failed:", err);
    } finally {
      if (callId === abortRef.current) {
        setEvaluating(false);
      }
    }
  }, [rules, defs, currentValues, dealId, loading]);

  // Debounced async evaluation
  useEffect(() => {
    if (!needsAsync) {
      // No SQL conditions — clear any stale async state
      setAsyncResult(null);
      setEvaluating(false);
      return;
    }

    // Debounce the async call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runAsync, SQL_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [needsAsync, runAsync]);

  // Return async result when available and needed, otherwise sync
  const result = needsAsync && asyncResult ? asyncResult : syncResult;

  return {
    ...result,
    evaluating,
  };
}
