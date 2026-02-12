import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/inputs
 * List all inputs, ordered by display_order.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("inputs")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/inputs
 * Create a new input.
 * Body: { category_id: number, input_label: string, input_type: string, dropdown_options?: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { category_id, input_label, input_type, dropdown_options } = body

    if (!category_id) return NextResponse.json({ error: "category_id is required" }, { status: 400 })
    if (!input_label?.trim()) return NextResponse.json({ error: "input_label is required" }, { status: 400 })
    if (!input_type) return NextResponse.json({ error: "input_type is required" }, { status: 400 })

    const validTypes = ["text", "dropdown", "number", "currency", "percentage", "date", "boolean"]
    if (!validTypes.includes(input_type)) {
      return NextResponse.json({ error: `input_type must be one of: ${validTypes.join(", ")}` }, { status: 400 })
    }

    // Look up the category name
    const { data: catRow } = await supabaseAdmin
      .from("input_categories")
      .select("category")
      .eq("id", category_id)
      .single()

    if (!catRow) return NextResponse.json({ error: "Category not found" }, { status: 404 })

    // Get next display_order for this category
    const { data: maxRow } = await supabaseAdmin
      .from("inputs")
      .select("display_order")
      .eq("category_id", category_id)
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxRow?.display_order ?? -1) + 1

    // Generate a snake_case input_code from the label
    const inputCode = input_label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")

    const { data, error } = await supabaseAdmin
      .from("inputs")
      .insert({
        input_code: inputCode,
        category_id,
        category: catRow.category,
        input_label: input_label.trim(),
        input_type,
        dropdown_options: input_type === "dropdown" ? (dropdown_options ?? []) : null,
        display_order: nextOrder,
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
 * PATCH /api/inputs
 * Batch update display_order and/or category_id for inputs (drag-and-drop moves).
 * Body: { reorder: [{ id: string, category_id: number, display_order: number }] }
 *   OR: { id: string, ...fields to update }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    // Single input update (edit label, type, dropdown_options, starred)
    if (body.id && !Array.isArray(body.reorder)) {
      const { id, input_label, input_type, dropdown_options, starred } = body
      const updatePayload: Record<string, unknown> = {}
      if (input_label !== undefined) updatePayload.input_label = String(input_label).trim()
      if (input_type !== undefined) {
        const validTypes = ["text", "dropdown", "number", "currency", "percentage", "date", "boolean"]
        if (!validTypes.includes(input_type)) {
          return NextResponse.json({ error: `input_type must be one of: ${validTypes.join(", ")}` }, { status: 400 })
        }
        updatePayload.input_type = input_type
        if (input_type !== "dropdown") updatePayload.dropdown_options = null
      }
      if (dropdown_options !== undefined && !(input_type !== undefined && input_type !== "dropdown"))
        updatePayload.dropdown_options = dropdown_options
      if (typeof starred === "boolean") updatePayload.starred = starred
      if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 })
      }
      const { error } = await supabaseAdmin
        .from("inputs")
        .update(updatePayload)
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // Batch reorder (used after drag-and-drop)
    if (Array.isArray(body.reorder)) {
      const updates = body.reorder as { id: string; category_id: number; display_order: number }[]

      // Also look up category names for any cross-column moves
      const categoryIds = [...new Set(updates.map((u) => u.category_id))]
      const { data: cats } = await supabaseAdmin
        .from("input_categories")
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
          .from("inputs")
          .update(updatePayload)
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
 * DELETE /api/inputs
 * Delete an input.
 * Body: { id: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const id = body.id
    if (!id) return NextResponse.json({ error: "Input id is required" }, { status: 400 })

    const { error } = await supabaseAdmin
      .from("inputs")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
