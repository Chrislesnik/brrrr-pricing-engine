import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

function parseBorrowerEntityId(inputs: Record<string, unknown> | undefined): string | null {
  const raw = inputs?.["borrower_entity_id"]
  return typeof raw === "string" && raw.length > 0 ? raw : null
}

function parseGuarantorIds(inputs: Record<string, unknown> | undefined): string[] | null {
  const raw = inputs?.["guarantor_borrower_ids"]
  if (!Array.isArray(raw)) return null
  const ids = raw.filter((v): v is string => typeof v === "string" && v.length > 0)
  return ids.length > 0 ? ids : []
}

function parseGuarantorNames(inputs: Record<string, unknown> | undefined): string[] | null {
  const raw = inputs?.["guarantor_names"] ?? inputs?.["guarantors"]
  if (!Array.isArray(raw)) return null
  const names = raw.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
  return names.length > 0 ? names : []
}

function parseGuarantorEmails(inputs: Record<string, unknown> | undefined): string[] | null {
  const raw = inputs?.["guarantor_emails"]
  if (!Array.isArray(raw)) return null
  const emails = raw.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
  return emails.length > 0 ? emails : []
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing scenario id" }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from("loan_scenarios")
      .select("id, name, inputs, selected, loan_id, primary")
      .eq("id", id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ scenario: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing scenario id" }, { status: 400 })
    const body = (await req.json().catch(() => ({}))) as {
      name?: string
      inputs?: unknown
      selected?: unknown
      loanId?: string
    }
    const update: Record<string, unknown> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.inputs !== undefined) {
      const inputs = body.inputs as Record<string, unknown> | undefined
      update.inputs = inputs
      update.borrower_entity_id = parseBorrowerEntityId(inputs)
      update.guarantor_borrower_ids = parseGuarantorIds(inputs)
      update.guarantor_names = parseGuarantorNames(inputs)
      update.guarantor_emails = parseGuarantorEmails(inputs)
    }
    if (body.selected !== undefined) update.selected = body.selected
    if (body.loanId !== undefined) update.loan_id = body.loanId
    if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from("loan_scenarios")
      .update(update)
      .eq("id", id)
      .select("id, name, inputs, selected, loan_id, primary")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ scenario: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing scenario id" }, { status: 400 })
    const { error } = await supabaseAdmin.from("loan_scenarios").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


