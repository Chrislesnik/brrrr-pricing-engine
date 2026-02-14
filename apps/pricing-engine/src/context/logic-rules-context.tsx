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

export interface LogicCondition {
  field: string;
  operator: string;
  value: string;
  value_type: "value" | "field" | "expression";
  value_field?: string;
  value_expression?: string;
}

export interface LogicAction {
  input_id: string;
  value_type: string; // visible | not_visible | required | not_required | value | field | expression
  value_text?: string;
  value_visible?: boolean;
  value_required?: boolean;
  value_field?: string;
  value_expression?: string;
}

export interface LogicRule {
  id?: number;
  type: "AND" | "OR";
  conditions: LogicCondition[];
  actions: LogicAction[];
}

export interface InputDef {
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

interface LogicRulesContextValue {
  rules: LogicRule[];
  inputs: InputDef[];
  loading: boolean;
  refreshRules: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

const LogicRulesContext = createContext<LogicRulesContextValue>({
  rules: [],
  inputs: [],
  loading: true,
  refreshRules: () => {},
});

export function useLogicRules() {
  return useContext(LogicRulesContext);
}

/* -------------------------------------------------------------------------- */
/*  Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function LogicRulesProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<LogicRule[]>([]);
  const [inputs, setInputs] = useState<InputDef[]>([]);
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
          fetch("/api/input-logic"),
          fetch("/api/inputs"),
        ]);

        const rulesJson = await rulesRes.json().catch(() => ({ rules: [] }));
        const inputsJson = await inputsRes.json().catch(() => []);

        if (cancelled) return;

        setRules(
          Array.isArray(rulesJson.rules)
            ? rulesJson.rules.map((r: LogicRule) => ({
                ...r,
                conditions: (r.conditions ?? []).map((c) => ({
                  ...c,
                  value_type: c.value_type || "value",
                })),
                actions: (r.actions ?? []).map((a) => ({
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
    <LogicRulesContext.Provider value={{ rules, inputs, loading, refreshRules }}>
      {children}
    </LogicRulesContext.Provider>
  );
}
