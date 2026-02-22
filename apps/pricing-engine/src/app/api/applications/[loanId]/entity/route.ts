import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

type Payload = {
  entity_id?: string | null
  borrower_name?: string | null
}

export async function POST(
  req: Request,
  context: { params: Promise<{ loanId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { loanId } = await context.params
    if (!loanId) return NextResponse.json({ error: "Missing loan id" }, { status: 400 })
    const body = (await req.json().catch(() => ({}))) as Payload


    const update: Record<string, unknown> = {}
    if (body.entity_id !== undefined) update.entity_id = body.entity_id
    if (body.borrower_name !== undefined) update.borrower_name = body.borrower_name
    if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

    const { error: appErr } = await supabaseAdmin.from("applications").update(update).eq("loan_id", loanId)
    if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 })

    // Entity/borrower data is now stored in loan_scenario_inputs, not on the scenario row directly.


    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

