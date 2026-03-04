"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { evaluateCondition } from "@/lib/logic-engine";
import type { LogicCondition } from "@/context/logic-rules-context";

interface LinkedRule {
  rule_order: number;
  logic_type: "AND" | "OR";
  conditions: LogicCondition[];
  linked_table: string;
  linked_column: string;
}

interface InputDef {
  id: string;
  input_code?: string;
}

interface ResolvedLink {
  linked_table: string;
  linked_column: string;
}

/**
 * Fetches linked rules for every input from the API, evaluates conditional
 * rules against current form values, and returns the resolved table + column
 * per input.
 *
 * A rule with an empty conditions array is treated as "always matches" and
 * serves as the default/fallback (migrated from the old static linked_table
 * column).
 */
export function useLinkedRules(
  inputs: InputDef[],
  currentValues: Record<string, unknown>,
) {
  const [rulesByInput, setRulesByInput] = useState<Record<string, LinkedRule[]>>({});
  const [resolvedLinks, setResolvedLinks] = useState<Record<string, ResolvedLink | null>>({});
  const [rulesFetched, setRulesFetched] = useState(false);

  const inputIds = useMemo(() => inputs.map((inp) => inp.id), [inputs]);

  // Stable key to avoid re-fetching on every render
  const inputIdsKey = inputIds.join(",");

  // Fetch linked rules for all inputs
  useEffect(() => {
    if (inputIds.length === 0) {
      setRulesFetched(true);
      return;
    }
    let cancelled = false;

    const fetchRules = async () => {
      const result: Record<string, LinkedRule[]> = {};
      await Promise.all(
        inputIds.map(async (id) => {
          try {
            const res = await fetch(`/api/input-linked-rules?input_id=${id}`);
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
        setRulesByInput(result);
        setRulesFetched(true);
      }
    };

    fetchRules();
    return () => { cancelled = true; };
  }, [inputIdsKey]);

  // Evaluate rules whenever values or rules change
  useEffect(() => {
    if (!rulesFetched || Object.keys(rulesByInput).length === 0) return;

    setResolvedLinks((prev) => {
      const updated = { ...prev };
      let changed = false;

      for (const inp of inputs) {
        const rules = rulesByInput[inp.id];
        if (!rules || rules.length === 0) continue;

        let defaultLink: ResolvedLink | null = null;
        let newLink: ResolvedLink | null = null;

        for (const rule of rules) {
          const conditions = (rule.conditions ?? []) as LogicCondition[];

          if (conditions.length === 0) {
            defaultLink = { linked_table: rule.linked_table, linked_column: rule.linked_column };
            continue;
          }

          const pass =
            rule.logic_type === "OR"
              ? conditions.some((c) => evaluateCondition(c, currentValues))
              : conditions.every((c) => evaluateCondition(c, currentValues));

          if (pass) {
            newLink = { linked_table: rule.linked_table, linked_column: rule.linked_column };
            break;
          }
        }

        if (!newLink) {
          newLink = defaultLink;
        }

        const prevLink = prev[inp.id];
        if (
          newLink?.linked_table !== prevLink?.linked_table ||
          newLink?.linked_column !== prevLink?.linked_column
        ) {
          updated[inp.id] = newLink;
          changed = true;
        }
      }

      return changed ? updated : prev;
    });
  }, [inputs, rulesByInput, currentValues, rulesFetched]);

  const getResolvedLink = useCallback(
    (inputId: string): ResolvedLink | null => {
      return resolvedLinks[inputId] ?? null;
    },
    [resolvedLinks]
  );

  const hasRules = useCallback(
    (inputId: string): boolean => {
      return (rulesByInput[inputId]?.length ?? 0) > 0;
    },
    [rulesByInput]
  );

  const resolvedTableColumnPairs = useCallback((): Map<string, string | null> => {
    const map = new Map<string, string | null>();
    for (const inputId of Object.keys(resolvedLinks)) {
      const link = resolvedLinks[inputId];
      if (link && !map.has(link.linked_table)) {
        map.set(link.linked_table, link.linked_column || null);
      }
    }
    return map;
  }, [resolvedLinks]);

  return {
    resolvedLinks,
    getResolvedLink,
    hasRules,
    resolvedTableColumnPairs,
  };
}
