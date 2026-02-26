import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { archiveRecord, restoreRecord } from "@/lib/archive-helpers"
import { writeScenarioInputs, writeScenarioOutputs, readScenarioInputs, readScenarioOutputs } from "@/lib/scenario-helpers"

export const runtime = "nodejs"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing scenario id" }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from("loan_scenarios")
      .select("id, name, loan_id, primary, selected_rate_option_id")
      .eq("id", id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Read inputs and outputs from normalized tables in parallel
    const [inputs, outputs] = await Promise.all([
      readScenarioInputs(id),
      readScenarioOutputs(id),
    ])

    // Read selected from the rate option FK
    let selected: Record<string, unknown> | null = null
    if (data?.selected_rate_option_id) {
      const { data: rateOpt } = await supabaseAdmin
        .from("scenario_rate_options")
        .select("*, scenario_program_results!inner(program_id, program_name, loan_amount, ltv)")
        .eq("id", data.selected_rate_option_id)
        .single()
      if (rateOpt) {
        const result = rateOpt.scenario_program_results as Record<string, unknown>
        selected = {
          program_id: result?.program_id ?? null,
          program_name: result?.program_name ?? null,
          row_index: rateOpt.row_index,
          loanPrice: rateOpt.loan_price,
          interestRate: rateOpt.interest_rate,
          loanAmount: (result?.loan_amount as string) ?? rateOpt.total_loan_amount ?? null,
          ltv: (result?.ltv as string) ?? null,
          pitia: rateOpt.pitia,
          dscr: rateOpt.dscr,
        }
      }
    }

    return NextResponse.json({
      scenario: {
        id: data?.id,
        name: data?.name,
        loan_id: data?.loan_id,
        primary: data?.primary,
        inputs,
        outputs,
        selected,
      },
    })
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
      outputs?: unknown[] | null
      selected?: unknown
      loanId?: string
    }

    // Fetch previous state for comparison
    const { data: previousScenario } = await supabaseAdmin
      .from("loan_scenarios")
      .select("loan_id")
      .eq("id", id)
      .single()
    const previousInputs = await readScenarioInputs(id)

    const update: Record<string, unknown> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.loanId !== undefined) update.loan_id = body.loanId
    if (Object.keys(update).length === 0 && body.inputs === undefined && body.selected === undefined && body.outputs === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }
    let data: Record<string, unknown> | null = null
    if (Object.keys(update).length > 0) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("loan_scenarios")
        .update(update)
        .eq("id", id)
        .select("id, name, loan_id, primary")
        .single()
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
      data = updated as Record<string, unknown>
    } else {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from("loan_scenarios")
        .select("id, name, loan_id, primary")
        .eq("id", id)
        .single()
      if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
      data = existing as Record<string, unknown>
    }
    const error = null
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Write to normalized tables
    if (body.inputs !== undefined) {
      await writeScenarioInputs(id, body.inputs as Record<string, unknown>)
    }
    if (body.outputs && Array.isArray(body.outputs) && body.outputs.length > 0) {
      await writeScenarioOutputs(
        id,
        body.outputs,
        (body.selected ?? data?.selected) as Record<string, unknown> | null | undefined
      )
    } else if (body.selected) {
      // Update selection on existing rate options without re-writing outputs
      const sel = body.selected as Record<string, unknown>
      const programId = sel.program_id ?? sel.programId
      const rowIdx = sel.row_index ?? sel.rowIdx

      const { data: existingResults } = await supabaseAdmin
        .from("scenario_program_results")
        .select("id, program_id")
        .eq("loan_scenario_id", id)

      if (existingResults?.length) {
        const matchResult = programId
          ? existingResults.find(r => String(r.program_id) === String(programId))
          : existingResults[0]

        if (matchResult) {
          const { data: rateOpt } = await supabaseAdmin
            .from("scenario_rate_options")
            .select("id")
            .eq("scenario_program_result_id", matchResult.id)
            .eq("row_index", Number(rowIdx))
            .single()

          if (rateOpt) {
            await supabaseAdmin
              .from("loan_scenarios")
              .update({ selected_rate_option_id: rateOpt.id })
              .eq("id", id)
          }
        }
      }
    }

    // Log activity for scenario update - compare and log separately
    try {
      const loanId = data?.loan_id ?? body.loanId ?? null

      const inputsChanged = body.inputs !== undefined && 
        JSON.stringify(previousInputs) !== JSON.stringify(body.inputs)
      
      const selectionChanged = body.selected !== undefined

      // Log input_changes if inputs actually changed
      if (inputsChanged) {
        await supabaseAdmin.from("pricing_activity_log").insert({
          loan_id: loanId,
          scenario_id: id,
          activity_type: "input_changes",
          action: "changed",
          user_id: userId,
          inputs: body.inputs ?? null,
          outputs: body.outputs ?? null,
          selected: null,
        })
      }

      // Log selection_changed if selection actually changed
      if (selectionChanged) {
        await supabaseAdmin.from("pricing_activity_log").insert({
          loan_id: loanId,
          scenario_id: id,
          activity_type: "selection_changed",
          action: "changed",
          user_id: userId,
          inputs: null,
          outputs: body.outputs ?? null,
          selected: body.selected ?? null,
        })
      }
    } catch {
      // Activity logging should not block the main flow
    }

    return NextResponse.json({ scenario: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing scenario id" }, { status: 400 })

    // Check for restore action via query param
    const url = new URL(req.url)
    if (url.searchParams.get("action") === "restore") {
      const { error } = await restoreRecord("loan_scenarios", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    const { error } = await archiveRecord("loan_scenarios", id, userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


