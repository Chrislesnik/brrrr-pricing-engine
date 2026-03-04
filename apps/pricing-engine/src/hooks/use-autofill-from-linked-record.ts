"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";

interface InputDef {
  id: string | number;
  input_code: string;
  input_type: string;
  config?: Record<string, unknown> | null;
}

interface AutofillRule {
  id: number;
  target_input_id: number;
  source_input_id: number;
  source_linked_rule_id: number | null;
  rule_order: number;
  conditions: unknown[];
  logic_type: string;
  expression: string;
  locked: boolean;
}

interface AutofillResult {
  autofillValues: Record<string, string>;
  lockedInputCodes: Set<string>;
}

/**
 * Fetches autofill rules from `input_autofill_rules` and resolves auto-fill
 * values when linked-record selections change.
 *
 * @param inputDefs - All input definitions
 * @param recordIds - Map of source input_code → selected record ID
 * @param resolvedLinks - Map of input_id → { linked_table, linked_column } from useLinkedRules
 */
export function useAutofillFromLinkedRecord(
  inputDefs: InputDef[],
  recordIds: Record<string, string | undefined>,
  resolvedLinks?: Record<string, { linked_table: string; linked_column: string } | null>
): AutofillResult {
  const [autofillValues, setAutofillValues] = useState<Record<string, string>>({});
  const [rulesByTarget, setRulesByTarget] = useState<Record<string, AutofillRule[]>>({});
  const [rulesFetched, setRulesFetched] = useState(false);

  const inputIds = useMemo(() => inputDefs.map((inp) => String(inp.id)), [inputDefs]);
  const inputIdsKey = inputIds.join(",");

  const idToCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const inp of inputDefs) {
      map.set(String(inp.id), inp.input_code);
    }
    return map;
  }, [inputDefs]);

  const codeToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const inp of inputDefs) {
      map.set(inp.input_code, String(inp.id));
    }
    return map;
  }, [inputDefs]);

  useEffect(() => {
    if (inputIds.length === 0) {
      setRulesFetched(true);
      return;
    }
    let cancelled = false;

    const fetchRules = async () => {
      const result: Record<string, AutofillRule[]> = {};
      await Promise.all(
        inputIds.map(async (id) => {
          try {
            const res = await fetch(`/api/input-autofill-rules?target_input_id=${id}`);
            const json = await res.json();
            if (Array.isArray(json.rules) && json.rules.length > 0) {
              result[id] = json.rules;
            }
          } catch {
            // ignore
          }
        })
      );
      if (!cancelled) {
        setRulesByTarget(result);
        setRulesFetched(true);
      }
    };

    fetchRules();
    return () => { cancelled = true; };
  }, [inputIdsKey]);

  const lockedInputCodes = useMemo(() => {
    const set = new Set<string>();
    for (const [targetId, rules] of Object.entries(rulesByTarget)) {
      const code = idToCode.get(targetId);
      if (!code) continue;
      const activeRule = rules.find((r) => r.expression);
      if (activeRule?.locked) set.add(code);
    }
    return set;
  }, [rulesByTarget, idToCode]);

  const lastFetchedRef = useRef<Record<string, string>>({});

  const resolveAutofill = useCallback(async () => {
    if (!rulesFetched || Object.keys(rulesByTarget).length === 0) return;

    let cancelled = false;
    const newValues: Record<string, string> = {};
    let changed = false;

    const promises = Object.entries(rulesByTarget).flatMap(([targetId, rules]) => {
      const targetCode = idToCode.get(targetId);
      if (!targetCode) return [];

      return rules.map(async (rule) => {
        const sourceCode = idToCode.get(String(rule.source_input_id));
        if (!sourceCode) return;

        const recIdKey = `${sourceCode}_record_id`;
        const recordId = recordIds[recIdKey];
        const fetchKey = `${targetCode}:${recordId ?? ""}:${rule.source_linked_rule_id ?? "default"}`;

        if (lastFetchedRef.current[targetCode] === fetchKey) {
          if (autofillValues[targetCode] !== undefined) {
            newValues[targetCode] = autofillValues[targetCode];
          }
          return;
        }
        lastFetchedRef.current[targetCode] = fetchKey;

        if (!recordId || !rule.expression) {
          if (autofillValues[targetCode] !== undefined) {
            changed = true;
          }
          return;
        }

        // Determine which table to fetch from
        const sourceId = String(rule.source_input_id);
        const resolved = resolvedLinks?.[sourceId];
        const table = resolved?.linked_table;

        if (!table) return;

        try {
          const params = new URLSearchParams({
            table,
            id: recordId,
            expression: rule.expression,
          });
          const res = await fetch(`/api/inputs/linked-record-fields?${params.toString()}`);
          if (!res.ok) return;
          const json = await res.json();
          if (!cancelled && json.value !== undefined) {
            if (newValues[targetCode] !== json.value || autofillValues[targetCode] !== json.value) {
              newValues[targetCode] = json.value;
              changed = true;
            }
          }
        } catch {
          // ignore
        }
      });
    });

    await Promise.all(promises);

    if (!cancelled && changed) {
      setAutofillValues(newValues);
    }

    return () => { cancelled = true; };
  }, [rulesByTarget, rulesFetched, recordIds, idToCode, resolvedLinks, autofillValues]);

  useEffect(() => {
    resolveAutofill();
  }, [resolveAutofill]);

  return { autofillValues, lockedInputCodes };
}
