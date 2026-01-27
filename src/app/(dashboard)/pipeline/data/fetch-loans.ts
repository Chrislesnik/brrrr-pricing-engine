import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId, getUserRoleInOrg, isPrivilegedRole } from "@/lib/orgs"

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

  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run5",
      hypothesisId: "H9",
      location: "pipeline/data/fetch-loans.ts:23",
      message: "fetch-loans entry run5",
      data: { hasOrg: Boolean(orgId), hasUser: Boolean(userId) },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

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

  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run5",
      hypothesisId: "H9",
      location: "pipeline/data/fetch-loans.ts:47",
      message: "loans query completed run5",
      data: { error: loansError?.message ?? null, count: loansRaw?.length ?? 0 },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  if (loansError) {
    logError("Error fetching loans:", loansError.message)
    return []
  }

  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run2",
      hypothesisId: "H5",
      location: "pipeline/data/fetch-loans.ts:53",
      message: "loans fetched",
      data: { count: loansRaw?.length ?? 0 },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  // Check user's role - admin/owner sees all loans
  const userRole = await getUserRoleInOrg(orgUuid, userId)
  const hasFullAccess = isPrivilegedRole(userRole)

  // Filter by assignment to current user (assigned_to_user_id is a jsonb array of Clerk user IDs)
  // Admin/owner: skip filtering and show all loans
  const loans = hasFullAccess
    ? (loansRaw ?? [])
    : (loansRaw ?? []).filter((l) => {
        const arr = Array.isArray(l.assigned_to_user_id) ? (l.assigned_to_user_id as string[]) : []
        return arr.includes(userId)
      })
  if (loans.length === 0) return []

  const loanIds = loans.map((l) => l.id as string)

  // 2) Fetch scenarios for these loans. Prefer the primary one; if none is
  // marked primary, fall back to the most recently created scenario per loan.
  const { data: scenarios, error: scenariosError } = await supabaseAdmin
    .from("loan_scenarios")
    .select("loan_id, inputs, selected, primary, created_at")
    .in("loan_id", loanIds)
    .order("primary", { ascending: false })
    .order("created_at", { ascending: false })

  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run5",
      hypothesisId: "H9",
      location: "pipeline/data/fetch-loans.ts:78",
      message: "scenarios query completed run5",
      data: { error: scenariosError?.message ?? null, count: scenarios?.length ?? 0 },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  if (scenariosError) {
    logError("Error fetching loan scenarios:", scenariosError.message)
  }

  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run2",
      hypothesisId: "H5",
      location: "pipeline/data/fetch-loans.ts:80",
      message: "scenarios fetched",
      data: { count: scenarios?.length ?? 0 },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  type ScenarioRow = {
    loan_id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputs?: Record<string, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selected?: Record<string, any> | null
    primary?: boolean | null
    created_at?: string
  }
  const loanIdToScenario = new Map<string, ScenarioRow>()
  for (const s of (scenarios ?? []) as ScenarioRow[]) {
    const lid = s.loan_id as string
    // Because we ordered by primary DESC then created_at DESC, the first
    // scenario encountered for a loan is the one we want to display.
    if (!loanIdToScenario.has(lid)) {
      loanIdToScenario.set(lid, {
        loan_id: lid,
        inputs: (s.inputs as Record<string, unknown>) ?? {},
        selected: (s.selected as Record<string, unknown>) ?? {},
        primary: (s as any)?.primary ?? null,
        created_at: (s as any)?.created_at as string | undefined,
      })
    }
  }

  // 3) Fetch organization members to resolve assigned_to_user_id -> user name
  const { data: members, error: membersError } = await supabaseAdmin
    .from("organization_members")
    .select("user_id, first_name, last_name")
    .eq("organization_id", orgUuid)

  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run5",
      hypothesisId: "H9",
      location: "pipeline/data/fetch-loans.ts:112",
      message: "members query completed run5",
      data: { error: membersError?.message ?? null, count: members?.length ?? 0 },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  if (membersError) {
    logError("Error fetching organization members:", membersError.message)
  }

  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run2",
      hypothesisId: "H5",
      location: "pipeline/data/fetch-loans.ts:108",
      message: "members fetched",
      data: { count: members?.length ?? 0 },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
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
    const inputs = (scenario?.inputs as Record<string, unknown>) ?? {}
    const selected = (scenario?.selected as Record<string, unknown>) ?? {}
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
        const street = addr.street ?? ""
        const city = addr.city ?? ""
        const state = addr.state ?? ""
        const zip = addr.zip ?? ""
        const stateZip =
          state && zip
            ? `${state} ${zip}`
            : [state, zip].filter(Boolean).join(" ")
        const parts = [street, city, stateZip].filter((p) => String(p).trim().length > 0)
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


