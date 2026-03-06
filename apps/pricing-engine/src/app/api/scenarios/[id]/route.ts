import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { authForApiRoute } from "@/lib/orgs"
import { archiveRecord, restoreRecord } from "@/lib/archive-helpers"
import { writeScenarioInputs, writeScenarioOutputs, readScenarioInputs, readScenarioOutputs } from "@/lib/scenario-helpers"

export const runtime = "nodejs"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string
    try {
      ({ userId } = await authForApiRoute("scenarios", "read"))
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 401
      return NextResponse.json({ error: (e as Error).message }, { status })
    }
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
        .select("*, scenario_program_results!inner(program_id, program_name, loan_amount, ltv, raw_response)")
        .eq("id", data.selected_rate_option_id)
        .single()
      if (rateOpt) {
        const result = rateOpt.scenario_program_results as Record<string, unknown>
        // raw_response may contain { id, ok, data: {...}, internal_name, ... }
        const raw = (result?.raw_response ?? {}) as Record<string, unknown>
        const innerData = (raw.data && typeof raw.data === "object" ? raw.data : raw) as Record<string, unknown>
        const rowIdx = rateOpt.row_index ?? 0
        const pickFromArray = (arr: unknown, idx: number) => {
          if (!Array.isArray(arr)) return null
          // Try the exact index first
          if (idx < arr.length && arr[idx] != null && String(arr[idx]).trim() !== "") return String(arr[idx])
          // Fall back to first non-empty value (handles sparse arrays where early rows are empty)
          for (const v of arr) {
            if (v != null && String(v).trim() !== "") return String(v)
          }
          return null
        }
        selected = {
          program_id: result?.program_id ?? raw.id ?? innerData.program_id ?? null,
          program_name: result?.program_name ?? (raw.internal_name as string) ?? innerData.program_name ?? null,
          program_index: rateOpt.row_index != null ? undefined : 0,
          row_index: rowIdx,
          loanPrice: rateOpt.loan_price ?? pickFromArray(innerData.loan_price, rowIdx),
          interestRate: rateOpt.interest_rate ?? pickFromArray(innerData.interest_rate, rowIdx),
          loanAmount: (result?.loan_amount as string) ?? rateOpt.total_loan_amount ?? (innerData.loan_amount as string) ?? null,
          ltv: (result?.ltv as string) ?? (innerData.ltv as string) ?? null,
          pitia: rateOpt.pitia ?? pickFromArray(innerData.pitia, rowIdx),
          dscr: rateOpt.dscr ?? pickFromArray(innerData.dscr, rowIdx),
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
    let userId: string
    try {
      ({ userId } = await authForApiRoute("scenarios", "write"))
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 401
      return NextResponse.json({ error: (e as Error).message }, { status })
    }
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
      const programIndex = sel.program_index ?? sel.programIdx
      const rowIdx = sel.row_index ?? sel.rowIdx

      const { data: existingResults } = await supabaseAdmin
        .from("scenario_program_results")
        .select("id, program_id")
        .eq("loan_scenario_id", id)
        .order("id", { ascending: true })

      if (existingResults?.length) {
        // Try matching by program_id first, then fall back to index
        let matchResult = programId
          ? existingResults.find(r => r.program_id && String(r.program_id) === String(programId))
          : null
        if (!matchResult && programIndex != null) {
          const idx = Number(programIndex)
          if (idx >= 0 && idx < existingResults.length) {
            matchResult = existingResults[idx]
          }
        }
        if (!matchResult) {
          matchResult = existingResults[0]
        }

        if (matchResult) {
          const { data: rateOpt } = await supabaseAdmin
            .from("scenario_rate_options")
            .select("id")
            .eq("scenario_program_result_id", matchResult.id)
            .eq("row_index", Number(rowIdx ?? 0))
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
    let userId: string
    try {
      ({ userId } = await authForApiRoute("scenarios", "write"))
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 401
      return NextResponse.json({ error: (e as Error).message }, { status })
    }
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


