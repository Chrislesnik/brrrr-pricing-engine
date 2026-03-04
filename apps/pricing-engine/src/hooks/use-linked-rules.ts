"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
 * Fetches conditional linked rules for a set of inputs,
 * evaluates them against current form values, and returns
 * the resolved table + expression per input.
 *
 * Inputs without rules fall back to their static linked_table/linked_column.
 */
export function useLinkedRules(
  inputs: InputDef[],
  currentValues: Record<string, unknown>,
) {
  const [rulesByInput, setRulesByInput] = useState<Record<string, LinkedRule[]>>({});
  const [resolvedLinks, setResolvedLinks] = useState<Record<string, ResolvedLink | null>>({});
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (inputs.length === 0) return;
    fetchedRef.current = false;
    let cancelled = false;

    const fetchRules = async () => {
      const result: Record<string, LinkedRule[]> = {};
      await Promise.all(
        inputs.map(async (inp) => {
          try {
            const res = await fetch(`/api/input-linked-rules?input_id=${inp.id}`);
            const json = await res.json();
            if (Array.isArray(json.rules) && json.rules.length > 0) {
              result[inp.id] = json.rules;
            }
          } catch {
            // ignore
          }
        })
      );
      if (!cancelled) {
        setRulesByInput(result);
        fetchedRef.current = true;
      }
    };

    fetchRules();
    return () => { cancelled = true; };
  }, [inputs]);

  // Re-evaluate rules whenever current values change
  useEffect(() => {
    if (!fetchedRef.current) return;

    const resolved: Record<string, ResolvedLink | null> = {};

    for (const inp of inputs) {
      const rules = rulesByInput[inp.id];

      if (!rules || rules.length === 0) {
        // No conditional rules -- use static link if present
        if (inp.linked_table) {
          resolved[inp.id] = {
            linked_table: inp.linked_table,
            linked_column: inp.linked_column ?? "",
          };
        } else {
          resolved[inp.id] = null;
        }
        continue;
      }

      // Evaluate rules in order; first match wins
      let matched = false;
      for (const rule of rules) {
        const conditions = (rule.conditions ?? []) as LogicCondition[];
        if (conditions.length === 0) {
          resolved[inp.id] = {
            linked_table: rule.linked_table,
            linked_column: rule.linked_column,
          };
          matched = true;
          break;
        }

        const pass =
          rule.logic_type === "OR"
            ? conditions.some((c) => evaluateCondition(c, currentValues))
            : conditions.every((c) => evaluateCondition(c, currentValues));

        if (pass) {
          resolved[inp.id] = {
            linked_table: rule.linked_table,
            linked_column: rule.linked_column,
          };
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Fallback: use static link if present, otherwise null
        if (inp.linked_table) {
          resolved[inp.id] = {
            linked_table: inp.linked_table,
            linked_column: inp.linked_column ?? "",
          };
        } else {
          resolved[inp.id] = null;
        }
      }
    }

    setResolvedLinks(resolved);
  }, [inputs, rulesByInput, currentValues]);

  /**
   * Get the resolved linked_table and linked_column for a specific input.
   * Returns null if no link is active (no rule matched and no static link).
   */
  const getResolvedLink = useCallback(
    (inputId: string): ResolvedLink | null => {
      return resolvedLinks[inputId] ?? null;
    },
    [resolvedLinks]
  );

  /**
   * Returns true if the input has conditional rules (not just a static link).
   */
  const hasRules = useCallback(
    (inputId: string): boolean => {
      return (rulesByInput[inputId]?.length ?? 0) > 0;
    },
    [rulesByInput]
  );

  /**
   * Build the table -> expression map from resolved links,
   * suitable for passing to the linked-records fetcher.
   */
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
