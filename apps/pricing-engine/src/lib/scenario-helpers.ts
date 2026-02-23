import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * Write scenario inputs to `loan_scenario_inputs` rows.
 * Deletes existing rows for the scenario first (replace pattern).
 */
export async function writeScenarioInputs(
  scenarioId: string,
  inputs: Record<string, unknown>
) {
  // Fetch PE input map: input_code -> { id, input_type, linked_table }
  const { data: peInputs } = await supabaseAdmin
    .from("pricing_engine_inputs")
    .select("id, input_code, input_type, linked_table")
    .is("archived_at", null)

  if (!peInputs || peInputs.length === 0) return

  const codeMap = new Map<string, { id: number; input_type: string; linked_table: string | null }>()
  for (const inp of peInputs) {
    codeMap.set(inp.input_code, {
      id: inp.id as number,
      input_type: inp.input_type as string,
      linked_table: (inp.linked_table as string | null) ?? null,
    })
  }

  // Delete existing rows for this scenario
  await supabaseAdmin
    .from("loan_scenario_inputs")
    .delete()
    .eq("loan_scenario_id", scenarioId)

  // Build rows from the inputs payload
  const rows: Array<Record<string, unknown>> = []

  // Legacy key -> input_code mapping for backward compat
  const keyAliases: Record<string, string> = {
    admin_fee: "lender_admin_fee",
    origination_points: "lender_origination",
    lender_orig_percent: "lender_origination",
    broker_orig_percent: "broker_origination",
    fico: "fico_score",
    num_units: "number_of_units",
    gla_sq_ft: "sq_footage",
    aiv: "as_is_value",
    rehab_completed: "rehab_completed_amount",
    taxes_annual: "annual_taxes",
    hoi_annual: "annual_hoi",
    flood_annual: "annual_flood",
    hoa_annual: "annual_hoa",
    mgmt_annual: "annual_management",
    fthb: "first_time_homebuyer",
    ppp: "pre_payment_penalty",
    str: "short_term_rental",
    section8: "section_8",
    num_flips: "number_of_flips",
    num_gunc: "number_of_gunc",
    other_exp: "other_experience",
    term: "bridge_term",
    max_leverage_requested: "request_max_leverage",
    closing_date: "projected_closing_date",
    projected_note_date: "projected_closing_date",
    hoi_effective_date: "hoi_effective",
    flood_effective_date: "flood_effective",
    unit_data: "leased_units",
  }

  const skip = new Set(["borrower_entity_id", "guarantor_borrower_ids", "guarantor_names", "guarantor_emails", "organization_member_id", "program_id"])
  const seen = new Set<number>()

  for (const [key, val] of Object.entries(inputs)) {
    if (skip.has(key)) continue
    if (key.endsWith("_record_id")) continue
    if (val === undefined || val === null) continue

    const code = keyAliases[key] ?? key
    const pe = codeMap.get(code)
    if (!pe) continue
    if (seen.has(pe.id)) continue
    seen.add(pe.id)

    const row: Record<string, unknown> = {
      loan_scenario_id: scenarioId,
      pricing_engine_input_id: pe.id,
      input_type: pe.input_type,
    }

    if (pe.input_type === "date" && typeof val === "string" && val) {
      try { row.value_date = val } catch { row.value_text = String(val) }
    } else if (pe.input_type === "boolean") {
      row.value_bool = val === "yes" || val === "Yes" || val === true || val === "true"
    } else if (pe.input_type === "table" || pe.input_type === "tags") {
      row.value_array = Array.isArray(val) ? JSON.stringify(val) : null
    } else {
      row.value_text = String(val)
    }

    // Populate linked_record_id for inputs that reference another table
    if (pe.linked_table) {
      const recordId = inputs[`${code}_record_id`] ?? inputs[`${code}_id`]
      if (typeof recordId === "string" && recordId) {
        row.linked_record_id = recordId
      }
    }

    rows.push(row)
  }

  if (rows.length > 0) {
    await supabaseAdmin.from("loan_scenario_inputs").insert(rows)
  }
}

/**
 * Write program results + rate options to new tables.
 * Deletes existing results for the scenario first.
 */
export async function writeScenarioOutputs(
  scenarioId: string,
  outputs: unknown[] | null | undefined,
  selected: Record<string, unknown> | null | undefined
): Promise<{ selectedRateOptionId: number | null }> {
  // Delete existing results (cascade deletes rate_options too)
  await supabaseAdmin
    .from("scenario_program_results")
    .delete()
    .eq("loan_scenario_id", scenarioId)

  // Clear selected FK
  await supabaseAdmin
    .from("loan_scenarios")
    .update({ selected_rate_option_id: null })
    .eq("id", scenarioId)

  if (!outputs || !Array.isArray(outputs) || outputs.length === 0) {
    return { selectedRateOptionId: null }
  }

  let selectedRateOptionId: number | null = null
  const selectedProgramId = selected?.program_id ?? selected?.programId
  const selectedRowIdx = selected?.row_index ?? selected?.rowIdx
  const selectedProgramIndex = selected?.program_index

  for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
    const output = outputs[outputIndex]
    if (!output || typeof output !== "object") continue
    const o = output as Record<string, unknown>

    // Determine program_id - try to match from selected or from output itself
    let programId: string | null = null
    if (typeof o.program_id === "string") programId = o.program_id
    // Validate UUID format
    if (programId && !/^[0-9a-f-]{36}$/i.test(programId)) programId = null

    const { data: resultRow, error: resultErr } = await supabaseAdmin
      .from("scenario_program_results")
      .insert({
        loan_scenario_id: scenarioId,
        program_id: programId,
        program_name: typeof o.program_name === "string" ? o.program_name : null,
        pass: typeof o.pass === "boolean" ? o.pass : null,
        loan_amount: o.loan_amount != null ? String(o.loan_amount) : null,
        ltv: o.ltv != null ? String(o.ltv) : null,
        validations: Array.isArray(o.validations) ? o.validations.filter(Boolean).map(String) : null,
        warnings: Array.isArray(o.warnings ?? o.warning) ? (o.warnings ?? o.warning as unknown[]).filter(Boolean).map(String) : null,
        raw_response: o,
      })
      .select("id")
      .single()

    if (resultErr || !resultRow) continue

    const resultId = resultRow.id as number

    // Extract rate option arrays and create rows
    const loanPrices = Array.isArray(o.loan_price) ? o.loan_price : []
    const interestRates = Array.isArray(o.interest_rate) ? o.interest_rate : []
    const pitias = Array.isArray(o.pitia) ? o.pitia : []
    const dscrs = Array.isArray(o.dscr) ? o.dscr : []
    const initialAmounts = Array.isArray(o.initial_loan_amount) ? o.initial_loan_amount : []
    const rehabHoldbacks = Array.isArray(o.rehab_holdback) ? o.rehab_holdback : []
    const totalAmounts = Array.isArray(o.total_loan_amount) ? o.total_loan_amount : []
    const initialPitias = Array.isArray(o.initial_pitia) ? o.initial_pitia : []
    const fundedPitias = Array.isArray(o.funded_pitia) ? o.funded_pitia : []

    const maxLen = Math.max(
      loanPrices.length, interestRates.length, pitias.length, dscrs.length,
      initialAmounts.length, rehabHoldbacks.length, totalAmounts.length,
      initialPitias.length, fundedPitias.length, 1
    )

    const rateRows: Array<Record<string, unknown>> = []
    for (let i = 0; i < maxLen; i++) {
      rateRows.push({
        scenario_program_result_id: resultId,
        row_index: i,
        loan_price: loanPrices[i] != null ? String(loanPrices[i]) : null,
        interest_rate: interestRates[i] != null ? String(interestRates[i]) : null,
        pitia: pitias[i] != null ? String(pitias[i]) : null,
        dscr: dscrs[i] != null ? String(dscrs[i]) : null,
        initial_loan_amount: initialAmounts[i] != null ? String(initialAmounts[i]) : null,
        rehab_holdback: rehabHoldbacks[i] != null ? String(rehabHoldbacks[i]) : null,
        total_loan_amount: totalAmounts[i] != null ? String(totalAmounts[i]) : null,
        initial_pitia: initialPitias[i] != null ? String(initialPitias[i]) : null,
        funded_pitia: fundedPitias[i] != null ? String(fundedPitias[i]) : null,
      })
    }

    if (rateRows.length > 0) {
      const { data: insertedRates } = await supabaseAdmin
        .from("scenario_rate_options")
        .insert(rateRows)
        .select("id, row_index")

      // Check if any of these rate options match the selected row
      if (insertedRates && selectedRateOptionId === null) {
        const isMatchingProgram =
          (selectedProgramId && programId && String(selectedProgramId) === String(programId)) ||
          (!selectedProgramId && !programId) ||
          (outputs.length === 1) ||
          (selectedProgramIndex != null && outputIndex === Number(selectedProgramIndex))

        if (isMatchingProgram) {
          const match = insertedRates.find(
            (r) => r.row_index === Number(selectedRowIdx)
          )
          if (match) selectedRateOptionId = match.id as number
        }
      }
    }
  }

  // Set the selected FK
  if (selectedRateOptionId) {
    await supabaseAdmin
      .from("loan_scenarios")
      .update({ selected_rate_option_id: selectedRateOptionId })
      .eq("id", scenarioId)
  }

  return { selectedRateOptionId }
}

/**
 * Read scenario inputs from `loan_scenario_inputs` rows,
 * returning a flat object keyed by input_code.
 */
export async function readScenarioInputs(
  scenarioId: string
): Promise<Record<string, unknown>> {
  const { data: rows } = await supabaseAdmin
    .from("loan_scenario_inputs")
    .select("pricing_engine_input_id, input_type, value_text, value_numeric, value_date, value_array, value_bool, linked_record_id")
    .eq("loan_scenario_id", scenarioId)

  if (!rows || rows.length === 0) return {}

  // Fetch input_code map
  const inputIds = rows.map((r) => r.pricing_engine_input_id)
  const { data: readPeInputs } = await supabaseAdmin
    .from("pricing_engine_inputs")
    .select("id, input_code, input_type, linked_table")
    .in("id", inputIds)

  if (!readPeInputs) return {}

  const idToCode = new Map<number, string>()
  const idToLinkedTable = new Map<number, string | null>()
  for (const inp of readPeInputs) {
    idToCode.set(inp.id as number, inp.input_code as string)
    idToLinkedTable.set(inp.id as number, (inp.linked_table as string | null) ?? null)
  }

  const result: Record<string, unknown> = {}

  for (const row of rows) {
    const code = idToCode.get(row.pricing_engine_input_id as number)
    if (!code) continue

    let value: unknown
    if (row.value_date) value = row.value_date
    else if (row.value_bool !== null && row.value_bool !== undefined) value = row.value_bool
    else if (row.value_array) {
      const parsed = typeof row.value_array === "string" ? JSON.parse(row.value_array) : row.value_array
      if (Array.isArray(parsed)) {
        value = parsed.map((item: Record<string, unknown>) => {
          if (item && typeof item === "object" && ("gross" in item || "market" in item)) {
            const { gross, market, ...rest } = item as Record<string, unknown>
            return {
              ...rest,
              ...("gross" in item && !("gross_rent" in item) ? { gross_rent: gross } : {}),
              ...("market" in item && !("market_rent" in item) ? { market_rent: market } : {}),
            }
          }
          return item
        })
      } else {
        value = parsed
      }
    }
    else if (row.value_numeric !== null && row.value_numeric !== undefined) value = row.value_numeric
    else value = row.value_text

    result[code] = value

    // Restore linked record ID for linked inputs
    const linkedRecordId = row.linked_record_id as string | null
    if (linkedRecordId && idToLinkedTable.get(row.pricing_engine_input_id as number)) {
      result[`${code}_record_id`] = linkedRecordId
    }
  }

  return result
}
