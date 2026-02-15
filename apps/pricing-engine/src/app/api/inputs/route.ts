import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { syncDealStages } from "@/lib/sync-deal-stages"
import { archiveRecord, addArchiveFilter, wantsArchived } from "@/lib/archive-helpers"

/** Generate a unique input_code from the label (slug + random suffix). */
function generateInputCode(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
  const suffix = Math.random().toString(36).slice(2, 8)
  return slug ? `${slug}_${suffix}` : `input_${suffix}`
}

/**
 * GET /api/inputs
 * List all inputs, ordered by display_order.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    let query = supabaseAdmin
      .from("inputs")
      .select("*")
      .order("display_order", { ascending: true })
    // Note: GET has no req param, so always filter archived by default
    query = addArchiveFilter(query, false)
    const { data, error } = await query

    if (error) {
      console.error("[GET /api/inputs] Supabase error:", error.message, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert bigint id to string so the frontend can use it as object keys / Set entries
    const normalized = (data ?? []).map((d: any) => ({ ...d, id: String(d.id) }))
    return NextResponse.json(normalized)
  } catch (e) {
    console.error("[GET /api/inputs] Unexpected error:", e)
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
    const { category_id, input_label, input_type, dropdown_options, linked_table, linked_column } = body

    if (!category_id) return NextResponse.json({ error: "category_id is required" }, { status: 400 })
    if (!input_label?.trim()) return NextResponse.json({ error: "input_label is required" }, { status: 400 })
    if (!input_type) return NextResponse.json({ error: "input_type is required" }, { status: 400 })

    const validTypes = ["text", "dropdown", "number", "currency", "percentage", "date", "boolean"]
    if (!validTypes.includes(input_type)) {
      return NextResponse.json({ error: `input_type must be one of: ${validTypes.join(", ")}` }, { status: 400 })
    }

    // Validate linked table if provided
    const LINKABLE_TABLES = ["borrowers", "entities", "entity_owners", "property"]
    if (linked_table && !LINKABLE_TABLES.includes(linked_table)) {
      return NextResponse.json({ error: `linked_table must be one of: ${LINKABLE_TABLES.join(", ")}` }, { status: 400 })
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

    const { data, error } = await supabaseAdmin
      .from("inputs")
      .insert({
        category_id,
        category: catRow.category,
        input_label: input_label.trim(),
        input_code: generateInputCode(input_label),
        input_type,
        dropdown_options: input_type === "dropdown" ? (dropdown_options ?? []) : null,
        display_order: nextOrder,
        linked_table: linked_table || null,
        linked_column: linked_column || null,
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

    // Single input update (edit label, type, dropdown_options, starred, linked_table, linked_column)
    if (body.id && !Array.isArray(body.reorder)) {
      const { id, input_label, input_type, dropdown_options, starred, linked_table, linked_column } = body
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

      // Handle linked table/column updates
      if (linked_table !== undefined) {
        if (linked_table) {
          const LINKABLE_TABLES = ["borrowers", "entities", "entity_owners", "property"]
          if (!LINKABLE_TABLES.includes(linked_table)) {
            return NextResponse.json({ error: `linked_table must be one of: ${LINKABLE_TABLES.join(", ")}` }, { status: 400 })
          }
          updatePayload.linked_table = linked_table
          updatePayload.linked_column = linked_column || null
        } else {
          // Clear the link
          updatePayload.linked_table = null
          updatePayload.linked_column = null
        }
      }
      if (linked_column !== undefined && linked_table === undefined) {
        updatePayload.linked_column = linked_column || null
      }
      if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 })
      }
      const { error } = await supabaseAdmin
        .from("inputs")
        .update(updatePayload)
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // If dropdown_options changed, sync input_stepper + deal_stepper step_order
      // (Postgres trigger handles this too, but this is a safety net)
      if (updatePayload.dropdown_options !== undefined) {
        const newOpts = updatePayload.dropdown_options as string[] | null
        if (newOpts) {
          // Update input_stepper.step_order
          await supabaseAdmin
            .from("input_stepper")
            .update({ step_order: newOpts })
            .eq("input_id", id)

          // Cascade to deal_stepper rows
          const { data: steppers } = await supabaseAdmin
            .from("input_stepper")
            .select("id")
            .eq("input_id", id)
          if (steppers && steppers.length > 0) {
            const stepperIds = steppers.map((s: { id: number }) => s.id)
            await supabaseAdmin
              .from("deal_stepper")
              .update({ step_order: newOpts })
              .in("input_stepper_id", stepperIds)
          }

          // Sync deal_stages with updated step order
          await syncDealStages(newOpts)
        }
      }

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
 * Archive an input (soft delete).
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
      const { error } = await restoreRecord("inputs", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    const { error } = await archiveRecord("inputs", id, userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
