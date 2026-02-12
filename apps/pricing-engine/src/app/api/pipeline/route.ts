import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getPipelineLoansForOrg } from "@/app/(pricing-engine)/scenarios/data/fetch-loans"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type DealRow = {
  id: string
  organization_id: string
  assigned_to_user_id: unknown
  created_at: string
  updated_at: string
  primary_user_id: string | null
}

type DealInputRow = {
  deal_id: string
  input_id: string
  input_type: string
  value_text: string | null
  value_numeric: number | null
  value_date: string | null
  value_bool: boolean | null
  value_array: unknown | null
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const isMissingTableError = (message?: string) =>
  Boolean(message && message.toLowerCase().includes("does not exist"))

const isMissingColumnError = (message?: string) =>
  Boolean(
    message &&
      message.toLowerCase().includes("column") &&
      message.toLowerCase().includes("does not exist")
  )

/**
 * Read the correct value from a deal_input row based on its input_type.
 */
function readDealInputValue(row: DealInputRow): unknown {
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
      // Return whichever typed column has a value
      return (
        row.value_text ??
        row.value_numeric ??
        row.value_date ??
        row.value_bool ??
        row.value_array ??
        null
      )
  }
}

/**
 * Given an array of deal_input rows, group them by deal_id and build an
 * `inputs` Record per deal: { [input_id]: value }
 */
function buildInputsMap(
  rows: DealInputRow[]
): Record<string, Record<string, unknown>> {
  const map: Record<string, Record<string, unknown>> = {}
  for (const row of rows) {
    if (!map[row.deal_id]) map[row.deal_id] = {}
    map[row.deal_id][row.input_id] = readDealInputValue(row)
  }
  return map
}

/* -------------------------------------------------------------------------- */
/*  GET /api/pipeline                                                          */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    const { searchParams } = new URL(req.url)
    const view = searchParams.get("view")

    if (view === "deals") {
      console.log("[Pipeline] userId:", userId, "orgId:", orgId)
      if (!userId) {
        return NextResponse.json({ deals: [] }, { status: 401 })
      }

      const { data: userRow, error: userErr } = await supabaseAdmin
        .from("users")
        .select("id, is_internal_yn")
        .eq("clerk_user_id", userId)
        .maybeSingle()
      
      console.log("[Pipeline] userRow:", userRow, "userErr:", userErr)

      if (userErr) {
        const message = userErr.message ?? ""
        if (isMissingTableError(message) || isMissingColumnError(message)) {
          return NextResponse.json({ deals: [] })
        }
        return NextResponse.json({ error: message }, { status: 500 })
      }

      if (!userRow) {
        return NextResponse.json({ deals: [] })
      }

      const isInternal = Boolean(userRow.is_internal_yn)
      const userNumericId = userRow.id as number

      // ── Determine which deal IDs this user can see ──────────────────────
      let dealIds: string[] = []

      if (!isInternal) {
        const [directRes, docRes, orgRes] = await Promise.all([
          supabaseAdmin
            .from("deal_roles")
            .select("deal_id")
            .eq("users_id", userNumericId),
          supabaseAdmin
            .from("document_files_clerk_users")
            .select("document_file_id")
            .eq("clerk_user_id", userNumericId),
          supabaseAdmin
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", userId),
        ])

        if (
          directRes.error &&
          !isMissingTableError(directRes.error.message) &&
          !isMissingColumnError(directRes.error.message)
        ) {
          return NextResponse.json({ error: directRes.error.message }, { status: 500 })
        }
        if (
          docRes.error &&
          !isMissingTableError(docRes.error.message) &&
          !isMissingColumnError(docRes.error.message)
        ) {
          return NextResponse.json({ error: docRes.error.message }, { status: 500 })
        }
        if (
          orgRes.error &&
          !isMissingTableError(orgRes.error.message) &&
          !isMissingColumnError(orgRes.error.message)
        ) {
          return NextResponse.json({ error: orgRes.error.message }, { status: 500 })
        }

        const directDealIds = (directRes.data ?? [])
          .map((row) => row.deal_id)
          .filter(Boolean) as string[]

        const documentFileIds = (docRes.data ?? [])
          .map((row) => row.document_file_id)
          .filter(Boolean) as number[]

        let docDealIds: string[] = []
        if (documentFileIds.length > 0) {
          const { data: ddpRows, error: ddpErr } = await supabaseAdmin
            .from("document_files_deals")
            .select("deal_id")
            .in("document_file_id", documentFileIds)
          if (
            ddpErr &&
            !isMissingTableError(ddpErr.message) &&
            !isMissingColumnError(ddpErr.message)
          ) {
            return NextResponse.json({ error: ddpErr.message }, { status: 500 })
          }
          docDealIds = (ddpRows ?? [])
            .map((row) => row.deal_id)
            .filter(Boolean) as string[]
        }

        const memberOrgIds = (orgRes.data ?? [])
          .map((row) => row.organization_id)
          .filter(Boolean) as string[]

        let orgDealIds: string[] = []
        if (memberOrgIds.length > 0) {
          const { data: orgDeals, error: orgDealsErr } = await supabaseAdmin
            .from("deal_clerk_orgs")
            .select("deal_id")
            .in("clerk_org_id", memberOrgIds)
          if (
            orgDealsErr &&
            !isMissingTableError(orgDealsErr.message) &&
            !isMissingColumnError(orgDealsErr.message)
          ) {
            return NextResponse.json({ error: orgDealsErr.message }, { status: 500 })
          }
          orgDealIds = (orgDeals ?? [])
            .map((row) => row.deal_id)
            .filter(Boolean) as string[]
        }

        dealIds = Array.from(
          new Set([...directDealIds, ...docDealIds, ...orgDealIds])
        )
      }

      // ── Fetch deals (only columns that exist on the table) ──────────────
      const dealsQuery = supabaseAdmin
        .from("deals")
        .select("id, organization_id, assigned_to_user_id, created_at, updated_at, primary_user_id")
        .order("created_at", { ascending: false })

      const { data: deals, error: dealsErr } = isInternal
        ? await dealsQuery
        : dealIds.length > 0
          ? await dealsQuery.in("id", dealIds)
          : { data: [], error: null }

      if (dealsErr) {
        const message = (dealsErr as { message?: string })?.message ?? ""
        if (isMissingTableError(message) || isMissingColumnError(message)) {
          return NextResponse.json({ deals: [] })
        }
        return NextResponse.json({ error: message || "Failed to fetch deals" }, { status: 500 })
      }

      const dealRows = (deals ?? []) as DealRow[]

      if (dealRows.length === 0) {
        return NextResponse.json({ deals: [] })
      }

      // ── Fetch deal_inputs for all deals and build inputs map ────────────
      const allDealIds = dealRows.map((d) => d.id)
      let inputsMap: Record<string, Record<string, unknown>> = {}

      const { data: dealInputRows, error: diErr } = await supabaseAdmin
        .from("deal_inputs")
        .select("deal_id, input_id, input_type, value_text, value_numeric, value_date, value_bool, value_array")
        .in("deal_id", allDealIds)

      if (!diErr && dealInputRows) {
        inputsMap = buildInputsMap(dealInputRows as DealInputRow[])
      }

      // ── Transform for the client ───────────────────────────────────────
      const transformed = dealRows.map((deal) => ({
        id: deal.id,
        inputs: inputsMap[deal.id] ?? null,
      }))

      return NextResponse.json({ deals: transformed })
    }

    // ── Non-deals pipeline view ─────────────────────────────────────────
    if (!orgId || !userId) {
      return NextResponse.json({ items: [] })
    }

    const data = await getPipelineLoansForOrg(orgId, userId)
    return NextResponse.json({ items: data })
  } catch (error) {
    console.error("Pipeline API error:", error)
    return NextResponse.json({ items: [], error: "Failed to fetch pipeline data" }, { status: 500 })
  }
}
