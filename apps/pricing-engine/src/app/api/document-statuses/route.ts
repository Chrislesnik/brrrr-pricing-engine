import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("document_status")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    if (!body.label?.trim()) {
      return NextResponse.json({ error: "label is required" }, { status: 400 })
    }

    const code = body.label.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")

    if (body.is_default) {
      await supabaseAdmin
        .from("document_status")
        .update({ is_default: false })
        .eq("is_default", true)
    }

    const { data, error } = await supabaseAdmin
      .from("document_status")
      .insert({
        label: body.label.trim(),
        code,
        color: body.color ?? null,
        is_default: body.is_default ?? false,
        display_order: body.display_order ?? 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))

    if (Array.isArray(body.reorder)) {
      const updates = body.reorder as { id: number; display_order: number }[]
      for (const item of updates) {
        await supabaseAdmin
          .from("document_status")
          .update({ display_order: item.display_order })
          .eq("id", item.id)
      }
      return NextResponse.json({ ok: true })
    }

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const updatePayload: Record<string, unknown> = {}
    if (body.label !== undefined) {
      updatePayload.label = body.label.trim()
      updatePayload.code = body.label.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
    }
    if (body.color !== undefined) updatePayload.color = body.color
    if (body.is_default !== undefined) {
      if (body.is_default) {
        await supabaseAdmin
          .from("document_status")
          .update({ is_default: false })
          .eq("is_default", true)
      }
      updatePayload.is_default = body.is_default
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("document_status")
      .update(updatePayload)
      .eq("id", body.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from("document_status")
      .select("is_default")
      .eq("id", body.id)
      .single()

    if (existing?.is_default) {
      return NextResponse.json(
        { error: "Cannot delete the default status. Assign a different default first." },
        { status: 400 },
      )
    }

    const { error } = await supabaseAdmin
      .from("document_status")
      .delete()
      .eq("id", body.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
