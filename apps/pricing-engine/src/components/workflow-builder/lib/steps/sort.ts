/**
 * Sort step — sorts items by a field value.
 * Matches n8n: case-insensitive string comparison, handles template-resolved field names.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import {
  getInputItems,
  getFieldValue,
  inferFieldName,
  sanitizeFieldName,
  type DataAwareInput,
} from "./items-helper";
import type { WorkflowItem } from "../types/items";

export type SortInput = StepInput &
  DataAwareInput & {
    sortField: string;
    direction: "ascending" | "descending";
    dataType: "auto" | "string" | "number" | "date";
  };

function executeSort(
  input: SortInput,
): { items: WorkflowItem[]; count: number } {
  const items = getInputItems(input);
  const dir = input.direction === "descending" ? -1 : 1;
  const dt = input.dataType || "auto";

  let field = sanitizeFieldName(input.sortField);
  if (!field) {
    field = inferFieldName(items, input.sortField);
  }
  if (!field) return { items, count: items.length };

  const sorted = [...items].sort((a, b) => {
    const va = getFieldValue(a, field);
    const vb = getFieldValue(b, field);
    if (va === undefined && vb === undefined) return 0;
    if (va === undefined) return 1;
    if (vb === undefined) return -1;

    if (dt === "number" || (dt === "auto" && typeof va === "number")) {
      const na = typeof va === "number" ? va : parseFloat(String(va));
      const nb = typeof vb === "number" ? vb : parseFloat(String(vb));
      if (isNaN(na) && isNaN(nb)) return 0;
      if (isNaN(na)) return 1;
      if (isNaN(nb)) return -1;
      return (na - nb) * dir;
    }
    if (dt === "date") {
      const da = new Date(String(va)).getTime();
      const db = new Date(String(vb)).getTime();
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return (da - db) * dir;
    }
    // Case-insensitive string comparison (matches n8n)
    return String(va)
      .toLowerCase()
      .localeCompare(String(vb).toLowerCase()) * dir;
  });

  return { items: sorted, count: sorted.length };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function sortStep(
  input: SortInput,
): Promise<{ items: WorkflowItem[]; count: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeSort(input)));
}
sortStep.maxRetries = 0;
