"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  linked_table?: string | null;
  linked_column?: string | null;
}

interface ResolvedLink {
  linked_table: string;
  linked_column: string;
}

/**
 * Fetches conditional linked rules for inputs that have a linked_table,
 * evaluates them against current form values, and returns
 * the resolved table + expression per input.
 *
 * Inputs without rules fall back to their static linked_table/linked_column
 * immediately (no API call needed).
 */
export function useLinkedRules(
  inputs: InputDef[],
  currentValues: Record<string, unknown>,
) {
  const [rulesByInput, setRulesByInput] = useState<Record<string, LinkedRule[]>>({});
  const [resolvedLinks, setResolvedLinks] = useState<Record<string, ResolvedLink | null>>({});
  const [rulesFetched, setRulesFetched] = useState(false);

  // Only fetch rules for inputs that have a linked_table
  const linkedInputIds = useMemo(
    () => inputs.filter((inp) => inp.linked_table).map((inp) => inp.id),
    [inputs]
  );

  // Stable key to avoid re-fetching on every render
  const linkedIdsKey = linkedInputIds.join(",");

  // Immediately resolve static links (no API needed)
  useEffect(() => {
    const resolved: Record<string, ResolvedLink | null> = {};
    for (const inp of inputs) {
      if (inp.linked_table) {
        resolved[inp.id] = {
          linked_table: inp.linked_table,
          linked_column: inp.linked_column ?? "",
        };
      }
    }
    setResolvedLinks(resolved);
  }, [inputs]);

  // Fetch conditional rules only for inputs that have a linked_table
  useEffect(() => {
    if (linkedInputIds.length === 0) {
      setRulesFetched(true);
      return;
    }
    let cancelled = false;

    const fetchRules = async () => {
      const result: Record<string, LinkedRule[]> = {};
      await Promise.all(
        linkedInputIds.map(async (id) => {
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
  }, [linkedIdsKey]);

  // Re-evaluate conditional rules whenever values or rules change
  useEffect(() => {
    if (!rulesFetched || Object.keys(rulesByInput).length === 0) return;

    setResolvedLinks((prev) => {
      const updated = { ...prev };
      let changed = false;

      for (const inp of inputs) {
        const rules = rulesByInput[inp.id];
        if (!rules || rules.length === 0) continue;

        let newLink: ResolvedLink | null = null;

        for (const rule of rules) {
          const conditions = (rule.conditions ?? []) as LogicCondition[];
          if (conditions.length === 0) {
            newLink = { linked_table: rule.linked_table, linked_column: rule.linked_column };
            break;
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

        // Fallback to static link if no rule matched
        if (!newLink && inp.linked_table) {
          newLink = { linked_table: inp.linked_table, linked_column: inp.linked_column ?? "" };
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
