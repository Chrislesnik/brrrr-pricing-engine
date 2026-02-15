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
  /** Whether to include all fields from upstream input (default: "true") */
  includeInputFields?: string;
  /** Upstream node outputs injected by executor */
  _nodeOutputs?: Record<string, unknown>;
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

function getUpstreamFields(nodeOutputs: Record<string, unknown>): Record<string, unknown> {
  // Collect fields from the last upstream node's output
  const values = Object.values(nodeOutputs).filter(Boolean);
  const last = values[values.length - 1];
  if (!last || typeof last !== "object") return {};

  const obj = last as Record<string, unknown>;
  // Unwrap standardised { success, data } format
  if ("success" in obj && "data" in obj && obj.data && typeof obj.data === "object") {
    return obj.data as Record<string, unknown>;
  }
  // Unwrap items array format
  if (Array.isArray(last)) {
    const first = last[0];
    if (first && typeof first === "object" && "json" in first) {
      return (first as { json: Record<string, unknown> }).json;
    }
    if (first && typeof first === "object") return first as Record<string, unknown>;
  }
  return obj;
}

function executeSetFields(input: SetFieldsInput): Record<string, unknown> {
  let rows: SetFieldRow[] = [];
  try {
    rows = JSON.parse(input.fields || "[]");
  } catch {
    rows = [];
  }

  // Start with upstream fields if include is enabled (default: true)
  const includeInput = input.includeInputFields !== "false";
  const base: Record<string, unknown> = includeInput
    ? { ...getUpstreamFields(input._nodeOutputs ?? {}) }
    : {};

  // Overlay explicitly set fields
  for (const row of rows) {
    if (!row.name || !row.name.trim()) continue;
    base[row.name.trim()] = coerceValue(row.value ?? "", row.type);
  }

  return base;
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
