import "server-only";

import { type StepInput, withStepLogging } from "@/components/workflow-builder/lib/steps/step-handler";
import { getErrorMessage } from "@/components/workflow-builder/lib/utils";
import { getSupabaseClient } from "./_client";

type InsertResult =
  | { success: true; data: { row: unknown; id: string | null } }
  | { success: false; error: { message: string } };

export type SupabaseInsertInput = StepInput & {
  integrationId?: string;
  table: string;
  data: string | Record<string, unknown>;
};

async function stepHandler(input: SupabaseInsertInput): Promise<InsertResult> {
  if (!input.table?.trim()) {
    return { success: false, error: { message: "Table name is required" } };
  }

  let rowData: Record<string, unknown>;
  try {
    rowData = typeof input.data === "string" ? JSON.parse(input.data) : input.data;
  } catch {
    return { success: false, error: { message: "Invalid JSON in data field" } };
  }

  if (!rowData || typeof rowData !== "object" || Object.keys(rowData).length === 0) {
    return { success: false, error: { message: "Data must be a non-empty JSON object" } };
  }

  try {
    const client = await getSupabaseClient(input.integrationId);
    const { data, error } = await client
      .from(input.table.trim())
      .insert(rowData)
      .select()
      .single();

    if (error) {
      return { success: false, error: { message: `Insert failed: ${error.message}` } };
    }

    const id = data?.id ?? data?.uuid ?? null;
    return { success: true, data: { row: data, id: String(id) } };
  } catch (error) {
    return { success: false, error: { message: `Insert failed: ${getErrorMessage(error)}` } };
  }
}

export async function supabaseInsertStep(input: SupabaseInsertInput): Promise<InsertResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
supabaseInsertStep.maxRetries = 0;

export const _integrationType = "supabase";
