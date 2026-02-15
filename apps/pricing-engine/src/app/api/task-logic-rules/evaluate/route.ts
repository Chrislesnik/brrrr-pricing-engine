import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/task-logic-rules/evaluate
 *
 * Evaluates a raw SQL condition against a deal.
 *
 * Body: {
 *   sql_expression: string,
 *   deal_id: string,
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

    // Execute the raw SQL via exec_sql RPC
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      query: sql_expression,
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

    // Check if the query returned any rows — if so, condition is true
    const rows = Array.isArray(data) ? data : [];
    const result = rows.length > 0;

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[POST /api/task-logic-rules/evaluate]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
