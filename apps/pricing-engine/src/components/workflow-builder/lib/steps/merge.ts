/**
 * Merge step — combines data from multiple workflow branches.
 * Modes: append, byPosition, byField (with join types and clash handling).
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type MergeInput = StepInput & {
  mode: "append" | "byPosition" | "byField";
  joinField?: string;
  joinMode?: "keepMatches" | "keepEverything" | "keepNonMatches" | "enrichInput1" | "enrichInput2";
  clashHandling?: "preferInput1" | "preferInput2" | "addSuffix";
  multipleMatches?: "all" | "first";
  _nodeOutputs?: Record<string, unknown>;
};

type Item = { json: Record<string, unknown> };

function collectBranches(nodeOutputs: Record<string, unknown>): Item[][] {
  const branches: Item[][] = [];
  for (const val of Object.values(nodeOutputs)) {
    if (!val) continue;
    const items: Item[] = [];
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
    if (items.length > 0) branches.push(items);
  }
  return branches;
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

/** Build a composite key from multiple fields for matching */
function buildKey(item: Item, fields: string[]): string {
  return fields.map((f) => String(getField(item, f.trim()) ?? "")).join("||");
}

/** Merge two items' json with clash handling */
function mergeItems(
  item1: Item,
  item2: Item,
  clash: string,
): Item {
  if (clash === "addSuffix") {
    const json: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(item1.json)) {
      json[`${k}_1`] = v;
    }
    for (const [k, v] of Object.entries(item2.json)) {
      json[`${k}_2`] = v;
    }
    return { json };
  }
  if (clash === "preferInput1") {
    return { json: { ...item2.json, ...item1.json } };
  }
  // preferInput2 (default)
  return { json: { ...item1.json, ...item2.json } };
}

function executeMerge(input: MergeInput): { items: Item[]; count: number } {
  const branches = collectBranches(input._nodeOutputs ?? {});
  const mode = input.mode || "append";

  if (branches.length === 0) {
    return { items: [], count: 0 };
  }

  if (mode === "append") {
    const items = branches.flat();
    return { items, count: items.length };
  }

  if (mode === "byPosition") {
    const maxLen = Math.max(...branches.map((b) => b.length));
    const items: Item[] = [];
    const clash = input.clashHandling || "preferInput2";
    for (let i = 0; i < maxLen; i++) {
      let merged: Item = { json: {} };
      for (let b = 0; b < branches.length; b++) {
        const item = branches[b][i];
        if (item) merged = mergeItems(merged, item, clash);
      }
      items.push(merged);
    }
    return { items, count: items.length };
  }

  if (mode === "byField") {
    const joinFieldStr = (input.joinField || "").trim();
    if (!joinFieldStr || branches.length < 2) {
      const items = branches.flat();
      return { items, count: items.length };
    }

    const joinFields = joinFieldStr.split(",").map((f) => f.trim()).filter(Boolean);
    const joinModeVal = input.joinMode || "keepMatches";
    const clash = input.clashHandling || "preferInput2";
    const multiMatch = input.multipleMatches || "all";

    const input1 = branches[0];
    const input2 = branches[1];

    // Build lookup from input2
    const lookup = new Map<string, Item[]>();
    for (const item of input2) {
      const key = buildKey(item, joinFields);
      if (!lookup.has(key)) lookup.set(key, []);
      lookup.get(key)!.push(item);
    }

    const matched: Item[] = [];
    const unmatched1: Item[] = [];
    const matched2Keys = new Set<string>();

    for (const item1 of input1) {
      const key = buildKey(item1, joinFields);
      const matches = lookup.get(key);

      if (matches && matches.length > 0) {
        const toMerge = multiMatch === "first" ? [matches[0]] : matches;
        for (const item2 of toMerge) {
          matched.push(mergeItems(item1, item2, clash));
        }
        matched2Keys.add(key);
      } else {
        unmatched1.push(item1);
      }
    }

    const unmatched2 = input2.filter(
      (item) => !matched2Keys.has(buildKey(item, joinFields))
    );

    switch (joinModeVal) {
      case "keepMatches":
        return { items: matched, count: matched.length };
      case "keepEverything":
        return { items: [...matched, ...unmatched1, ...unmatched2], count: matched.length + unmatched1.length + unmatched2.length };
      case "keepNonMatches":
        return { items: [...unmatched1, ...unmatched2], count: unmatched1.length + unmatched2.length };
      case "enrichInput1":
        return { items: [...matched, ...unmatched1], count: matched.length + unmatched1.length };
      case "enrichInput2":
        return { items: [...matched, ...unmatched2], count: matched.length + unmatched2.length };
      default:
        return { items: matched, count: matched.length };
    }
  }

  const items = branches.flat();
  return { items, count: items.length };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function mergeStep(
  input: MergeInput,
): Promise<{ items: Item[]; count: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeMerge(input)));
}
mergeStep.maxRetries = 0;
