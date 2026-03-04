import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/* -------------------------------------------------------------------------- */
/*  Template variable helpers                                                  */
/* -------------------------------------------------------------------------- */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEAL_ID_RE = /\{\{deal_id\}\}/g;
const INPUT_VAR_RE = /\{\{input:([a-zA-Z0-9_]+)\}\}/g;

/**
 * Escape a string value for safe inclusion in a SQL literal.
 * Replaces single quotes with two single quotes (standard SQL escaping).
 */
function sqlEscape(val: string): string {
  return val.replace(/'/g, "''");
}

/**
 * Format a deal_input row's value as a SQL-safe literal based on its type.
 */
function formatInputValue(row: {
  input_type: string | null;
  value_text: string | null;
  value_numeric: number | null;
  value_date: string | null;
  value_bool: boolean | null;
}): string {
  switch (row.input_type) {
    case "number":
    case "currency":
    case "percentage":
      return row.value_numeric !== null && row.value_numeric !== undefined
        ? String(row.value_numeric)
        : "NULL";
    case "boolean":
      return row.value_bool !== null && row.value_bool !== undefined
        ? String(row.value_bool)
        : "NULL";
    case "date":
      return row.value_date ? `'${sqlEscape(row.value_date)}'` : "NULL";
    case "text":
    case "dropdown":
    default:
      return row.value_text !== null && row.value_text !== undefined
        ? `'${sqlEscape(row.value_text)}'`
        : "NULL";
  }
}

/**
 * Resolve all template variables in a SQL expression.
 *
 * Supported variables:
 *   {{deal_id}}            – replaced with the deal UUID
 *   {{input:input_code}}   – replaced with the deal's value for that input
 */
async function resolveTemplateVariables(
  sql: string,
  dealId: string
): Promise<string> {
  // 1. Replace {{deal_id}}
  let resolved = sql.replace(DEAL_ID_RE, sqlEscape(dealId));

  // 2. Collect all {{input:*}} codes
  const inputCodes: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(INPUT_VAR_RE.source, INPUT_VAR_RE.flags);
  while ((match = re.exec(sql)) !== null) {
    if (!inputCodes.includes(match[1])) {
      inputCodes.push(match[1]);
    }
  }

  if (inputCodes.length === 0) return resolved;

  // 3. Fetch input values for all referenced input_codes in one query
  const { data: rows, error } = await supabaseAdmin
    .from("deal_inputs")
    .select(
      `
      input_id,
      input_type,
      value_text,
      value_numeric,
      value_date,
      value_bool,
      inputs!inner ( input_code )
    `
    )
    .eq("deal_id", dealId)
    .in("inputs.input_code", inputCodes);

  if (error) {
    console.error(
      "[resolveTemplateVariables] Failed to fetch input values:",
      error.message
    );
    // Replace unresolved vars with NULL rather than leaving raw templates
    resolved = resolved.replace(INPUT_VAR_RE, "NULL");
    return resolved;
  }

  // Build a lookup: input_code -> SQL literal
  const valueLookup: Record<string, string> = {};
  if (rows) {
    for (const row of rows as Array<{
      input_id: number;
      input_type: string | null;
      value_text: string | null;
      value_numeric: number | null;
      value_date: string | null;
      value_bool: boolean | null;
      inputs: { input_code: string } | { input_code: string }[];
    }>) {
      const inputObj = Array.isArray(row.inputs) ? row.inputs[0] : row.inputs;
      if (inputObj?.input_code) {
        valueLookup[inputObj.input_code] = formatInputValue(row);
      }
    }
  }

  // 4. Replace each {{input:code}} with its resolved value (or NULL)
  resolved = resolved.replace(INPUT_VAR_RE, (_full, code: string) => {
    return valueLookup[code] ?? "NULL";
  });

  return resolved;
}

/* -------------------------------------------------------------------------- */
/*  POST /api/task-logic-rules/evaluate                                        */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/task-logic-rules/evaluate
 *
 * Evaluates a SQL condition against a deal, with template variable support.
 *
 * Body: {
 *   sql_expression: string,   // SQL with optional {{deal_id}} / {{input:code}} vars
 *   deal_id: string,          // The deal UUID (used for variable resolution)
 * }
 *
 * Returns: { result: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sql_expression, deal_id } = body;

    if (!sql_expression) {
      return NextResponse.json(
        { error: "Missing required field: sql_expression" },
        { status: 400 }
      );
    }

    if (!deal_id) {
      return NextResponse.json(
        { error: "Missing required field: deal_id" },
        { status: 400 }
      );
    }

    // Validate deal_id is a proper UUID to prevent injection
    if (!UUID_RE.test(deal_id)) {
      return NextResponse.json(
        { error: "Invalid deal_id format" },
        { status: 400 }
      );
    }

    // Resolve template variables
    const resolvedSql = await resolveTemplateVariables(sql_expression, deal_id);

    // Execute the resolved SQL via exec_sql RPC
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      query: resolvedSql,
      params: [],
    });

    if (error) {
      console.error(
        "[POST /api/task-logic-rules/evaluate] SQL error:",
        error.message
      );
      return NextResponse.json(
        { error: `Query execution failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Determine boolean result:
    // 1. If the query returns a column named like "result", "has_*", "exists", etc. use its value
    // 2. Otherwise fall back to "any rows returned = true"
    const rows = Array.isArray(data) ? data : [];
    let result = false;

    if (rows.length > 0) {
      const firstRow = rows[0] as Record<string, unknown>;
      // Look for a boolean-ish column in the first row
      const boolCol = Object.keys(firstRow).find((k) => {
        const v = firstRow[k];
        return typeof v === "boolean" || v === "true" || v === "false";
      });
      if (boolCol !== undefined) {
        const val = firstRow[boolCol];
        result = val === true || val === "true";
      } else {
        // Fallback: any rows returned means true
        result = true;
      }
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[POST /api/task-logic-rules/evaluate]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
