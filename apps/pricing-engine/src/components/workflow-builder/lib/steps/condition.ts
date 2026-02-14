/**
 * Executable step function for Condition action
 * Supports both structured conditions (visual builder) and legacy boolean passthrough
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

type ConditionRow = {
  leftValue: string;
  operator: string;
  rightValue: string;
  dataType: string;
};

type StructuredCondition = {
  match: "and" | "or";
  conditions: ConditionRow[];
};

export type ConditionInput = StepInput & {
  condition: boolean | string; // boolean (legacy) or JSON string (structured)
  /** Original condition expression string for logging */
  expression?: string;
  /** Resolved values of template variables for logging */
  values?: Record<string, unknown>;
};

type ConditionResult = {
  condition: boolean;
};

/**
 * Evaluate a single condition with typed operators
 */
function evaluateSingleCondition(cond: ConditionRow): boolean {
  const left = cond.leftValue;
  const right = cond.rightValue;
  const op = cond.operator;
  const dataType = cond.dataType || "string";

  switch (dataType) {
    case "string": {
      const l = String(left ?? "");
      const r = String(right ?? "");
      switch (op) {
        case "equals": return l === r;
        case "not_equals": return l !== r;
        case "contains": return l.includes(r);
        case "not_contains": return !l.includes(r);
        case "starts_with": return l.startsWith(r);
        case "ends_with": return l.endsWith(r);
        case "is_empty": return l.trim() === "";
        case "is_not_empty": return l.trim() !== "";
        default: return l === r;
      }
    }

    case "number": {
      const l = Number.parseFloat(String(left));
      const r = Number.parseFloat(String(right));
      if (Number.isNaN(l)) return false;
      switch (op) {
        case "equals": return l === r;
        case "not_equals": return l !== r;
        case "greater_than": return l > r;
        case "greater_than_or_equal": return l >= r;
        case "less_than": return l < r;
        case "less_than_or_equal": return l <= r;
        default: return l === r;
      }
    }

    case "boolean": {
      const l = String(left).toLowerCase();
      const isTruthy = l === "true" || l === "1" || l === "yes";
      switch (op) {
        case "is_true": return isTruthy;
        case "is_false": return !isTruthy;
        default: return isTruthy;
      }
    }

    case "date": {
      const l = new Date(String(left));
      const r = new Date(String(right));
      if (Number.isNaN(l.getTime())) return false;
      if (Number.isNaN(r.getTime()) && op !== "is_empty") return false;
      switch (op) {
        case "equals": return l.getTime() === r.getTime();
        case "is_after": return l.getTime() > r.getTime();
        case "is_before": return l.getTime() < r.getTime();
        default: return l.getTime() === r.getTime();
      }
    }

    default:
      return String(left) === String(right);
  }
}

/**
 * Evaluate structured conditions with AND/OR logic
 */
function evaluateStructuredConditions(data: StructuredCondition): boolean {
  if (!data.conditions || data.conditions.length === 0) {
    return true; // No conditions = always true
  }

  const results = data.conditions.map(evaluateSingleCondition);

  if (data.match === "or") {
    return results.some(Boolean);
  }
  // Default: AND
  return results.every(Boolean);
}

function evaluateCondition(input: ConditionInput): ConditionResult {
  const conditionValue = input.condition;

  // Boolean passthrough (legacy)
  if (typeof conditionValue === "boolean") {
    return { condition: conditionValue };
  }

  // String: could be structured JSON or a legacy expression that was pre-evaluated
  if (typeof conditionValue === "string") {
    try {
      const parsed = JSON.parse(conditionValue);
      if (parsed && typeof parsed === "object" && "match" in parsed && "conditions" in parsed) {
        // Structured condition from visual builder
        return { condition: evaluateStructuredConditions(parsed as StructuredCondition) };
      }
    } catch {
      // Not JSON — treat as truthy/falsy string
    }

    // Legacy string: "true"/"false" or expression result
    const lower = conditionValue.toLowerCase().trim();
    if (lower === "true" || lower === "1") return { condition: true };
    if (lower === "false" || lower === "0" || lower === "") return { condition: false };

    // Non-empty string is truthy
    return { condition: true };
  }

  return { condition: Boolean(conditionValue) };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function conditionStep(
  input: ConditionInput
): Promise<ConditionResult> {
  "use step";
  return withStepLogging(input, () =>
    Promise.resolve(evaluateCondition(input))
  );
}
conditionStep.maxRetries = 0;
