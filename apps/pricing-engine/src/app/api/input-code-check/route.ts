import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/input-code-check?code=X&table=inputs|pricing_engine_inputs&exclude_id=Y
 *
 * Returns { available: boolean } indicating whether the input_code is available.
 * `exclude_id` is used when editing an existing input (exclude itself from the check).
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const code = request.nextUrl.searchParams.get("code");
    const table = request.nextUrl.searchParams.get("table") || "inputs";
    const excludeId = request.nextUrl.searchParams.get("exclude_id");

    if (!code || !code.trim()) {
      return NextResponse.json({ available: false });
    }

    const validTables = ["inputs", "pricing_engine_inputs"];
    if (!validTables.includes(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    let query = supabaseAdmin
      .from(table)
      .select("id")
      .eq("input_code", code.trim())
      .limit(1);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ available: (data ?? []).length === 0 });
  } catch (error) {
    console.error("[GET /api/input-code-check]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
