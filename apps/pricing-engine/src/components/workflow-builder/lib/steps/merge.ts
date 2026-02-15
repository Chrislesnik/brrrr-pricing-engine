/**
 * Merge step — combines data from multiple workflow branches.
 * Modes: append, byPosition, byField (with join types and clash handling).
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";
import { getInputBranches, getFieldValue, type DataAwareInput } from "./items-helper";
import type { WorkflowItem } from "../types/items";

export type MergeInput = StepInput & DataAwareInput & {
  mode: "append" | "byPosition" | "byField";
  joinField?: string;
  joinMode?: "keepMatches" | "keepEverything" | "keepNonMatches" | "enrichInput1" | "enrichInput2";
  clashHandling?: "preferInput1" | "preferInput2" | "addSuffix";
  multipleMatches?: "all" | "first";
};

function buildKey(item: WorkflowItem, fields: string[]): string {
  return fields.map((f) => String(getFieldValue(item, f.trim()) ?? "")).join("||");
}

function mergeItems(item1: WorkflowItem, item2: WorkflowItem, clash: string): WorkflowItem {
  if (clash === "addSuffix") {
    const json: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(item1.json)) json[`${k}_1`] = v;
    for (const [k, v] of Object.entries(item2.json)) json[`${k}_2`] = v;
    return { json };
  }
  if (clash === "preferInput1") return { json: { ...item2.json, ...item1.json } };
  return { json: { ...item1.json, ...item2.json } };
}

function executeMerge(input: MergeInput): { items: WorkflowItem[]; count: number } {
  const branches = getInputBranches(input);
  const mode = input.mode || "append";

  if (branches.length === 0) return { items: [], count: 0 };

  if (mode === "append") {
    const items = branches.flat();
    return { items, count: items.length };
  }

  if (mode === "byPosition") {
    const maxLen = Math.max(...branches.map((b) => b.length));
    const clash = input.clashHandling || "preferInput2";
    const items: WorkflowItem[] = [];
    for (let i = 0; i < maxLen; i++) {
      let merged: WorkflowItem = { json: {} };
      for (const branch of branches) {
        if (branch[i]) merged = mergeItems(merged, branch[i], clash);
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
    const lookup = new Map<string, WorkflowItem[]>();
    for (const item of input2) {
      const key = buildKey(item, joinFields);
      if (!lookup.has(key)) lookup.set(key, []);
      lookup.get(key)!.push(item);
    }

    const matched: WorkflowItem[] = [];
    const unmatched1: WorkflowItem[] = [];
    const matched2Keys = new Set<string>();

    for (const item1 of input1) {
      const key = buildKey(item1, joinFields);
      const matches = lookup.get(key);
      if (matches && matches.length > 0) {
        const toMerge = multiMatch === "first" ? [matches[0]] : matches;
        for (const item2 of toMerge) matched.push(mergeItems(item1, item2, clash));
        matched2Keys.add(key);
      } else {
        unmatched1.push(item1);
      }
    }
    const unmatched2 = input2.filter((item) => !matched2Keys.has(buildKey(item, joinFields)));

    switch (joinModeVal) {
      case "keepMatches": return { items: matched, count: matched.length };
      case "keepEverything": return { items: [...matched, ...unmatched1, ...unmatched2], count: matched.length + unmatched1.length + unmatched2.length };
      case "keepNonMatches": return { items: [...unmatched1, ...unmatched2], count: unmatched1.length + unmatched2.length };
      case "enrichInput1": return { items: [...matched, ...unmatched1], count: matched.length + unmatched1.length };
      case "enrichInput2": return { items: [...matched, ...unmatched2], count: matched.length + unmatched2.length };
      default: return { items: matched, count: matched.length };
    }
  }

  const items = branches.flat();
  return { items, count: items.length };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function mergeStep(
  input: MergeInput,
): Promise<{ items: WorkflowItem[]; count: number }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeMerge(input)));
}
mergeStep.maxRetries = 0;
