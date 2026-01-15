import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

type Payload = {
  guarantor_ids?: (string | null)[]
  guarantor_names?: (string | null)[]
  guarantor_emails?: (string | null)[]
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

    const ids = Array.isArray(body.guarantor_ids) ? body.guarantor_ids : null
    const names = Array.isArray(body.guarantor_names) ? body.guarantor_names : null
    const emails = Array.isArray(body.guarantor_emails) ? body.guarantor_emails : null

    const update: Record<string, unknown> = {}
    if (ids !== null) update.guarantor_ids = ids
    if (names !== null) update.guarantor_names = names
    if (emails !== null) update.guarantor_emails = emails
    if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

    const { error: appErr } = await supabaseAdmin.from("applications").update(update).eq("loan_id", loanId)
    if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 })

    // Also update primary loan_scenario for the loan, if present
    const { data: primaryScenario } = await supabaseAdmin
      .from("loan_scenarios")
      .select("id")
      .eq("loan_id", loanId)
      .eq("primary", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (primaryScenario?.id) {
      await supabaseAdmin
        .from("loan_scenarios")
        .update({
          guarantor_borrower_ids: ids,
          guarantor_names: names,
          guarantor_emails: emails,
        })
        .eq("id", primaryScenario.id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

