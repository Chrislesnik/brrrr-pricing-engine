import "server-only";

import { type StepInput, withStepLogging } from "@/components/workflow-builder/lib/steps/step-handler";
import { getErrorMessage } from "@/components/workflow-builder/lib/utils";
import { getSupabaseClient } from "./_client";

type SelectResult =
  | { success: true; data: { rows: unknown[]; count: number } }
  | { success: false; error: { message: string } };

export type SupabaseSelectInput = StepInput & {
  integrationId?: string;
  table: string;
  columns?: string;
  filterColumn?: string;
  filterOperator?: string;
  filterValue?: string;
  limit?: string | number;
  orderBy?: string;
  orderDirection?: string;
};

async function stepHandler(input: SupabaseSelectInput): Promise<SelectResult> {
  if (!input.table?.trim()) {
    return { success: false, error: { message: "Table name is required" } };
  }

  try {
    const client = await getSupabaseClient(input.integrationId);
    const columns = input.columns?.trim() || "*";
    let query = client.from(input.table.trim()).select(columns);

    // Apply filter
    if (input.filterColumn?.trim() && input.filterValue !== undefined) {
      const col = input.filterColumn.trim();
      const val = input.filterValue;
      const op = input.filterOperator || "eq";

      switch (op) {
        case "eq": query = query.eq(col, val); break;
        case "neq": query = query.neq(col, val); break;
        case "gt": query = query.gt(col, val); break;
        case "gte": query = query.gte(col, val); break;
        case "lt": query = query.lt(col, val); break;
        case "lte": query = query.lte(col, val); break;
        case "like": query = query.like(col, val); break;
        case "ilike": query = query.ilike(col, val); break;
        case "is": query = query.is(col, val === "null" ? null : val); break;
        case "in": query = query.in(col, val.split(",").map((v: string) => v.trim())); break;
        default: query = query.eq(col, val);
      }
    }

    // Apply ordering
    if (input.orderBy?.trim()) {
      query = query.order(input.orderBy.trim(), {
        ascending: input.orderDirection === "asc",
      });
    }

    // Apply limit
    const limit = typeof input.limit === "number" ? input.limit : Number.parseInt(String(input.limit || "100"), 10);
    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: { message: `Query failed: ${error.message}` } };
    }

    const rows = data ?? [];
    return { success: true, data: { rows, count: rows.length } };
  } catch (error) {
    return { success: false, error: { message: `Select failed: ${getErrorMessage(error)}` } };
  }
}

export async function supabaseSelectStep(input: SupabaseSelectInput): Promise<SelectResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
supabaseSelectStep.maxRetries = 0;

export const _integrationType = "supabase";
