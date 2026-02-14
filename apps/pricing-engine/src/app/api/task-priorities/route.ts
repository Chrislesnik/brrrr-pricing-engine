import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/task-priorities
 * List all task priorities ordered by display_order.
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("task_priorities")
      .select("id, code, name, color, display_order, is_active")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[GET /api/task-priorities]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ priorities: data ?? [] });
  } catch (err) {
    console.error("[GET /api/task-priorities]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
