import { evaluateOperator } from "./logic-engine";
import type { NumberConstraintsConfig, ConditionalConstraint, ConstraintCondition } from "@/types/number-constraints";

export interface ResolvedConstraints {
  min: number | null
  max: number | null
  step: number | null
}

function evaluateCondition(
  cond: ConstraintCondition,
  formValues: Record<string, unknown>,
): boolean {
  if (!cond.field || !cond.operator) return false;
  const fieldValue = formValues[cond.field];
  return evaluateOperator(cond.operator, fieldValue, cond.value);
}

function evaluateRule(
  rule: ConditionalConstraint,
  formValues: Record<string, unknown>,
): boolean {
  if (rule.conditions.length === 0) return false;
  if (rule.type === "AND") {
    return rule.conditions.every((c) => evaluateCondition(c, formValues));
  }
  return rule.conditions.some((c) => evaluateCondition(c, formValues));
}

/**
 * Evaluate conditional constraints against current form values.
 * Returns the first matching rule's min/max, or the default constraints.
 */
export function resolveNumberConstraints(
  config: NumberConstraintsConfig | null | undefined,
  formValues: Record<string, unknown>,
): ResolvedConstraints {
  if (!config) return { min: null, max: null, step: null };

  const rules = config.conditional_constraints ?? [];

  for (const rule of rules) {
    if (evaluateRule(rule, formValues)) {
      return {
        min: rule.min ?? config.min ?? null,
        max: rule.max ?? config.max ?? null,
        step: config.step ?? null,
      };
    }
  }

  return {
    min: config.min ?? null,
    max: config.max ?? null,
    step: config.step ?? null,
  };
}
