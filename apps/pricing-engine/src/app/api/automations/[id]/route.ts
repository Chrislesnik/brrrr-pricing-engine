import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { restoreRecord } from "@/lib/archive-helpers";

/**
 * GET /api/automations/[id]
 * Get a single action by uuid.
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

    const { data, error } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("uuid", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    return NextResponse.json({ automation: data });
  } catch (err) {
    console.error("[GET /api/automations/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/automations/[id]
 * Update an action by uuid.
 * Body: { name?, description?, workflow_data?, is_active? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updatePayload: Record<string, unknown> = {};

    if (body.name !== undefined)
      updatePayload.name = String(body.name).trim();
    if (body.description !== undefined)
      updatePayload.description = body.description?.trim() || null;
    if (body.workflow_data !== undefined)
      updatePayload.workflow_data = body.workflow_data;
    if (body.is_active !== undefined)
      updatePayload.is_active = body.is_active;
    if (body.webhook_type !== undefined)
      updatePayload.webhook_type = body.webhook_type;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("automations")
      .update(updatePayload)
      .eq("uuid", id)
      .select("*")
      .single();

    if (error) {
      console.error("[PATCH /api/automations/[id]]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ automation: data });
  } catch (err) {
    console.error("[PATCH /api/automations/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/automations/[id]
 * Archive an action by uuid (soft delete).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check for restore action
    const url = new URL(_request.url);
    if (url.searchParams.get("action") === "restore") {
      // Need to find by uuid first
      const { data: row } = await supabaseAdmin.from("automations").select("id").eq("uuid", id).single();
      if (row) {
        const { error } = await restoreRecord("actions", row.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // Archive instead of delete (actions uses uuid as the route param)
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("automations")
      .update({ archived_at: now, archived_by: userId })
      .eq("uuid", id);

    if (error) {
      console.error("[DELETE /api/automations/[id]]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/automations/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
