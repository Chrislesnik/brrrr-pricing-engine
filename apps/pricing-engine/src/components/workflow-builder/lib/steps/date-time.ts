/**
 * DateTime step — parse, format, add/subtract, compare dates, or get current date.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type DateTimeInput = StepInput & {
  operation: "format" | "addSubtract" | "compare" | "getCurrent" | "parse";
  dateValue?: string;
  outputFormat?: string;
  amount?: string;
  unit?: string;
  direction?: "add" | "subtract";
  secondDate?: string;
  comparison?: "before" | "after" | "same" | "difference";
  timezone?: string;
};

const UNIT_MS: Record<string, number> = {
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000,
  months: 2_592_000_000,
  years: 31_536_000_000,
};

function formatDate(date: Date, fmt: string): string {
  if (fmt === "ISO" || fmt === "iso") return date.toISOString();
  if (fmt === "unix" || fmt === "Unix Timestamp") return String(Math.floor(date.getTime() / 1000));
  if (fmt === "ms" || fmt === "Unix MS") return String(date.getTime());

  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const H = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());

  return fmt
    .replace("YYYY", String(y))
    .replace("MM", M)
    .replace("DD", d)
    .replace("HH", H)
    .replace("mm", m)
    .replace("ss", s);
}

function executeDateTime(input: DateTimeInput): {
  result: string | number | boolean;
  original: string;
} {
  const op = input.operation || "getCurrent";

  if (op === "getCurrent") {
    const now = new Date();
    const fmt = input.outputFormat || "ISO";
    return { result: formatDate(now, fmt), original: now.toISOString() };
  }

  if (op === "format") {
    const date = new Date(input.dateValue || "");
    if (isNaN(date.getTime())) {
      return { result: "Invalid Date", original: input.dateValue || "" };
    }
    const fmt = input.outputFormat || "ISO";
    return { result: formatDate(date, fmt), original: date.toISOString() };
  }

  if (op === "addSubtract") {
    const date = new Date(input.dateValue || "");
    if (isNaN(date.getTime())) {
      return { result: "Invalid Date", original: input.dateValue || "" };
    }
    const amount = parseFloat(input.amount || "0");
    const unitMs = UNIT_MS[input.unit || "days"] || UNIT_MS.days;
    const ms = amount * unitMs;
    const dir = input.direction === "subtract" ? -1 : 1;
    const result = new Date(date.getTime() + dir * ms);
    const fmt = input.outputFormat || "ISO";
    return { result: formatDate(result, fmt), original: date.toISOString() };
  }

  if (op === "compare") {
    const d1 = new Date(input.dateValue || "");
    const d2 = new Date(input.secondDate || "");
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return { result: "Invalid Date", original: input.dateValue || "" };
    }
    const cmp = input.comparison || "difference";
    switch (cmp) {
      case "before":
        return { result: d1.getTime() < d2.getTime(), original: d1.toISOString() };
      case "after":
        return { result: d1.getTime() > d2.getTime(), original: d1.toISOString() };
      case "same":
        return { result: d1.getTime() === d2.getTime(), original: d1.toISOString() };
      case "difference":
        return { result: d1.getTime() - d2.getTime(), original: d1.toISOString() };
      default:
        return { result: d1.getTime() - d2.getTime(), original: d1.toISOString() };
    }
  }

  if (op === "parse") {
    const date = new Date(input.dateValue || "");
    if (isNaN(date.getTime())) {
      return { result: "Invalid Date", original: input.dateValue || "" };
    }
    const fmt = input.outputFormat || "ISO";
    return { result: formatDate(date, fmt), original: input.dateValue || "" };
  }

  return { result: "Unknown operation", original: "" };
}

// biome-ignore lint/suspicious/useAwait: workflow "use step" requires async
export async function dateTimeStep(
  input: DateTimeInput,
): Promise<{ result: string | number | boolean; original: string }> {
  "use step";
  return withStepLogging(input, () => Promise.resolve(executeDateTime(input)));
}
dateTimeStep.maxRetries = 0;
