/**
 * Set Fields step — defines named output fields with typed values.
 * Supports both fixed values and expression-resolved template strings.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type SetFieldRow = {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "json" | "array";
  mode: "fixed" | "expression";
  value: string;
};

export type SetFieldsInput = StepInput & {
  /** JSON-encoded array of SetFieldRow */
  fields: string;
};

/**
 * Coerce a raw string value to the declared type.
 */
function coerceValue(raw: string, type: SetFieldRow["type"]): unknown {
  switch (type) {
    case "string":
      return String(raw ?? "");

    case "number": {
      const num = parseFloat(String(raw));
      return Number.isFinite(num) ? num : 0;
    }

    case "boolean": {
      const lower = String(raw ?? "").toLowerCase().trim();
      return lower === "true" || lower === "1" || lower === "yes";
    }

    case "date": {
      const d = new Date(String(raw));
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }

    case "json": {
      try {
        return JSON.parse(String(raw));
      } catch {
        return null;
      }
    }

    case "array": {
      try {
        const parsed = JSON.parse(String(raw));
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    }

    default:
      return raw;
  }
}

function executeSetFields(input: SetFieldsInput): Record<string, unknown> {
  let rows: SetFieldRow[] = [];
  try {
    rows = JSON.parse(input.fields || "[]");
  } catch {
    rows = [];
  }

  const output: Record<string, unknown> = {};

  for (const row of rows) {
    if (!row.name || !row.name.trim()) continue;
    // Value has already been template-resolved by the executor for expression mode.
    // We just coerce to the declared type.
    output[row.name.trim()] = coerceValue(row.value ?? "", row.type);
  }

  return output;
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function setFieldsStep(
  input: SetFieldsInput
): Promise<Record<string, unknown>> {
  "use step";
  return withStepLogging(input, () =>
    Promise.resolve(executeSetFields(input))
  );
}
setFieldsStep.maxRetries = 0;
