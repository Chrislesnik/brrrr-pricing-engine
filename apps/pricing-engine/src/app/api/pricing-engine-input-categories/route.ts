import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { archiveRecord, restoreRecord } from "@/lib/archive-helpers"

/**
 * GET /api/pricing-engine-input-categories
 * List all pricing engine input categories, ordered by display_order.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("pricing_engine_input_categories")
      .select("*")
      .is("archived_at", null)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[GET /api/pricing-engine-input-categories] Supabase error:", error.message, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error("[GET /api/pricing-engine-input-categories] Unexpected error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/pricing-engine-input-categories
 * Create a new pricing engine input category.
 * Body: { category: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const category = (body.category ?? "").trim()
    if (!category) return NextResponse.json({ error: "Category name is required" }, { status: 400 })

    const { data: maxRow } = await supabaseAdmin
      .from("pricing_engine_input_categories")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxRow?.display_order ?? -1) + 1

    const { data, error } = await supabaseAdmin
      .from("pricing_engine_input_categories")
      .insert({ category, display_order: nextOrder })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * PATCH /api/pricing-engine-input-categories
 * Batch update display_order for categories, or rename a category.
 * Body: { reorder: [{ id: number, display_order: number }] }
 *   OR: { id: number, category: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    if (Array.isArray(body.reorder)) {
      const updates = body.reorder as { id: number; display_order: number }[]
      for (const item of updates) {
        await supabaseAdmin
          .from("pricing_engine_input_categories")
          .update({ display_order: item.display_order })
          .eq("id", item.id)
      }
      return NextResponse.json({ ok: true })
    }

    if (body.id && body.category) {
      const { error } = await supabaseAdmin
        .from("pricing_engine_input_categories")
        .update({ category: body.category })
        .eq("id", body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // Toggle default_open
    if (body.id && typeof body.default_open === "boolean") {
      const { error } = await supabaseAdmin
        .from("pricing_engine_input_categories")
        .update({ default_open: body.default_open })
        .eq("id", body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // Update config (section buttons, etc.)
    if (body.id && body.config !== undefined) {
      const { error } = await supabaseAdmin
        .from("pricing_engine_input_categories")
        .update({ config: body.config })
        .eq("id", body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * DELETE /api/pricing-engine-input-categories
 * Archive a category and all its inputs (soft delete).
 * Body: { id: number, action?: "restore" }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const id = body.id
    if (!id) return NextResponse.json({ error: "Category id is required" }, { status: 400 })

    if (body.action === "restore") {
      const { error } = await restoreRecord("pricing_engine_input_categories", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      await supabaseAdmin
        .from("pricing_engine_inputs")
        .update({ archived_at: null, archived_by: null })
        .eq("category_id", id)
      return NextResponse.json({ ok: true })
    }

    const now = new Date().toISOString()
    await supabaseAdmin
      .from("pricing_engine_inputs")
      .update({ archived_at: now, archived_by: userId })
      .eq("category_id", id)
      .is("archived_at", null)

    const { error } = await archiveRecord("pricing_engine_input_categories", id, userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
