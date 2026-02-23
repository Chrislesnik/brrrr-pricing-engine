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
  source_type?: "input" | "sql"; // defaults to "input"
  field: string;
  operator: string;
  value: string;
  value_type: "value" | "field" | "expression";
  value_field?: string;
  value_expression?: string;
  sql_expression?: string;
}

export interface LogicAction {
  input_id: string;
  category_id?: number;
  target_type?: "input" | "category";
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

/** Task logic action (different shape from input logic actions) */
export interface TaskLogicAction {
  target_task_template_id: number;
  action_type: string;
  value_type?: string;
  value_text?: string;
  value_visible?: boolean;
  value_required?: boolean;
  value_field?: string;
  value_expression?: string;
  required_status_id?: number;
  required_for_stage_id?: number;
}

/** Task logic rule (conditions shared with input logic, actions target tasks) */
export interface TaskLogicRule {
  id?: number;
  task_template_id?: number;
  name?: string;
  description?: string;
  type: "AND" | "OR";
  is_active?: boolean;
  execution_order?: number;
  conditions: LogicCondition[];
  actions: TaskLogicAction[];
}

interface LogicRulesContextValue {
  /** Input logic rules (control input field visibility/required/computed) */
  rules: LogicRule[];
  /** Task logic rules (control task visibility/required, may have SQL conditions) */
  taskRules: TaskLogicRule[];
  inputs: InputDef[];
  loading: boolean;
  refreshRules: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

const LogicRulesContext = createContext<LogicRulesContextValue>({
  rules: [],
  taskRules: [],
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
  const [taskRules, setTaskRules] = useState<TaskLogicRule[]>([]);
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
        const [rulesRes, inputsRes, taskRulesRes] = await Promise.all([
          fetch("/api/input-logic"),
          fetch("/api/inputs"),
          fetch("/api/task-logic-rules"),
        ]);

        const rulesJson = await rulesRes.json().catch(() => ({ rules: [] }));
        const inputsJson = await inputsRes.json().catch(() => []);
        const taskRulesJson = await taskRulesRes
          .json()
          .catch(() => ({ rules: [] }));

        if (cancelled) return;

        // Input logic rules (source_type always "input")
        setRules(
          Array.isArray(rulesJson.rules)
            ? rulesJson.rules.map((r: LogicRule) => ({
                ...r,
                conditions: (r.conditions ?? []).map((c: LogicCondition) => ({
                  ...c,
                  source_type: c.source_type || "input",
                  value_type: c.value_type || "value",
                })),
                actions: (r.actions ?? []).map((a: LogicAction) => ({
                  ...a,
                  value_type: a.value_type || "value",
                })),
              }))
            : []
        );

        // Task logic rules (may include SQL conditions)
        setTaskRules(
          Array.isArray(taskRulesJson.rules)
            ? taskRulesJson.rules.map((r: TaskLogicRule) => ({
                ...r,
                conditions: (r.conditions ?? []).map((c: LogicCondition) => ({
                  ...c,
                  source_type: c.source_type || "input",
                  value_type: c.value_type || "value",
                })),
              }))
            : []
        );

        setInputs(Array.isArray(inputsJson) ? inputsJson : []);
      } catch {
        if (!cancelled) {
          setRules([]);
          setTaskRules([]);
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
    <LogicRulesContext.Provider
      value={{ rules, taskRules, inputs, loading, refreshRules }}
    >
      {children}
    </LogicRulesContext.Provider>
  );
}
