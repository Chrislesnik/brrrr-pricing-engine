import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

/* -------------------------------------------------------------------------- */
/*  Schema                                                                     */
/* -------------------------------------------------------------------------- */

const dealInputEntry = z.object({
  input_id: z.coerce.number(),  // DB stores int8; coerce string→number
  input_type: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
})

const createDealSchema = z.object({
  deal_inputs: z.array(dealInputEntry),
})

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type DealInputRow = {
  deal_id: string
  input_id: number
  input_type: string
  value_text?: string | null
  value_numeric?: number | null
  value_date?: string | null
  value_bool?: boolean | null
  value_array?: unknown | null
}

/**
 * Map a deal_input entry to the correct typed-value column based on input_type.
 */
function buildDealInputRow(
  dealId: string,
  entry: { input_id: number; input_type: string; value: string | number | boolean | null }
): DealInputRow {
  const row: DealInputRow = {
    deal_id: dealId,
    input_id: entry.input_id,
    input_type: entry.input_type,
    value_text: null,
    value_numeric: null,
    value_date: null,
    value_bool: null,
    value_array: null,
  }

  const { value } = entry
  if (value === null || value === undefined) return row

  switch (entry.input_type) {
    case "text":
    case "dropdown": {
      const str = typeof value === "string" ? value.trim() : String(value)
      row.value_text = str.length > 0 ? str : null
      break
    }
    case "currency":
    case "number":
    case "percentage": {
      const num = typeof value === "number" ? value : Number(value)
      row.value_numeric = isNaN(num) ? null : num
      break
    }
    case "date": {
      const str = typeof value === "string" ? value.trim() : String(value)
      row.value_date = str.length > 0 ? str : null
      break
    }
    case "boolean": {
      if (typeof value === "boolean") {
        row.value_bool = value
      } else if (typeof value === "string") {
        row.value_bool = value === "true"
      } else {
        row.value_bool = Boolean(value)
      }
      break
    }
    default: {
      // Fallback: store as text
      const str = typeof value === "string" ? value.trim() : String(value)
      row.value_text = str.length > 0 ? str : null
      break
    }
  }

  return row
}

/* -------------------------------------------------------------------------- */
/*  POST /api/deals                                                            */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!orgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 })
    }

    const organizationId = await getOrgUuidFromClerkId(orgId)
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const json = await req.json().catch(() => null)
    if (!json) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const parsed = createDealSchema.parse(json)

    // Step 1: Insert the deal row (only columns that exist on the deals table)
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .insert({
        organization_id: organizationId,
        assigned_to_user_id: [userId],
        primary_user_id: userId,
      })
      .select("id")
      .single()

    if (dealError || !deal) {
      console.error("[POST /api/deals] Failed to create deal:", dealError)
      return NextResponse.json(
        { error: dealError?.message || "Failed to create deal" },
        { status: 500 }
      )
    }

    const dealId = deal.id as string

    // Step 2: Build deal_inputs rows for ALL inputs (blank ones get NULL values)
    const rows = parsed.deal_inputs.map((entry) =>
      buildDealInputRow(dealId, entry)
    )

    if (rows.length > 0) {
      const { error: inputsError } = await supabaseAdmin
        .from("deal_inputs")
        .insert(rows)

      if (inputsError) {
        console.error("[POST /api/deals] Failed to insert deal_inputs:", inputsError)
        // Deal was created but inputs failed — return partial success with warning
        return NextResponse.json(
          {
            ok: true,
            deal: { id: dealId },
            warning: `Deal created but some inputs failed to save: ${inputsError.message}`,
          },
          { status: 207 }
        )
      }
    }

    // Step 3: Initialize deal_stepper if a stepper config exists
    try {
      const { data: stepperConfig } = await supabaseAdmin
        .from("input_stepper")
        .select("id, input_id, step_order")
        .limit(1)
        .single()

      if (stepperConfig && stepperConfig.step_order && stepperConfig.step_order.length > 0) {
        await supabaseAdmin
          .from("deal_stepper")
          .insert({
            deal_id: dealId,
            input_stepper_id: stepperConfig.id,
            current_step: stepperConfig.step_order[0],
            step_order: stepperConfig.step_order,
          })
      }
    } catch {
      // Stepper initialization is non-critical — don't fail deal creation
    }

    return NextResponse.json({ ok: true, deal: { id: dealId } })
  } catch (error) {
    console.error("[POST /api/deals] Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
