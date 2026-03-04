export interface ConstraintCondition {
  field: string
  operator: string
  value: string
}

export interface ConditionalConstraint {
  id: string
  type: "AND" | "OR"
  conditions: ConstraintCondition[]
  min?: number | null
  max?: number | null
}

export interface NumberConstraintsConfig {
  min?: number | null
  max?: number | null
  step?: number | null
  conditional_constraints?: ConditionalConstraint[]
}

export const NUMERIC_INPUT_TYPES = new Set(["number", "currency", "percentage", "calc_currency"])
