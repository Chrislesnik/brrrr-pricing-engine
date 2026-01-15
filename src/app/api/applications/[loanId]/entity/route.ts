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

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H1',location:'entity-route:entry',message:'entity route entry',data:{loanId,body},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    const update: Record<string, unknown> = {}
    if (body.entity_id !== undefined) update.entity_id = body.entity_id
    if (body.borrower_name !== undefined) update.borrower_name = body.borrower_name
    if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

    const { error: appErr } = await supabaseAdmin.from("applications").update(update).eq("loan_id", loanId)
    if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 })

    // Also update primary loan_scenario for the loan, if present (ids + borrower name only, no emails)
    const { data: primaryScenario } = await supabaseAdmin
      .from("loan_scenarios")
      .select("id, inputs")
      .eq("loan_id", loanId)
      .eq("primary", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (primaryScenario?.id) {
      const existingInputs = (primaryScenario.inputs as Record<string, unknown> | null) ?? {}
      const inputsJson = { ...existingInputs }
      if (body.borrower_name !== undefined) {
        inputsJson["borrower_name"] = body.borrower_name
      }
      await supabaseAdmin
        .from("loan_scenarios")
        .update({
          borrower_entity_id: body.entity_id ?? null,
          inputs: inputsJson,
        })
        .eq("id", primaryScenario.id)

      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'entity-route:update-scenario',message:'updated scenario from entity',data:{loanId,primaryScenarioId:primaryScenario.id,entityId:update.entity_id ?? null,borrowerName:body.borrower_name ?? null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
    }

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'entity-route:ok',message:'entity route ok',data:{loanId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H4',location:'entity-route:catch',message:'entity route error',data:{loanId:null,err:msg},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

