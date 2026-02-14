import "server-only";

import { type StepInput, withStepLogging } from "@/components/workflow-builder/lib/steps/step-handler";
import { getErrorMessage } from "@/components/workflow-builder/lib/utils";
import { getSupabaseClient } from "./_client";

type GetRowResult =
  | { success: true; data: { row: unknown; found: boolean } }
  | { success: false; error: { message: string } };

export type SupabaseGetRowInput = StepInput & {
  integrationId?: string;
  table: string;
  lookupColumn: string;
  lookupValue: string;
};

async function stepHandler(input: SupabaseGetRowInput): Promise<GetRowResult> {
  if (!input.table?.trim()) {
    return { success: false, error: { message: "Table name is required" } };
  }
  if (!input.lookupColumn?.trim()) {
    return { success: false, error: { message: "Lookup column is required" } };
  }
  if (input.lookupValue === undefined || input.lookupValue === "") {
    return { success: false, error: { message: "Lookup value is required" } };
  }

  try {
    const client = await getSupabaseClient(input.integrationId);
    const { data, error } = await client
      .from(input.table.trim())
      .select("*")
      .eq(input.lookupColumn.trim(), input.lookupValue)
      .maybeSingle();

    if (error) {
      return { success: false, error: { message: `Get row failed: ${error.message}` } };
    }

    if (!data) {
      return { success: true, data: { row: null, found: false } };
    }

    return { success: true, data: { row: data, found: true } };
  } catch (error) {
    return { success: false, error: { message: `Get row failed: ${getErrorMessage(error)}` } };
  }
}

export async function supabaseGetRowStep(input: SupabaseGetRowInput): Promise<GetRowResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
supabaseGetRowStep.maxRetries = 0;

export const _integrationType = "supabase";
