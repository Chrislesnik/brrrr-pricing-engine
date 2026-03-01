import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { ensureLiveblocksRoom } from "@/lib/liveblocks"

/* -------------------------------------------------------------------------- */
/*  GET /api/deals — list deals for current user's org                         */
/* -------------------------------------------------------------------------- */

function readDealInputValue(row: {
  input_type: string
  value_text: string | null
  value_numeric: number | null
  value_date: string | null
  value_bool: boolean | null
}): unknown {
  switch (row.input_type) {
    case "text":
    case "dropdown":
      return row.value_text
    case "currency":
    case "number":
    case "percentage":
      return row.value_numeric
    case "date":
      return row.value_date
    case "boolean":
      return row.value_bool
    default:
      return row.value_text ?? row.value_numeric ?? row.value_date ?? row.value_bool ?? null
  }
}

function resolveExpression(
  expr: string,
  codeToId: Map<string, string>,
  inputs: Record<string, unknown>,
): string {
  return expr
    .replace(/@(\w+)/g, (_, code: string) => {
      const inputId = codeToId.get(code)
      if (!inputId) return ""
      const val = inputs[inputId]
      return val !== null && val !== undefined ? String(val) : ""
    })
    .replace(/\s+/g, " ")
    .trim()
}

export async function GET(_req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = await getOrgUuidFromClerkId(orgId)
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const [dealsRes, settingsRes, inputDefsRes] = await Promise.all([
      supabaseAdmin
        .from("deals")
        .select("id, created_at")
        .eq("organization_id", organizationId)
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("app_settings")
        .select("key, value")
        .in("key", ["deal_heading_expression"]),
      supabaseAdmin
        .from("inputs")
        .select("id, input_code")
        .is("archived_at", null),
    ])

    if (dealsRes.error) {
      return NextResponse.json({ error: dealsRes.error.message }, { status: 500 })
    }

    const dealRows = dealsRes.data ?? []
    const dealIds = dealRows.map((d) => d.id as string)

    if (dealIds.length === 0) {
      return NextResponse.json({ deals: [] })
    }

    const settings: Record<string, string> = {}
    for (const row of settingsRes.data ?? []) {
      settings[row.key as string] = row.value as string
    }
    const headingExpr = settings.deal_heading_expression || ""

    const codeToId = new Map<string, string>()
    for (const inp of inputDefsRes.data ?? []) {
      codeToId.set(inp.input_code as string, String(inp.id))
    }

    // Fetch deal_inputs with input_type so we resolve the correct value column
    const { data: diRows } = await supabaseAdmin
      .from("deal_inputs")
      .select("deal_id, input_id, input_type, value_text, value_numeric, value_date, value_bool")
      .in("deal_id", dealIds)

    const inputsByDeal: Record<string, Record<string, unknown>> = {}
    for (const row of diRows ?? []) {
      const did = row.deal_id as string
      const iid = String(row.input_id)
      if (!inputsByDeal[did]) inputsByDeal[did] = {}
      inputsByDeal[did]![iid] = readDealInputValue(row as {
        input_type: string
        value_text: string | null
        value_numeric: number | null
        value_date: string | null
        value_bool: boolean | null
      })
    }

    const result = dealRows.map((d) => {
      const did = d.id as string
      const inputs = inputsByDeal[did] ?? {}
      return {
        id: did,
        heading: headingExpr ? resolveExpression(headingExpr, codeToId, inputs) : null,
        created_at: d.created_at as string,
      }
    })

    return NextResponse.json({ deals: result })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/*  Schema                                                                     */
/* -------------------------------------------------------------------------- */

const dealInputEntry = z.object({
  input_id: z.string(),
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
  input_id: string
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
  entry: { input_id: string; input_type: string; value: string | number | boolean | null }
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

    // Step 3: Populate deal_users for chat @mention filtering
    try {
      await supabaseAdmin
        .from("deal_users")
        .insert({ deal_id: dealId, user_id: userId })
    } catch {
      // deal_users sync is non-critical
    }

    // Step 3b: Create Liveblocks room for real-time collaboration
    ensureLiveblocksRoom({
      roomType: "deal",
      entityId: dealId,
      organizationId: orgId!,
      creatorUserId: userId,
    }).catch(() => {})

    // Step 4: Initialize deal_stepper if a stepper config exists
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
