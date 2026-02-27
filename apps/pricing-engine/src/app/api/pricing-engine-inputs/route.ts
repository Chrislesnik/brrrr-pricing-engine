import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { archiveRecord, addArchiveFilter } from "@/lib/archive-helpers"

const VALID_TYPES = [
  "text",
  "dropdown",
  "number",
  "currency",
  "percentage",
  "date",
  "boolean",
  "table",
  "tags",
  "calc_currency",
] as const

function generateInputCode(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
  const suffix = Math.random().toString(36).slice(2, 8)
  return slug ? `pe_${slug}_${suffix}` : `pe_input_${suffix}`
}

/**
 * GET /api/pricing-engine-inputs
 * List all pricing engine inputs, ordered by display_order.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    let query = supabaseAdmin
      .from("pricing_engine_inputs")
      .select("*")
      .order("display_order", { ascending: true })
    query = addArchiveFilter(query, false)
    const { data, error } = await query

    if (error) {
      console.error("[GET /api/pricing-engine-inputs] Supabase error:", error.message, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const normalized = (data ?? []).map((d: Record<string, unknown>) => ({ ...d, id: String(d.id) }))
    return NextResponse.json(normalized)
  } catch (e) {
    console.error("[GET /api/pricing-engine-inputs] Unexpected error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/pricing-engine-inputs
 * Create a new pricing engine input.
 * Body: { category_id, input_label, input_type, dropdown_options?, config?, linked_table?, linked_column? }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { category_id, input_label, input_type, dropdown_options, config, linked_table, linked_column, tooltip, placeholder, default_value, require_recalculate } = body

    if (!category_id) return NextResponse.json({ error: "category_id is required" }, { status: 400 })
    if (!input_label?.trim()) return NextResponse.json({ error: "input_label is required" }, { status: 400 })
    if (!input_type) return NextResponse.json({ error: "input_type is required" }, { status: 400 })

    if (!VALID_TYPES.includes(input_type)) {
      return NextResponse.json({ error: `input_type must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 })
    }

    if (linked_table) {
      const { data: pkResult, error: pkErr } = await supabaseAdmin.rpc("get_primary_key_column", { p_table_name: linked_table })
      if (pkErr || !pkResult) {
        return NextResponse.json({ error: `Table "${linked_table}" does not exist or has no detectable primary key` }, { status: 400 })
      }
    }

    const { data: catRow } = await supabaseAdmin
      .from("pricing_engine_input_categories")
      .select("category")
      .eq("id", category_id)
      .single()

    if (!catRow) return NextResponse.json({ error: "Category not found" }, { status: 404 })

    const { data: maxRow } = await supabaseAdmin
      .from("pricing_engine_inputs")
      .select("display_order")
      .eq("category_id", category_id)
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxRow?.display_order ?? -1) + 1

    const { data, error } = await supabaseAdmin
      .from("pricing_engine_inputs")
      .insert({
        category_id,
        category: catRow.category,
        input_label: input_label.trim(),
        input_code: generateInputCode(input_label),
        input_type,
        dropdown_options: input_type === "dropdown" || input_type === "tags" ? (dropdown_options ?? []) : null,
        config: config ?? {},
        display_order: nextOrder,
        linked_table: linked_table || null,
        linked_column: linked_column || null,
        tooltip: tooltip || null,
        placeholder: placeholder || null,
        default_value: default_value || null,
        require_recalculate: require_recalculate ?? false,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * PATCH /api/pricing-engine-inputs
 * Single update or batch reorder.
 * Body: { id, ...fields } OR { reorder: [{ id, category_id, display_order }] }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    if (body.id && !Array.isArray(body.reorder)) {
      const { id, input_label, input_type, dropdown_options, config, starred, linked_table, linked_column, tooltip, placeholder, default_value, require_recalculate } = body
      const updatePayload: Record<string, unknown> = {}

      if (input_label !== undefined) updatePayload.input_label = String(input_label).trim()
      if (input_type !== undefined) {
        if (!VALID_TYPES.includes(input_type)) {
          return NextResponse.json({ error: `input_type must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 })
        }
        updatePayload.input_type = input_type
        if (input_type !== "dropdown" && input_type !== "tags") updatePayload.dropdown_options = null
      }
      if (dropdown_options !== undefined && !(input_type !== undefined && input_type !== "dropdown" && input_type !== "tags")) {
        updatePayload.dropdown_options = dropdown_options
      }
      if (config !== undefined) updatePayload.config = config
      if (typeof starred === "boolean") updatePayload.starred = starred

      if (linked_table !== undefined) {
        if (linked_table) {
          const { data: pkResult, error: pkErr } = await supabaseAdmin.rpc("get_primary_key_column", { p_table_name: linked_table })
          if (pkErr || !pkResult) {
            return NextResponse.json({ error: `Table "${linked_table}" does not exist or has no detectable primary key` }, { status: 400 })
          }
          updatePayload.linked_table = linked_table
          updatePayload.linked_column = linked_column || null
        } else {
          updatePayload.linked_table = null
          updatePayload.linked_column = null
        }
      }
      if (linked_column !== undefined && linked_table === undefined) {
        updatePayload.linked_column = linked_column || null
      }
      if (tooltip !== undefined) updatePayload.tooltip = tooltip || null
      if (placeholder !== undefined) updatePayload.placeholder = placeholder || null
      if (default_value !== undefined) updatePayload.default_value = default_value || null
      if (typeof require_recalculate === "boolean") updatePayload.require_recalculate = require_recalculate
      if (body.layout_row !== undefined) updatePayload.layout_row = Number(body.layout_row)
      if (body.layout_width !== undefined) updatePayload.layout_width = String(body.layout_width)

      if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from("pricing_engine_inputs")
        .update(updatePayload)
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (Array.isArray(body.reorder)) {
      const updates = body.reorder as { id: string; category_id: number; display_order: number }[]

      const categoryIds = [...new Set(updates.map((u) => u.category_id))]
      const { data: cats } = await supabaseAdmin
        .from("pricing_engine_input_categories")
        .select("id, category")
        .in("id", categoryIds)

      const catMap = new Map((cats ?? []).map((c: { id: number; category: string }) => [c.id, c.category]))

      for (const item of updates) {
        const updatePayload: Record<string, unknown> = {
          category_id: item.category_id,
          display_order: item.display_order,
        }
        const catName = catMap.get(item.category_id)
        if (catName) updatePayload.category = catName

        await supabaseAdmin
          .from("pricing_engine_inputs")
          .update(updatePayload)
          .eq("id", item.id)
      }
      return NextResponse.json({ ok: true })
    }

    if (Array.isArray(body.layout)) {
      const items = body.layout as { id: string; layout_row: number; layout_width: string; category_id?: number }[]
      for (const item of items) {
        const update: Record<string, unknown> = { layout_row: item.layout_row, layout_width: item.layout_width }
        if (item.category_id !== undefined) update.category_id = item.category_id
        await supabaseAdmin
          .from("pricing_engine_inputs")
          .update(update)
          .eq("id", item.id)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * DELETE /api/pricing-engine-inputs
 * Archive a pricing engine input (soft delete).
 * Body: { id: string, action?: "restore" }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { id, action } = body
    if (!id) return NextResponse.json({ error: "Input id is required" }, { status: 400 })

    if (action === "restore") {
      const { restoreRecord } = await import("@/lib/archive-helpers")
      const { error } = await restoreRecord("pricing_engine_inputs", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    const { error } = await archiveRecord("pricing_engine_inputs", id, userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
