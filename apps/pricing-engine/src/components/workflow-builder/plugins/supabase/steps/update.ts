import "server-only";

import { type StepInput, withStepLogging } from "@/components/workflow-builder/lib/steps/step-handler";
import { getErrorMessage } from "@/components/workflow-builder/lib/utils";
import { getSupabaseClient } from "./_client";

type UpdateResult =
  | { success: true; data: { rows: unknown[]; count: number } }
  | { success: false; error: { message: string } };

export type SupabaseUpdateInput = StepInput & {
  integrationId?: string;
  table: string;
  data: string | Record<string, unknown>;
  filterColumn: string;
  filterOperator?: string;
  filterValue: string;
};

async function stepHandler(input: SupabaseUpdateInput): Promise<UpdateResult> {
  if (!input.table?.trim()) {
    return { success: false, error: { message: "Table name is required" } };
  }
  if (!input.filterColumn?.trim()) {
    return { success: false, error: { message: "Filter column is required for safety" } };
  }

  let updateData: Record<string, unknown>;
  try {
    updateData = typeof input.data === "string" ? JSON.parse(input.data) : input.data;
  } catch {
    return { success: false, error: { message: "Invalid JSON in data field" } };
  }

  try {
    const client = await getSupabaseClient(input.integrationId);
    let query = client.from(input.table.trim()).update(updateData);

    const col = input.filterColumn.trim();
    const val = input.filterValue;
    const op = input.filterOperator || "eq";

    switch (op) {
      case "eq": query = query.eq(col, val); break;
      case "neq": query = query.neq(col, val); break;
      case "gt": query = query.gt(col, val); break;
      case "lt": query = query.lt(col, val); break;
      case "in": query = query.in(col, val.split(",").map((v: string) => v.trim())); break;
      default: query = query.eq(col, val);
    }

    const { data, error } = await query.select();

    if (error) {
      return { success: false, error: { message: `Update failed: ${error.message}` } };
    }

    const rows = data ?? [];
    return { success: true, data: { rows, count: rows.length } };
  } catch (error) {
    return { success: false, error: { message: `Update failed: ${getErrorMessage(error)}` } };
  }
}

export async function supabaseUpdateStep(input: SupabaseUpdateInput): Promise<UpdateResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
supabaseUpdateStep.maxRetries = 0;

export const _integrationType = "supabase";
