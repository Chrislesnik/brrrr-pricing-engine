/**
 * Code step — executes user-written JavaScript in a sandboxed Function scope.
 * Supports dual modes: Run Once for All Items / Run Once for Each Item.
 * Provides n8n-style $input and $node helpers.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type CodeInput = StepInput & {
  code: string;
  mode: "runOnceAllItems" | "runOnceEachItem";
  /** Injected by executor: { nodeLabel: outputData } */
  _nodeOutputs?: Record<string, unknown>;
};

type Item = { json: Record<string, unknown> };

/** Max execution time per code run (ms) */
const EXECUTION_TIMEOUT = 30_000;

/**
 * Normalise any output data into an items array for $input helpers.
 */
function toItems(data: unknown): Item[] {
  if (data === null || data === undefined) return [];
  if (Array.isArray(data)) {
    return data.map((d) => {
      if (d && typeof d === "object" && "json" in d) return d as Item;
      return { json: typeof d === "object" && d !== null ? (d as Record<string, unknown>) : { value: d } };
    });
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if ("json" in obj) return [obj as Item];
    // Wrap standardised { success, data } outputs
    if ("success" in obj && "data" in obj) {
      const inner = obj.data;
      if (Array.isArray(inner)) return toItems(inner);
      if (inner && typeof inner === "object") return [{ json: inner as Record<string, unknown> }];
    }
    return [{ json: obj }];
  }
  return [{ json: { value: data } }];
}

/**
 * Build the $input helper for a given set of items.
 */
function buildInputHelper(items: Item[]) {
  return {
    all: () => items,
    first: () => items[0] ?? { json: {} },
    last: () => items[items.length - 1] ?? { json: {} },
    item: items[0] ?? { json: {} },
  };
}

/**
 * Build the $node proxy so user code can do $node['NodeName'].json.field.
 * Returns { json: {} } for any missing node name to prevent "Cannot read
 * properties of undefined" errors.
 */
function buildNodeProxy(nodeOutputs: Record<string, unknown>): Record<string, { json: Record<string, unknown> }> {
  const resolved: Record<string, { json: Record<string, unknown> }> = {};
  for (const [label, data] of Object.entries(nodeOutputs)) {
    const items = toItems(data);
    resolved[label] = items[0] ?? { json: {} };
  }
  // Use a Proxy so accessing any missing node name returns { json: {} }
  return new Proxy(resolved, {
    get(target, prop: string) {
      return target[prop] ?? { json: {} };
    },
  });
}

/**
 * Execute user code in a restricted Function scope with a timeout.
 */
async function runSandboxed(
  userCode: string,
  sandboxVars: Record<string, unknown>,
): Promise<unknown> {
  // Build argument names and values for new Function
  const argNames = Object.keys(sandboxVars);
  const argValues = Object.values(sandboxVars);

  // Block dangerous globals by shadowing them as undefined.
  // Note: "import", "eval" are reserved keywords and can't be var-shadowed,
  // so we only shadow identifiers that are valid variable names.
  const blockedGlobals = [
    "require", "process", "globalThis",
    "__dirname", "__filename", "module", "exports",
  ];
  const blockPrefix = blockedGlobals
    .map((g) => `var ${g} = undefined;`)
    .join("\n");

  const wrappedCode = `
    "use strict";
    ${blockPrefix}
    return (async () => {
      ${userCode}
    })();
  `;

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(...argNames, wrappedCode);

  // Execute with timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT);

  try {
    const result = await Promise.race([
      fn(...argValues),
      new Promise((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(new Error(`Code execution timed out after ${EXECUTION_TIMEOUT / 1000}s`))
        );
      }),
    ]);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Validate and normalise the return value into items array.
 */
function normaliseResult(raw: unknown): Item[] {
  if (raw === null || raw === undefined) {
    return [{ json: {} }];
  }
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (item && typeof item === "object" && "json" in item) return item as Item;
      if (item && typeof item === "object") return { json: item as Record<string, unknown> };
      return { json: { value: item } };
    });
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if ("json" in obj) return [obj as Item];
    return [{ json: obj }];
  }
  return [{ json: { value: raw } }];
}

async function executeCode(input: CodeInput): Promise<{
  items: Item[];
  logs: string[];
}> {
  const nodeOutputs = input._nodeOutputs ?? {};
  // Collect items from ALL upstream nodes (merged), with the most recent last
  const allValues = Object.values(nodeOutputs).filter(Boolean);
  const mergedItems: Item[] = [];
  for (const val of allValues) {
    mergedItems.push(...toItems(val));
  }
  // If no items from upstream, provide a single empty item
  const allItems = mergedItems.length > 0 ? mergedItems : [{ json: {} }];
  const $input = buildInputHelper(allItems);
  const $node = buildNodeProxy(nodeOutputs);

  // Capture console output
  const logs: string[] = [];
  const capturedConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    warn: (...args: unknown[]) => logs.push(`[warn] ${args.map(String).join(" ")}`),
    error: (...args: unknown[]) => logs.push(`[error] ${args.map(String).join(" ")}`),
    info: (...args: unknown[]) => logs.push(`[info] ${args.map(String).join(" ")}`),
  };

  const sandboxBase: Record<string, unknown> = {
    $input,
    $node,
    console: capturedConsole,
    JSON,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    Promise,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
  };

  const mode = input.mode || "runOnceAllItems";
  const code = input.code || "return [];";

  if (mode === "runOnceEachItem") {
    const results: Item[] = [];
    for (const item of allItems) {
      const sandbox = { ...sandboxBase, item, $input: buildInputHelper([item]) };
      const raw = await runSandboxed(code, sandbox);
      const normalised = normaliseResult(raw);
      results.push(...normalised);
    }
    return { items: results, logs };
  }

  // runOnceAllItems
  const raw = await runSandboxed(code, sandboxBase);
  const items = normaliseResult(raw);
  return { items, logs };
}

export async function codeStep(
  input: CodeInput,
): Promise<{ items: Item[]; logs: string[] }> {
  "use step";
  return withStepLogging(input, () => executeCode(input));
}
codeStep.maxRetries = 0;
