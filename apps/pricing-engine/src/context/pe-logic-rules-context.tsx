"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PELogicCondition {
  field: string;
  operator: string;
  value: string;
  value_type: "value" | "field" | "expression";
  value_field?: string;
  value_expression?: string;
}

export interface PELogicAction {
  input_id: string;
  category_id?: number;
  target_type?: "input" | "category";
  value_type: string;
  value_text?: string;
  value_visible?: boolean;
  value_required?: boolean;
  value_field?: string;
  value_expression?: string;
}

export interface PELogicRule {
  id?: number;
  type: "AND" | "OR";
  conditions: PELogicCondition[];
  actions: PELogicAction[];
}

export interface PEInputDef {
  id: string;
  category_id: number;
  category: string;
  input_label: string;
  input_type: string;
  dropdown_options: string[] | null;
  starred: boolean;
  display_order: number;
  created_at: string;
}

interface PELogicRulesContextValue {
  rules: PELogicRule[];
  inputs: PEInputDef[];
  loading: boolean;
  refreshRules: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

const PELogicRulesContext = createContext<PELogicRulesContextValue>({
  rules: [],
  inputs: [],
  loading: true,
  refreshRules: () => {},
});

export function usePELogicRules() {
  return useContext(PELogicRulesContext);
}

/* -------------------------------------------------------------------------- */
/*  Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function PELogicRulesProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<PELogicRule[]>([]);
  const [inputs, setInputs] = useState<PEInputDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const refreshRules = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [rulesRes, inputsRes] = await Promise.all([
          fetch("/api/pe-input-logic"),
          fetch("/api/pricing-engine-inputs"),
        ]);

        const rulesJson = await rulesRes.json().catch(() => ({ rules: [] }));
        const inputsJson = await inputsRes.json().catch(() => []);

        if (cancelled) return;

        setRules(
          Array.isArray(rulesJson.rules)
            ? rulesJson.rules.map((r: PELogicRule) => ({
                ...r,
                conditions: (r.conditions ?? []).map((c: PELogicCondition) => ({
                  ...c,
                  value_type: c.value_type || "value",
                })),
                actions: (r.actions ?? []).map((a: PELogicAction) => ({
                  ...a,
                  value_type: a.value_type || "value",
                })),
              }))
            : []
        );

        setInputs(Array.isArray(inputsJson) ? inputsJson : []);
      } catch {
        if (!cancelled) {
          setRules([]);
          setInputs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return (
    <PELogicRulesContext.Provider
      value={{ rules, inputs, loading, refreshRules }}
    >
      {children}
    </PELogicRulesContext.Provider>
  );
}
