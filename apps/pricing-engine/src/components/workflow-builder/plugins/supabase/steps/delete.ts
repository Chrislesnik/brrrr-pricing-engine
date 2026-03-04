import "server-only";

import { type StepInput, withStepLogging } from "@/components/workflow-builder/lib/steps/step-handler";
import { getErrorMessage } from "@/components/workflow-builder/lib/utils";
import { getSupabaseClient } from "./_client";

type DeleteResult =
  | { success: true; data: { count: number } }
  | { success: false; error: { message: string } };

export type SupabaseDeleteInput = StepInput & {
  integrationId?: string;
  table: string;
  filterColumn: string;
  filterOperator?: string;
  filterValue: string;
};

async function stepHandler(input: SupabaseDeleteInput): Promise<DeleteResult> {
  if (!input.table?.trim()) {
    return { success: false, error: { message: "Table name is required" } };
  }
  if (!input.filterColumn?.trim()) {
    return { success: false, error: { message: "Filter column is required for safety (prevents deleting all rows)" } };
  }

  try {
    const client = await getSupabaseClient(input.integrationId);
    let query = client.from(input.table.trim()).delete();

    const col = input.filterColumn.trim();
    const val = input.filterValue;
    const op = input.filterOperator || "eq";

    switch (op) {
      case "eq": query = query.eq(col, val); break;
      case "in": query = query.in(col, val.split(",").map((v: string) => v.trim())); break;
      default: query = query.eq(col, val);
    }

    const { data, error } = await query.select();

    if (error) {
      return { success: false, error: { message: `Delete failed: ${error.message}` } };
    }

    return { success: true, data: { count: (data ?? []).length } };
  } catch (error) {
    return { success: false, error: { message: `Delete failed: ${getErrorMessage(error)}` } };
  }
}

export async function supabaseDeleteStep(input: SupabaseDeleteInput): Promise<DeleteResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
supabaseDeleteStep.maxRetries = 0;

export const _integrationType = "supabase";
