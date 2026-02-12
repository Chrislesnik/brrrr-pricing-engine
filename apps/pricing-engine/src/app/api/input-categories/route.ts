import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

/**
 * GET /api/input-categories
 * List all input categories for the current organization, ordered by display_order.
 */
export async function GET() {
  try {
    const { orgId } = await auth()
    if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("input_categories")
      .select("*")
      .eq("organization_id", orgUuid)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[GET /api/input-categories] Supabase error:", error.message, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error("[GET /api/input-categories] Unexpected error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/input-categories
 * Create a new input category.
 * Body: { category: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { orgId } = await auth()
    if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const category = (body.category ?? "").trim()
    if (!category) return NextResponse.json({ error: "Category name is required" }, { status: 400 })

    // Get the next display_order
    const { data: maxRow } = await supabaseAdmin
      .from("input_categories")
      .select("display_order")
      .eq("organization_id", orgUuid)
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxRow?.display_order ?? -1) + 1

    const { data, error } = await supabaseAdmin
      .from("input_categories")
      .insert({ category, organization_id: orgUuid, display_order: nextOrder })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * PATCH /api/input-categories
 * Batch update display_order for categories, or rename a category.
 * Body: { reorder: [{ id: number, display_order: number }] }
 *   OR: { id: number, category: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { orgId } = await auth()
    if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    // Batch reorder
    if (Array.isArray(body.reorder)) {
      const updates = body.reorder as { id: number; display_order: number }[]
      for (const item of updates) {
        await supabaseAdmin
          .from("input_categories")
          .update({ display_order: item.display_order })
          .eq("id", item.id)
          .eq("organization_id", orgUuid)
      }
      return NextResponse.json({ ok: true })
    }

    // Single rename
    if (body.id && body.category) {
      const { error } = await supabaseAdmin
        .from("input_categories")
        .update({ category: body.category })
        .eq("id", body.id)
        .eq("organization_id", orgUuid)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * DELETE /api/input-categories
 * Delete a category and all its inputs.
 * Body: { id: number }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { orgId } = await auth()
    if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const id = body.id
    if (!id) return NextResponse.json({ error: "Category id is required" }, { status: 400 })

    // Delete all inputs in this category first
    await supabaseAdmin
      .from("inputs")
      .delete()
      .eq("category_id", id)
      .eq("organization_id", orgUuid)

    const { error } = await supabaseAdmin
      .from("input_categories")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgUuid)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
