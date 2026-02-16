/**
 * Set Fields step — defines named output fields with typed values.
 * Processes each input item individually: applies field assignments to every item.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import { getInputItems, type DataAwareInput } from "./items-helper";
import type { WorkflowItem } from "../types/items";

export type SetFieldRow = {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "json" | "array";
  mode: "fixed" | "expression";
  value: string;
};

export type SetFieldsInput = StepInput & DataAwareInput & {
  /** JSON-encoded array of SetFieldRow */
  fields: string;
  /** Whether to include all fields from upstream input (default: "true") */
  includeInputFields?: string;
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

function executeSetFields(input: SetFieldsInput): { items: WorkflowItem[] } {
  let rows: SetFieldRow[] = [];
  try {
    rows = JSON.parse(input.fields || "[]");
  } catch {
    rows = [];
  }

  const includeInput = input.includeInputFields !== "false";
  const inputItems = getInputItems(input);

  // Build the field overrides once (same for every item)
  const overrides: Record<string, unknown> = {};
  for (const row of rows) {
    if (!row.name || !row.name.trim()) continue;
    overrides[row.name.trim()] = coerceValue(row.value ?? "", row.type);
  }

  // Apply to each input item
  const outputItems: WorkflowItem[] = inputItems.map((item) => {
    const base: Record<string, unknown> = includeInput
      ? { ...item.json }
      : {};
    // Overlay explicitly set fields
    Object.assign(base, overrides);
    return { json: base };
  });

  return { items: outputItems };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function setFieldsStep(
  input: SetFieldsInput
): Promise<{ items: WorkflowItem[] }> {
  "use step";
  return withStepLogging(input, () =>
    Promise.resolve(executeSetFields(input))
  );
}
setFieldsStep.maxRetries = 0;
