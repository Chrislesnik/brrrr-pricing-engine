import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/deal-stages
 * List all active deal stages ordered by display_order.
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("deal_stages")
      .select("id, uuid, code, name, color, display_order, is_active, created_at, updated_at")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[GET /api/deal-stages]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stages: data ?? [] });
  } catch (err) {
    console.error("[GET /api/deal-stages]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
