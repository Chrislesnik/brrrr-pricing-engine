"use client";

import { useState, useEffect, useMemo } from "react";
import {
  evaluateDocumentRules,
  type DocumentLogicRule,
  type DocumentLogicResult,
} from "@/lib/document-logic-engine";

/**
 * React hook that fetches document logic rules and evaluates them
 * against the current deal input values.
 *
 * @param currentValues - Deal input values keyed by input_id
 * @returns hiddenDocTypes, requiredDocTypes sets + loading flag
 */
export function useDocumentLogicEngine(
  currentValues: Record<string, unknown>
): DocumentLogicResult & { loading: boolean } {
  const [rules, setRules] = useState<DocumentLogicRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch document logic rules once on mount
  useEffect(() => {
    let cancelled = false;

    const fetchRules = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/document-logic");
        const json = await res.json().catch(() => ({ rules: [] }));

        if (cancelled) return;

        setRules(
          Array.isArray(json.rules)
            ? json.rules.map((r: DocumentLogicRule) => ({
                ...r,
                conditions: (r.conditions ?? []).map((c) => ({
                  ...c,
                  value_type: c.value_type || "value",
                })),
                actions: (r.actions ?? []).map((a) => ({
                  ...a,
                  value_type: a.value_type || "visible",
                })),
              }))
            : []
        );
      } catch {
        if (!cancelled) setRules([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRules();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-evaluate whenever rules or input values change
  const result = useMemo(() => {
    if (loading || rules.length === 0) {
      return {
        hiddenDocTypes: new Set<number>(),
        requiredDocTypes: new Set<number>(),
      };
    }
    return evaluateDocumentRules(rules, currentValues);
  }, [rules, currentValues, loading]);

  return { ...result, loading };
}
