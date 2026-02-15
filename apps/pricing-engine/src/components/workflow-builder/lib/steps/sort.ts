/**
 * Sort step — sorts items by a field value.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type SortInput = StepInput & {
  sortField: string;
  direction: "ascending" | "descending";
  dataType: "auto" | "string" | "number" | "date";
  _nodeOutputs?: Record<string, unknown>;
};

type Item = { json: Record<string, unknown> };

function collectItems(nodeOutputs: Record<string, unknown>): Item[] {
  const items: Item[] = [];
  for (const val of Object.values(nodeOutputs)) {
    if (!val) continue;
    if (Array.isArray(val)) {
      for (const v of val) {
        if (v && typeof v === "object" && "json" in v) items.push(v as Item);
        else if (v && typeof v === "object") items.push({ json: v as Record<string, unknown> });
      }
    } else if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if ("success" in obj && "data" in obj && obj.data && typeof obj.data === "object") {
        items.push({ json: obj.data as Record<string, unknown> });
      } else {
        items.push({ json: obj });
      }
    }
  }
  return items;
}

function getField(item: Item, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = item.json;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object") current = (current as Record<string, unknown>)[part];
    else return undefined;
  }
  return current;
}

function executeSort(input: SortInput): { items: Item[]; count: number } {
  const items = collectItems(input._nodeOutputs ?? {});
  const field = (input.sortField || "").trim();
  const dir = input.direction === "descending" ? -1 : 1;
  const dt = input.dataType || "auto";

  if (!field) return { items, count: items.length };

  const sorted = [...items].sort((a, b) => {
    const va = getField(a, field);
    const vb = getField(b, field);

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

    // String comparison (default)
    return String(va).localeCompare(String(vb)) * dir;
  });

  return { items: sorted, count: sorted.length };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function sortStep(
  input: SortInput,
): Promise<{ items: Item[]; count: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeSort(input)));
}
sortStep.maxRetries = 0;
