import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function POST(_req: Request, context: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { params } = (context as { params: { id: string } }) ?? { params: { id: "" } }
    const id = params.id
    if (!id) return NextResponse.json({ error: "Missing scenario id" }, { status: 400 })

    // 1) Get the scenario to know its loan_id
    const { data: s, error: selErr } = await supabaseAdmin
      .from("loan_scenarios")
      .select("loan_id")
      .eq("id", id)
      .single()
    if (selErr || !s?.loan_id) {
      return NextResponse.json({ error: selErr?.message || "Scenario not found" }, { status: 404 })
    }
    const loanId = s.loan_id as string

    // 2) Unset all primaries for this loan
    const { error: unsetErr } = await supabaseAdmin
      .from("loan_scenarios")
      .update({ primary: false })
      .eq("loan_id", loanId)
    if (unsetErr) return NextResponse.json({ error: unsetErr.message }, { status: 500 })

    // 3) Set this one as primary
    const { error: setErr } = await supabaseAdmin
      .from("loan_scenarios")
      .update({ primary: true })
      .eq("id", id)
    if (setErr) return NextResponse.json({ error: setErr.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


