/**
 * Switch step — multi-branch routing by value matching.
 * Evaluates a value against ordered rules and returns the matched output name.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type SwitchRule = {
  output: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "gt" | "gte" | "lt" | "lte" | "regex";
  value: string;
};

export type SwitchInput = StepInput & {
  switchMode?: "rules" | "expression";
  switchValue: string;
  rules: string; // JSON-encoded SwitchRule[]
  outputExpression?: string; // template-resolved output name/index for expression mode
};

function evaluateRule(inputValue: string, rule: SwitchRule): boolean {
  const left = String(inputValue ?? "");
  const right = String(rule.value ?? "");

  switch (rule.operator) {
    case "equals":
      return left === right;
    case "not_equals":
      return left !== right;
    case "contains":
      return left.includes(right);
    case "not_contains":
      return !left.includes(right);
    case "gt":
      return parseFloat(left) > parseFloat(right);
    case "gte":
      return parseFloat(left) >= parseFloat(right);
    case "lt":
      return parseFloat(left) < parseFloat(right);
    case "lte":
      return parseFloat(left) <= parseFloat(right);
    case "regex":
      try {
        return new RegExp(right).test(left);
      } catch {
        return false;
      }
    default:
      return left === right;
  }
}

function executeSwitch(input: SwitchInput): { matchedOutput: string; value: string } {
  const mode = input.switchMode || "rules";

  // Expression mode: the outputExpression is already template-resolved by the executor
  if (mode === "expression") {
    const expr = (input.outputExpression ?? "").trim();
    // If it's a number, use it as the output index
    const asNum = parseInt(expr, 10);
    if (Number.isFinite(asNum) && asNum >= 0) {
      return { matchedOutput: String(asNum), value: expr };
    }
    // Otherwise use it as the output name directly
    return { matchedOutput: expr || "default", value: expr };
  }

  // Rules mode: evaluate value against ordered rules
  const value = input.switchValue ?? "";
  let rules: SwitchRule[] = [];
  try {
    rules = JSON.parse(input.rules || "[]");
  } catch {
    rules = [];
  }

  for (const rule of rules) {
    if (evaluateRule(value, rule)) {
      return { matchedOutput: rule.output || "default", value };
    }
  }

  return { matchedOutput: "default", value };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function switchStep(
  input: SwitchInput,
): Promise<{ matchedOutput: string; value: string }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeSwitch(input)));
}
switchStep.maxRetries = 0;
