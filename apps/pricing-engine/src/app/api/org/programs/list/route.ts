import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * GET /api/org/programs/list
 * Returns all programs for admin management (no filters)
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("programs")
      .select("id, loan_type, internal_name, external_name, webhook_url, status")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching programs:", error);
      return NextResponse.json({ programs: [] }, { status: 500 });
    }

    return NextResponse.json({ programs: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    console.error("Server error fetching programs:", msg);
    return NextResponse.json({ programs: [] }, { status: 500 });
  }
}
