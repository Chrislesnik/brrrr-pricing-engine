import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/actions
 * List all actions ordered by created_at desc.
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("actions")
      .select("id, uuid, name, description, is_active, created_at, updated_at, trigger_type, webhook_type")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/actions]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ actions: data ?? [] });
  } catch (err) {
    console.error("[GET /api/actions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/actions
 * Create a new action.
 * Body: { name, description? }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("actions")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        workflow_data: {},
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[POST /api/actions]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/actions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
