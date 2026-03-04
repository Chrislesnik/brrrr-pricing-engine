import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

/**
 * GET /api/inputs/linked-record-fields?table=entities&id=42&expression=@entity_name
 *
 * Fetches a single record from a linked table and evaluates a column expression
 * against it. Used by the auto-fill feature to resolve field values from a
 * selected linked record.
 *
 * Returns: { value: "Acme Corp" }
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 });
    }

    const tableName = request.nextUrl.searchParams.get("table");
    const sourceInputId = request.nextUrl.searchParams.get("source_input_id");
    const recordId = request.nextUrl.searchParams.get("id");
    const expression = request.nextUrl.searchParams.get("expression");

    if (!recordId || !expression) {
      return NextResponse.json(
        { error: "id and expression are required" },
        { status: 400 }
      );
    }

    let resolvedTable = tableName;
    if (!resolvedTable && sourceInputId) {
      const { data: rules } = await supabaseAdmin
        .from("input_linked_rules")
        .select("linked_table")
        .eq("input_id", sourceInputId)
        .order("rule_order", { ascending: true })
        .limit(1);
      resolvedTable = rules?.[0]?.linked_table as string | null;
    }

    if (!resolvedTable) {
      return NextResponse.json(
        { error: "table or source_input_id is required" },
        { status: 400 }
      );
    }

    const expressionColumns = parseExpressionColumns(expression);
    if (expressionColumns.length === 0) {
      return NextResponse.json({ value: "" });
    }

    const { data: pkResult, error: pkErr } = await supabaseAdmin.rpc(
      "get_primary_key_column",
      { p_table_name: resolvedTable }
    );

    if (pkErr || !pkResult) {
      return NextResponse.json(
        { error: `Cannot detect primary key for "${resolvedTable}"` },
        { status: 400 }
      );
    }

    const pkColumn: string = pkResult as string;
    const selectCols = new Set<string>([pkColumn, ...expressionColumns]);
    const selectStr = Array.from(selectCols).join(", ");

    const { data: row, error: rowErr } = await supabaseAdmin
      .from(resolvedTable)
      .select(selectStr)
      .eq(pkColumn, recordId)
      .maybeSingle();

    if (rowErr) {
      console.error("[linked-record-fields] Query error:", rowErr);
      return NextResponse.json({ error: rowErr.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ value: "" });
    }

    const value = evaluateExpression(expression, row as Record<string, unknown>);
    return NextResponse.json({ value });
  } catch (error) {
    console.error("[GET /api/inputs/linked-record-fields] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseExpressionColumns(expression: string): string[] {
  const matches = expression.matchAll(/@(\w+)/g);
  return [...new Set(Array.from(matches, (m) => m[1]))];
}

function evaluateExpression(
  expression: string,
  row: Record<string, unknown>
): string {
  return expression
    .replace(/@(\w+)/g, (_, col) => {
      const val = row[col];
      return val !== null && val !== undefined ? String(val) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}
