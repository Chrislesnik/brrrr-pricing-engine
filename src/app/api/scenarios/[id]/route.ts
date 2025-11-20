import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const id = params?.id
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from("loan_scenarios")
    .select("id, name, inputs, selected, primary, loan_id, created_at, updated_at")
    .eq("id", id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scenario: data })
}

export async function POST(req: Request, { params }: Params) {
  const id = params?.id
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const body = (await req.json().catch(() => ({}))) as {
    name?: string
    inputs?: unknown
    selected?: unknown
    loanId?: string
  }
  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = body.name
  if (body.inputs !== undefined) update.inputs = body.inputs
  if (body.selected !== undefined) update.selected = body.selected
  if (body.loanId !== undefined) update.loan_id = body.loanId
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin
    .from("loan_scenarios")
    .update(update)
    .eq("id", id)
    .select("id, name, inputs, selected, loan_id, primary")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scenario: data })
}

export async function DELETE(_req: Request, { params }: Params) {
  const id = params?.id
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const { error } = await supabaseAdmin.from("loan_scenarios").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(_req: Request, context: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { params } = (context as { params: { id: string } }) ?? { params: { id: "" } }
    const id = params.id
    if (!id) return NextResponse.json({ error: "Missing scenario id" }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from("loan_scenarios")
      .select("id,inputs,selected")
      .eq("id", id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ scenario: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


