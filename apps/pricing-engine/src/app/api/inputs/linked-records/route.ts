import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  getOrgUuidFromClerkId,
  getUserRoleInOrg,
  isPrivilegedRole,
} from "@/lib/orgs";

/**
 * GET /api/inputs/linked-records?table=borrowers&expression=@first_name @last_name
 * GET /api/inputs/linked-records?deal_id=X&table=borrowers&expression=@first_name @last_name
 *
 * Returns records from the linked table for a dropdown input.
 * Records are scoped to the current user's organization and filtered
 * by role (non-privileged users only see records assigned to them).
 *
 * This mirrors exactly how the borrowers/entities tabs fetch their data.
 *
 * Query params:
 *   - `deal_id`     (optional): When provided, verifies the deal belongs to the user's org
 *   - `table`       (required): Which table to query
 *   - `expression`  (optional): Display expression using @column_name references
 *                                (e.g. "@first_name @last_name"). Falls back to
 *                                the PK value if omitted.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve org UUID from Clerk org ID
    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      console.error("[linked-records] Could not resolve org UUID for Clerk orgId:", orgId);
      return NextResponse.json({ error: "No organization" }, { status: 401 });
    }

    const dealId = request.nextUrl.searchParams.get("deal_id"); // optional
    const tableName = request.nextUrl.searchParams.get("table");
    const expression = request.nextUrl.searchParams.get("expression");

    if (!tableName) {
      return NextResponse.json({ error: "table is required" }, { status: 400 });
    }

    // Parse column references from the expression (e.g. "@first_name @last_name" → ["first_name", "last_name"])
    const expressionColumns = expression ? parseExpressionColumns(expression) : [];

    /* -------------------------------------------------------------------- */
    /*  Auto-detect the table's primary key column                           */
    /* -------------------------------------------------------------------- */
    const { data: pkResult, error: pkErr } = await supabaseAdmin.rpc(
      "get_primary_key_column",
      { p_table_name: tableName }
    );

    if (pkErr || !pkResult) {
      console.error("[linked-records] PK detection failed for", tableName, pkErr);
      return NextResponse.json(
        { error: `Cannot detect primary key for "${tableName}"` },
        { status: 400 }
      );
    }

    const pkColumn: string = pkResult as string;

    /* -------------------------------------------------------------------- */
    /*  Verify the deal belongs to the user's org (only when deal_id given)  */
    /* -------------------------------------------------------------------- */
    if (dealId) {
      const { data: dealRow, error: dealErr } = await supabaseAdmin
        .from("deals")
        .select("id, organization_id")
        .eq("id", dealId)
        .single();

      if (dealErr || !dealRow) {
        console.error("[linked-records] Deal not found:", dealId, dealErr);
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }
      if (dealRow.organization_id !== orgUuid) {
        console.error("[linked-records] Org mismatch. Deal org:", dealRow.organization_id, "User org:", orgUuid);
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    /* -------------------------------------------------------------------- */
    /*  Determine role-based access (mirrors borrowers/entities tabs)        */
    /* -------------------------------------------------------------------- */
    const userRole = await getUserRoleInOrg(orgUuid, userId);
    const hasFullAccess = isPrivilegedRole(userRole);

    /* -------------------------------------------------------------------- */
    /*  Detect table columns to know capabilities                            */
    /* -------------------------------------------------------------------- */
    const { data: columnList } = await supabaseAdmin.rpc(
      "list_table_columns",
      { p_table_name: tableName }
    );

    const columnNames = new Set(
      ((columnList as { column_name: string }[] | null) ?? []).map(
        (c) => c.column_name
      )
    );

    const hasOrgId = columnNames.has("organization_id");
    const hasAssignedTo = columnNames.has("assigned_to");

    /* -------------------------------------------------------------------- */
    /*  Build the SELECT column list                                         */
    /* -------------------------------------------------------------------- */
    const selectCols = buildSelectColumns(pkColumn, expressionColumns, hasAssignedTo);

    /* -------------------------------------------------------------------- */
    /*  Get org member UUID for assigned_to filtering                        */
    /* -------------------------------------------------------------------- */
    let currentUserOrgMemberId: string | undefined;
    if (!hasFullAccess && hasAssignedTo) {
      const { data: memberRow } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("organization_id", orgUuid)
        .eq("user_id", userId)
        .maybeSingle();
      currentUserOrgMemberId = memberRow?.id as string | undefined;
    }

    /* -------------------------------------------------------------------- */
    /*  Fetch records — org-scoped, just like the tabs do                    */
    /* -------------------------------------------------------------------- */
    let rows: Record<string, unknown>[] = [];

    if (hasOrgId) {
      // Table has organization_id — fetch all records in the user's org
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select(selectCols)
        .eq("organization_id", orgUuid)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[linked-records] Query error for", tableName, error);
      }
      if (data) {
        rows = data as Record<string, unknown>[];
      }
    } else {
      // Table does not have organization_id — fetch all rows (limited)
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select(selectCols)
        .limit(500);

      if (error) {
        console.error("[linked-records] Query error for", tableName, error);
      }
      if (data) {
        rows = data as Record<string, unknown>[];
      }
    }

    console.log(`[linked-records] Fetched ${rows.length} rows from ${tableName} for org ${orgUuid}`);

    /* -------------------------------------------------------------------- */
    /*  Apply role-based filtering (assigned_to) for non-privileged users    */
    /*  This matches the exact logic in fetch-borrowers.ts / fetch-entities  */
    /* -------------------------------------------------------------------- */
    if (!hasFullAccess && hasAssignedTo) {
      rows = rows.filter((row) => {
        const assigned = Array.isArray(row.assigned_to)
          ? (row.assigned_to as string[])
          : [];
        return (
          assigned.includes(userId) ||
          (currentUserOrgMemberId !== undefined &&
            assigned.includes(currentUserOrgMemberId))
        );
      });
      console.log(`[linked-records] After assigned_to filter: ${rows.length} rows`);
    }

    /* -------------------------------------------------------------------- */
    /*  Build response records                                               */
    /* -------------------------------------------------------------------- */
    const records = rows.map((row) => ({
      id: String(row[pkColumn]),
      label:
        expression && expressionColumns.length > 0
          ? evaluateExpression(expression, row)
          : String(row[pkColumn]),
    }));

    // Sort alphabetically by label
    records.sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json({ records });
  } catch (error) {
    console.error("[GET /api/inputs/linked-records] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Extract unique column names from an expression like "@first_name @last_name".
 */
function parseExpressionColumns(expression: string): string[] {
  const matches = expression.matchAll(/@(\w+)/g);
  return [...new Set(Array.from(matches, (m) => m[1]))];
}

/**
 * Evaluate an expression by replacing @column_name references with actual row values.
 * e.g. "@first_name @last_name" → "John Doe"
 */
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

/**
 * Build the SELECT column list, ensuring we always include the PK column,
 * columns from the expression, and assigned_to (for role filtering) when present.
 */
function buildSelectColumns(
  pkColumn: string,
  expressionColumns: string[],
  hasAssignedTo: boolean
): string {
  const cols = new Set<string>();
  cols.add(pkColumn);
  for (const col of expressionColumns) {
    cols.add(col);
  }
  if (hasAssignedTo) {
    cols.add("assigned_to");
  }
  return Array.from(cols).join(", ");
}
