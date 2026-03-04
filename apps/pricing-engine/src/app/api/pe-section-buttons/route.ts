import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/pe-section-buttons?category_id=X  (optional filter)
 * Returns buttons with their actions nested.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const categoryId = req.nextUrl.searchParams.get("category_id")

    let query = supabaseAdmin
      .from("pe_section_buttons")
      .select("*, pe_section_button_actions(*)")
      .is("archived_at", null)
      .order("display_order", { ascending: true })

    if (categoryId) {
      query = query.eq("category_id", Number(categoryId))
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const buttons = (data ?? []).map((btn: Record<string, unknown>) => ({
      ...btn,
      actions: ((btn.pe_section_button_actions as Record<string, unknown>[]) ?? [])
        .sort((a, b) => (a.display_order as number) - (b.display_order as number)),
      pe_section_button_actions: undefined,
    }))

    return NextResponse.json(buttons)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/pe-section-buttons
 * Create a button with actions.
 * Body: { category_id, label, icon?, actions: [{ action_type, action_uuid? }] }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { category_id, label, icon, signal_color, actions } = body

    if (!category_id) return NextResponse.json({ error: "category_id is required" }, { status: 400 })
    if (!label?.trim()) return NextResponse.json({ error: "label is required" }, { status: 400 })

    const { data: maxRow } = await supabaseAdmin
      .from("pe_section_buttons")
      .select("display_order")
      .eq("category_id", category_id)
      .is("archived_at", null)
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxRow?.display_order ?? -1) + 1

    const { data: btn, error: btnErr } = await supabaseAdmin
      .from("pe_section_buttons")
      .insert({ category_id, label: label.trim(), icon: icon || null, signal_color: signal_color || null, display_order: nextOrder })
      .select("*")
      .single()

    if (btnErr || !btn) return NextResponse.json({ error: btnErr?.message ?? "Failed to create button" }, { status: 500 })

    if (Array.isArray(actions) && actions.length > 0) {
      const actionRows = actions.map((a: { action_type: string; action_uuid?: string }, i: number) => ({
        button_id: btn.id,
        action_type: a.action_type,
        action_uuid: a.action_uuid || null,
        display_order: i,
      }))
      await supabaseAdmin.from("pe_section_button_actions").insert(actionRows)
    }

    return NextResponse.json(btn)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * PATCH /api/pe-section-buttons
 * Update a button (label, icon, reorder) or replace its actions.
 * Body: { id, label?, icon?, actions?: [{ action_type, action_uuid? }] }
 *   OR: { reorder: [{ id, display_order }] }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    if (Array.isArray(body.reorder)) {
      for (const item of body.reorder as { id: number; display_order: number }[]) {
        await supabaseAdmin
          .from("pe_section_buttons")
          .update({ display_order: item.display_order })
          .eq("id", item.id)
      }
      return NextResponse.json({ ok: true })
    }

    const { id, label, icon, signal_color, actions, required_inputs } = body
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const update: Record<string, unknown> = {}
    if (label !== undefined) update.label = String(label).trim()
    if (icon !== undefined) update.icon = icon || null
    if (signal_color !== undefined) update.signal_color = signal_color || null
    if (required_inputs !== undefined) update.required_inputs = Array.isArray(required_inputs) ? required_inputs : []

    if (Object.keys(update).length > 0) {
      const { error } = await supabaseAdmin.from("pe_section_buttons").update(update).eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (Array.isArray(actions)) {
      await supabaseAdmin.from("pe_section_button_actions").delete().eq("button_id", id)
      if (actions.length > 0) {
        const actionRows = actions.map((a: { action_type: string; action_uuid?: string }, i: number) => ({
          button_id: id,
          action_type: a.action_type,
          action_uuid: a.action_uuid || null,
          display_order: i,
        }))
        await supabaseAdmin.from("pe_section_button_actions").insert(actionRows)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * DELETE /api/pe-section-buttons
 * Soft-delete a button.
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const { error } = await supabaseAdmin
      .from("pe_section_buttons")
      .update({ archived_at: new Date().toISOString(), archived_by: userId })
      .eq("id", body.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
