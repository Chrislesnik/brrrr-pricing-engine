import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  context: { params: Promise<{ programId: string }> }
) {
  try {
    const { programId } = await context.params
    if (!programId) {
      return NextResponse.json({ error: "Missing programId" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("program_rows_ids")
      .select("id, program_id, display_name, rent_spreadsheet_id, rent_table_id, compute_spreadsheet_id, compute_table_id, rows_order, primary, created_at")
      .eq("program_id", programId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rows: data ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ programId: string }> }
) {
  try {
    const { programId } = await context.params
    if (!programId) {
      return NextResponse.json({ error: "Missing programId" }, { status: 400 })
    }

    const body = (await req.json().catch(() => null)) as {
      display_name?: string
      rent_spreadsheet_id?: string | null
      rent_table_id?: string | null
      compute_spreadsheet_id?: string | null
      compute_table_id?: string | null
      rows_order?: string
    } | null

    const { data, error } = await supabaseAdmin
      .from("program_rows_ids")
      .insert({
        program_id: programId,
        display_name: body?.display_name ?? null,
        rent_spreadsheet_id: body?.rent_spreadsheet_id ?? null,
        rent_table_id: body?.rent_table_id ?? null,
        compute_spreadsheet_id: body?.compute_spreadsheet_id ?? null,
        compute_table_id: body?.compute_table_id ?? null,
        rows_order: body?.rows_order ?? "ascending",
        primary: false,
      })
      .select("id, program_id, display_name, rent_spreadsheet_id, rent_table_id, compute_spreadsheet_id, compute_table_id, rows_order, primary, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ row: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ programId: string }> }
) {
  try {
    const { programId } = await context.params
    if (!programId) {
      return NextResponse.json({ error: "Missing programId" }, { status: 400 })
    }

    const body = (await req.json().catch(() => null)) as { rowId?: number } | null
    if (!body?.rowId) {
      return NextResponse.json({ error: "Missing rowId" }, { status: 400 })
    }

    // Set all rows for this program to primary = false
    await supabaseAdmin
      .from("program_rows_ids")
      .update({ primary: false })
      .eq("program_id", programId)

    // Set the target row to primary = true
    const { error } = await supabaseAdmin
      .from("program_rows_ids")
      .update({ primary: true })
      .eq("id", body.rowId)
      .eq("program_id", programId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ programId: string }> }
) {
  try {
    const { programId } = await context.params
    if (!programId) {
      return NextResponse.json({ error: "Missing programId" }, { status: 400 })
    }

    const body = (await req.json().catch(() => null)) as {
      rowId?: number
      display_name?: string
      rent_spreadsheet_id?: string
      rent_table_id?: string
      compute_spreadsheet_id?: string
      compute_table_id?: string
      rows_order?: string
    } | null

    if (!body?.rowId) {
      return NextResponse.json({ error: "Missing rowId" }, { status: 400 })
    }

    const update: Record<string, unknown> = {}
    if (body.display_name !== undefined) update.display_name = body.display_name
    if (body.rent_spreadsheet_id !== undefined) update.rent_spreadsheet_id = body.rent_spreadsheet_id
    if (body.rent_table_id !== undefined) update.rent_table_id = body.rent_table_id
    if (body.compute_spreadsheet_id !== undefined) update.compute_spreadsheet_id = body.compute_spreadsheet_id
    if (body.compute_table_id !== undefined) update.compute_table_id = body.compute_table_id
    if (body.rows_order !== undefined) update.rows_order = body.rows_order

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("program_rows_ids")
      .update(update)
      .eq("id", body.rowId)
      .eq("program_id", programId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
