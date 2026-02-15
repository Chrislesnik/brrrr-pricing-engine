/**
 * Wait step — pauses workflow execution for a configured duration.
 */
import "server-only";

import { type StepInput, withStepLogging } from "./step-handler";

export type WaitInput = StepInput & {
  waitAmount: string;
  waitUnit: string; // "seconds" | "minutes" | "hours" | "days"
};

const UNIT_TO_MS: Record<string, number> = {
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};

function toMs(amount: string, unit: string): number {
  const num = parseFloat(amount);
  if (!Number.isFinite(num) || num <= 0) return 0;
  const multiplier = UNIT_TO_MS[unit] ?? UNIT_TO_MS.seconds;
  return Math.round(num * multiplier);
}

async function executeWait(input: WaitInput): Promise<{ waited: boolean; duration: number }> {
  const ms = toMs(input.waitAmount || "5", input.waitUnit || "seconds");

  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  return { waited: true, duration: ms };
}

export async function waitStep(
  input: WaitInput
): Promise<{ waited: boolean; duration: number }> {
  "use step";
  return withStepLogging(input, () => executeWait(input));
}
waitStep.maxRetries = 0;
