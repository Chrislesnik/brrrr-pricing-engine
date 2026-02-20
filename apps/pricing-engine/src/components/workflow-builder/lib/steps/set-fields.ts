/**
 * Set Fields step — defines named output fields with typed values.
 * Processes each input item individually with optional per-field conditional logic.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import { getInputItems, type DataAwareInput } from "./items-helper";
import type { WorkflowItem } from "../types/items";
import {
  evaluateStructuredConditions,
  type StructuredCondition,
} from "./condition";

export type ConditionalBranch = {
  condition: string;
  value: string;
  mode: "fixed" | "expression";
};

export type SetFieldRow = {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "json" | "array";
  mode: "fixed" | "expression";
  value: string;
  conditional?: boolean;
  branches?: ConditionalBranch[];
  elseValue?: string;
  elseMode?: "fixed" | "expression";
  /** @deprecated Use branches instead. Kept for backwards compatibility on read. */
  condition?: string;
};

/**
 * Migrate legacy single-condition rows to the branches array format.
 * Old format: { condition, value, mode } -> branches: [{ condition, value, mode }]
 */
function migrateLegacyRow(row: SetFieldRow): SetFieldRow {
  if (row.conditional && row.condition && !row.branches) {
    return {
      ...row,
      branches: [{ condition: row.condition, value: row.value, mode: row.mode }],
      condition: undefined,
    };
  }
  return row;
}

export type SetFieldsInput = StepInput & DataAwareInput & {
  /** JSON-encoded array of SetFieldRow */
  fields: string;
  /** Whether to include all fields from upstream input (default: "true") */
  includeInputFields?: string;
};

const ITEM_REF_PATTERN = /\{\{\$item\.([^}]+)\}\}/g;

/**
 * Resolve {{$item.fieldPath}} references against the current item's json.
 * Supports nested paths like {{$item.address.city}}.
 */
function resolveItemRefs(template: string, item: WorkflowItem): string {
  if (!template || typeof template !== "string") return template;
  return template.replace(ITEM_REF_PATTERN, (_match, fieldPath: string) => {
    const parts = fieldPath.split(".");
    let current: unknown = item.json;
    for (const part of parts) {
      if (current === null || current === undefined) return "";
      current = (current as Record<string, unknown>)[part];
    }
    if (current === null || current === undefined) return "";
    if (typeof current === "object") return JSON.stringify(current);
    return String(current);
  });
}

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

/**
 * Resolve $item refs in a structured condition's left/right values,
 * then evaluate with the shared condition engine.
 */
function evaluateRowCondition(
  conditionJson: string,
  item: WorkflowItem,
): boolean {
  try {
    const parsed: StructuredCondition = JSON.parse(conditionJson);
    if (!parsed?.conditions) return true;

    const resolved: StructuredCondition = {
      match: parsed.match,
      conditions: parsed.conditions.map((c) => ({
        ...c,
        leftValue: resolveItemRefs(c.leftValue, item),
        rightValue: resolveItemRefs(c.rightValue, item),
      })),
    };
    return evaluateStructuredConditions(resolved);
  } catch {
    return true;
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Per-item conditional evaluation requires nested logic
function executeSetFields(input: SetFieldsInput): { items: WorkflowItem[] } {
  let rawRows: SetFieldRow[] = [];
  try {
    rawRows = JSON.parse(input.fields || "[]");
  } catch {
    rawRows = [];
  }

  const rows = rawRows.map(migrateLegacyRow);
  const includeInput = input.includeInputFields !== "false";
  const inputItems = getInputItems(input);

  const outputItems: WorkflowItem[] = inputItems.map((item) => {
    const base: Record<string, unknown> = includeInput
      ? { ...item.json }
      : {};

    for (const row of rows) {
      if (!row.name || !row.name.trim()) continue;

      let rawValue: string;

      if (row.conditional && row.branches?.length) {
        let matched = false;
        for (const branch of row.branches) {
          if (evaluateRowCondition(branch.condition, item)) {
            rawValue = resolveItemRefs(branch.value ?? "", item);
            matched = true;
            break;
          }
        }
        if (!matched) {
          rawValue = resolveItemRefs(row.elseValue ?? "", item);
        }
      } else {
        rawValue = resolveItemRefs(row.value ?? "", item);
      }

      base[row.name.trim()] = coerceValue(rawValue!, row.type);
    }

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
