import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/actions/by-id/[id]
 * Lightweight endpoint that looks up an action by its numeric id
 * and returns uuid + workflow_data (needed to execute from task buttons).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid action ID" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("actions")
      .select("id, uuid, name, workflow_data")
      .eq("id", numericId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/actions/by-id/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
