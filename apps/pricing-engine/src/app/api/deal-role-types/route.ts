import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/deal-role-types
 * List all active deal role types ordered by display_order.
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("deal_role_types")
      .select("id, code, name, description, display_order, is_active")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[GET /api/deal-role-types]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ roles: data ?? [] });
  } catch (err) {
    console.error("[GET /api/deal-role-types]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deal-role-types
 * Create a new deal role type. Body: { name: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const code = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    // Get next display_order
    const { data: maxRow } = await supabaseAdmin
      .from("deal_role_types")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxRow?.display_order ?? -1) + 1;

    const { data, error } = await supabaseAdmin
      .from("deal_role_types")
      .insert({ code, name, display_order: nextOrder, is_active: true })
      .select("id, code, name, display_order, is_active")
      .single();

    if (error) {
      console.error("[POST /api/deal-role-types]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ role: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/deal-role-types]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/deal-role-types
 * Update a deal role type. Body: { id: number, is_active?: boolean, name?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.is_active !== undefined) updatePayload.is_active = body.is_active;
    if (body.name !== undefined) updatePayload.name = body.name.trim();

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("deal_role_types")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("[PATCH /api/deal-role-types]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/deal-role-types]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
