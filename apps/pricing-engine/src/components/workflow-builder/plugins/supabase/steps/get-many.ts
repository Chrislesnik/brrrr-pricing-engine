import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type StepInput, withStepLogging } from "@/components/workflow-builder/lib/steps/step-handler";
import { getErrorMessage } from "@/components/workflow-builder/lib/utils";
import { getSupabaseClient } from "./_client";

type GetManyResult =
  | { success: true; data: { rows: unknown[]; count: number } }
  | { success: false; error: { message: string } };

type FilterCondition = {
  column: string;
  operator: string;
  value: string;
};

export type SupabaseGetManyInput = StepInput & {
  integrationId?: string;
  table: string;
  columns?: string;
  filters?: string; // JSON string of FilterCondition[]
  filterMatch?: "and" | "or";
  limit?: string | number;
  orderBy?: string;
  orderDirection?: string;
};

/**
 * Apply a single filter condition to a query
 */
function applyFilter(
  query: ReturnType<SupabaseClient["from"]>,
  cond: FilterCondition
) {
  const col = cond.column.trim();
  const val = cond.value;
  if (!col) return query;

  switch (cond.operator) {
    case "eq": return query.eq(col, val);
    case "neq": return query.neq(col, val);
    case "gt": return query.gt(col, val);
    case "gte": return query.gte(col, val);
    case "lt": return query.lt(col, val);
    case "lte": return query.lte(col, val);
    case "like": return query.like(col, val);
    case "ilike": return query.ilike(col, val);
    case "is": return query.is(col, val === "null" ? null : val);
    case "in": return query.in(col, val.split(",").map((v: string) => v.trim()));
    default: return query.eq(col, val);
  }
}

async function stepHandler(input: SupabaseGetManyInput): Promise<GetManyResult> {
  if (!input.table?.trim()) {
    return { success: false, error: { message: "Table name is required" } };
  }

  // Parse filters
  let conditions: FilterCondition[] = [];
  if (input.filters) {
    try {
      const parsed = JSON.parse(input.filters);
      if (Array.isArray(parsed)) {
        conditions = parsed.filter((c: FilterCondition) => c.column?.trim());
      }
    } catch {
      return { success: false, error: { message: "Invalid filters JSON" } };
    }
  }

  const filterMatch = input.filterMatch || "and";

  try {
    const client = await getSupabaseClient(input.integrationId);
    const columns = input.columns?.trim() || "*";

    if (filterMatch === "or" && conditions.length > 1) {
      // OR logic: build an .or() filter string
      // Supabase .or() takes a string like "status.eq.active,type.eq.deal"
      const orParts = conditions.map((cond) => {
        const col = cond.column.trim();
        const op = cond.operator;
        const val = cond.value;

        if (op === "in") {
          return `${col}.in.(${val})`;
        }
        if (op === "is") {
          return `${col}.is.${val === "null" ? "null" : val}`;
        }
        return `${col}.${op}.${val}`;
      });

      let query = client
        .from(input.table.trim())
        .select(columns)
        .or(orParts.join(","));

      // Apply ordering
      if (input.orderBy?.trim()) {
        query = query.order(input.orderBy.trim(), {
          ascending: input.orderDirection === "asc",
        });
      }

      // Apply limit
      const limit = typeof input.limit === "number"
        ? input.limit
        : Number.parseInt(String(input.limit || "50"), 10);
      if (limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: { message: `Query failed: ${error.message}` } };
      }

      const rows = data ?? [];
      return { success: true, data: { rows, count: rows.length } };
    }

    // AND logic (default): chain .eq/.gt/etc. filters
    let query = client.from(input.table.trim()).select(columns) as ReturnType<SupabaseClient["from"]>;

    for (const cond of conditions) {
      query = applyFilter(query, cond);
    }

    // Apply ordering
    if (input.orderBy?.trim()) {
      query = query.order(input.orderBy.trim(), {
        ascending: input.orderDirection === "asc",
      });
    }

    // Apply limit
    const limit = typeof input.limit === "number"
      ? input.limit
      : Number.parseInt(String(input.limit || "50"), 10);
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
    return { success: false, error: { message: `Get many failed: ${getErrorMessage(error)}` } };
  }
}

export async function supabaseGetManyStep(input: SupabaseGetManyInput): Promise<GetManyResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
supabaseGetManyStep.maxRetries = 0;

export const _integrationType = "supabase";
