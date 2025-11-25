import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export interface LoanRow {
  id: string
  status: "active" | "dead"
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  // Spread of primary scenario inputs (unknown shape)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export async function getPipelineLoansForOrg(orgId: string, userId?: string): Promise<LoanRow[]> {
  if (!orgId) return []
  // If no user is provided, show nothing per requirement
  if (!userId) return []
  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return []

  // Centralized error logger (one-time no-console exemption)
  function logError(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(...args)
  }

  // 1) Fetch loans scoped to organization
  const { data: loansRaw, error: loansError } = await supabaseAdmin
    .from("loans")
    .select("id,status,assigned_to_user_id,organization_id,created_at,updated_at")
    .eq("organization_id", orgUuid)
    .order("updated_at", { ascending: false })

  if (loansError) {
    logError("Error fetching loans:", loansError.message)
    return []
  }
  // Filter by assignment to current user (assigned_to_user_id is a jsonb array of Clerk user IDs)
  const loans = (loansRaw ?? []).filter((l) => {
    const arr = Array.isArray(l.assigned_to_user_id) ? (l.assigned_to_user_id as string[]) : []
    return arr.includes(userId)
  })
  if (loans.length === 0) return []

  const loanIds = loans.map((l) => l.id as string)

  // 2) Fetch primary scenarios for these loans
  const { data: scenarios, error: scenariosError } = await supabaseAdmin
    .from("loan_scenarios")
    .select("loan_id, inputs, selected")
    .in("loan_id", loanIds)
    .eq("primary", true)

  if (scenariosError) {
    logError("Error fetching loan scenarios:", scenariosError.message)
  }
  type ScenarioRow = { loan_id: string; inputs?: Record<string, unknown>; selected?: Record<string, unknown> }
  const loanIdToScenario = new Map<string, ScenarioRow>()
  for (const s of (scenarios ?? []) as ScenarioRow[]) {
    loanIdToScenario.set(s.loan_id as string, {
      loan_id: s.loan_id as string,
      inputs: (s.inputs as Record<string, unknown>) ?? {},
      selected: (s.selected as Record<string, unknown>) ?? {},
    })
  }

  // 3) Fetch organization members to resolve assigned_to_user_id -> user name
  const { data: members, error: membersError } = await supabaseAdmin
    .from("organization_members")
    .select("user_id, first_name, last_name")
    .eq("organization_id", orgUuid)

  if (membersError) {
    logError("Error fetching organization members:", membersError.message)
  }
  const userIdToName = new Map<string, string>()
  for (const m of members ?? []) {
    const fullName = [m.first_name, m.last_name].filter(Boolean).join(" ").trim()
    if (m.user_id) {
      userIdToName.set(m.user_id, fullName || m.user_id)
    }
  }

  // 4) Merge into final rows
  const rows: LoanRow[] = loans.map((l) => {
    const scenario = loanIdToScenario.get(l.id as string)
    const inputs = scenario?.inputs ?? {}
    const selected = scenario?.selected ?? {}
    const assignedToUserIds = Array.isArray(l.assigned_to_user_id)
      ? (l.assigned_to_user_id as string[])
      : []
    const assignedToNames = assignedToUserIds.map((id) => userIdToName.get(id) ?? id)
    const assignedToDisplay = assignedToNames.length ? assignedToNames.join(", ") : null

    return {
      id: l.id as string,
      status: l.status as "active" | "dead",
      assignedTo: assignedToDisplay,
      createdAt: l.created_at as string,
      updatedAt: l.updated_at as string,
      // Derived columns for the pipeline table
      propertyAddress: (() => {
        const addr = inputs["address"] as { street?: string; city?: string; state?: string; zip?: string } | undefined
        if (!addr) return undefined
        const parts = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean)
        return parts.length ? parts.join(", ") : undefined
      })(),
      borrowerFirstName: (inputs["borrower_name"] as string | undefined)?.split(" ")[0],
      borrowerLastName: (() => {
        const name = inputs["borrower_name"] as string | undefined
        if (!name) return undefined
        const parts = name.trim().split(/\s+/)
        return parts.length > 1 ? parts.slice(1).join(" ") : undefined
      })(),
      guarantors: Array.isArray(inputs["guarantors"]) ? (inputs["guarantors"] as string[]) : [],
      loanType: inputs["loan_type"] as string | undefined,
      transactionType: inputs["transaction_type"] as string | undefined,
      loanAmount: (() => {
        // support both selected.loan_amount and legacy selected.loanAmount
        const v = (selected["loan_amount"] ?? selected["loanAmount"]) as string | number | undefined
        const num = typeof v === "string" ? Number(v.toString().replace(/[$,]/g, "")) : (v as number | undefined)
        return Number.isFinite(num as number) ? (num as number) : undefined
      })(),
      rate: (() => {
        // support both selected.rate and legacy selected.interestRate
        const v = (selected["rate"] ?? selected["interestRate"]) as string | number | undefined
        const num = typeof v === "string" ? Number(v.toString().replace(/[%]/g, "")) : (v as number | undefined)
        return Number.isFinite(num as number) ? (num as number) : undefined
      })(),
      ...(inputs as Record<string, unknown>),
    }
  })

  return rows
}


