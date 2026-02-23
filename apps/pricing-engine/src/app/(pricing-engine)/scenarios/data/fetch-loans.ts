import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId, getUserRoleInOrg, isPrivilegedRole } from "@/lib/orgs"

export interface LoanRow {
  id: string
  displayId: string
  status: "active" | "inactive" | "archived"
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  // Spread of primary scenario inputs (unknown shape)
   
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
     
    console.error(...args)
  }

  // 1) Fetch loans scoped to organization
  const { data: loansRaw, error: loansError } = await supabaseAdmin
    .from("loans")
    .select("id,display_id,status,organization_id,created_at,updated_at,archived_at")
    .eq("organization_id", orgUuid)
    .order("updated_at", { ascending: false })


  if (loansError) {
    logError("Error fetching loans:", loansError.message)
    return []
  }


  // Check user's role - admin/owner sees all loans
  const userRole = await getUserRoleInOrg(orgUuid, userId)
  const hasFullAccess = isPrivilegedRole(userRole)

  // Filter by role_assignments for non-admin users
  // Admin/owner: skip filtering and show all loans
  let loans = loansRaw ?? []
  if (!hasFullAccess) {
    const loanIdsAll = loans.map((l) => l.id as string)
    const { data: myAssignments } = await supabaseAdmin
      .from("role_assignments")
      .select("resource_id")
      .eq("resource_type", "loan")
      .eq("user_id", userId)
      .in("resource_id", loanIdsAll)
    const myLoanIds = new Set((myAssignments ?? []).map((a) => a.resource_id as string))
    loans = loans.filter((l) => myLoanIds.has(l.id as string))
  }
  if (loans.length === 0) return []

  const loanIds = loans.map((l) => l.id as string)

  // 2) Fetch scenarios for these loans. Prefer the primary one; if none is
  // marked primary, fall back to the most recently created scenario per loan.
  const { data: scenarios, error: scenariosError } = await supabaseAdmin
    .from("loan_scenarios")
    .select("id, loan_id, primary, created_at, selected_rate_option_id")
    .in("loan_id", loanIds)
    .order("primary", { ascending: false })
    .order("created_at", { ascending: false })

  if (scenariosError) {
    logError("Error fetching loan scenarios:", scenariosError.message)
  }

  type ScenarioRow = {
    id: string
    loan_id: string
    inputs?: Record<string, any>
    selected?: Record<string, any> | null
    primary?: boolean | null
    created_at?: string
  }
  const loanIdToScenario = new Map<string, ScenarioRow>()
  for (const s of (scenarios ?? []) as Array<{ id: string; loan_id: string; primary?: boolean; created_at?: string; selected_rate_option_id?: number }>) {
    const lid = s.loan_id
    if (!loanIdToScenario.has(lid)) {
      loanIdToScenario.set(lid, {
        id: s.id,
        loan_id: lid,
        inputs: {},
        selected: {},
        primary: s.primary ?? null,
        created_at: s.created_at,
      })
    }
  }

  // Batch-load inputs for the selected scenarios
  const scenarioIds = [...loanIdToScenario.values()].map((s) => s.id)
  if (scenarioIds.length > 0) {
    const { data: allInputRows } = await supabaseAdmin
      .from("loan_scenario_inputs")
      .select("loan_scenario_id, pricing_engine_input_id, value_text, value_date, value_array, value_bool")
      .in("loan_scenario_id", scenarioIds)

    // Fetch PE input metadata (code + config for address resolution)
    const { data: peInputs } = await supabaseAdmin
      .from("pricing_engine_inputs")
      .select("id, input_code, config")
      .is("archived_at", null)
    const idToCode = new Map<number, string>()
    const idToConfig = new Map<number, Record<string, unknown>>()
    for (const inp of peInputs ?? []) {
      idToCode.set(inp.id as number, inp.input_code as string)
      if (inp.config) idToConfig.set(inp.id as number, inp.config as Record<string, unknown>)
    }

    // Group by scenario and reconstruct inputs (keyed by input_code and by input_id)
    for (const row of allInputRows ?? []) {
      const sid = row.loan_scenario_id as string
      const scenario = [...loanIdToScenario.values()].find((s) => s.id === sid)
      if (!scenario) continue
      const peId = row.pricing_engine_input_id as number
      const code = idToCode.get(peId)
      if (!code) continue
      const val = row.value_date ?? row.value_array ?? (row.value_bool !== null ? row.value_bool : row.value_text)

      // Store by input_id for dynamic column access
      if (!scenario.inputs!.__byId) scenario.inputs!.__byId = {}
      ;(scenario.inputs!.__byId as Record<string, unknown>)[String(peId)] = val

      if (code.startsWith("address_")) {
        if (!scenario.inputs!.address) scenario.inputs!.address = {}
        ;(scenario.inputs!.address as Record<string, unknown>)[code.replace("address_", "")] = val
      } else {
        scenario.inputs![code] = val
      }
    }

    // Load selected rate options for scenarios that have them
    const scenariosWithSelection = [...loanIdToScenario.values()].filter(
      (s) => (scenarios ?? []).find((sc: any) => sc.id === s.id)?.selected_rate_option_id
    )
    for (const s of scenariosWithSelection) {
      const sc = (scenarios ?? []).find((sc: any) => sc.id === s.id) as any
      if (!sc?.selected_rate_option_id) continue
      const { data: rateOpt } = await supabaseAdmin
        .from("scenario_rate_options")
        .select("*, scenario_program_results!inner(program_id, program_name, loan_amount, ltv)")
        .eq("id", sc.selected_rate_option_id)
        .single()
      if (rateOpt) {
        const result = rateOpt.scenario_program_results as Record<string, unknown>
        s.selected = {
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
  }

  // 3) Fetch role assignments for these loans to resolve names
  const { data: roleAssignmentsRaw, error: raError } = await supabaseAdmin
    .from("role_assignments")
    .select("resource_id, user_id")
    .eq("resource_type", "loan")
    .in("resource_id", loanIds)

  if (raError) {
    logError("Error fetching role_assignments:", raError.message)
  }

  // Build a map of loan_id -> set of user_ids from role_assignments
  const loanToUserIds = new Map<string, Set<string>>()
  for (const ra of roleAssignmentsRaw ?? []) {
    const lid = ra.resource_id as string
    if (!loanToUserIds.has(lid)) loanToUserIds.set(lid, new Set())
    loanToUserIds.get(lid)!.add(ra.user_id as string)
  }

  // Also collect all user_ids that need name resolution
  const allAssignedUserIds = new Set<string>()
  for (const ra of roleAssignmentsRaw ?? []) {
    allAssignedUserIds.add(ra.user_id as string)
  }
  

  // Fetch organization members to resolve user names
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

  // For cross-org members not found in our org, do an additional lookup
  const missingUserIds = [...allAssignedUserIds].filter((uid) => !userIdToName.has(uid))
  if (missingUserIds.length > 0) {
    const { data: crossOrgMembers } = await supabaseAdmin
      .from("organization_members")
      .select("user_id, first_name, last_name")
      .in("user_id", missingUserIds)
    for (const m of crossOrgMembers ?? []) {
      const fullName = [m.first_name, m.last_name].filter(Boolean).join(" ").trim()
      if (m.user_id && !userIdToName.has(m.user_id as string)) {
        userIdToName.set(m.user_id as string, fullName || (m.user_id as string))
      }
    }
  }

  // 4) Merge into final rows
  const rows: LoanRow[] = loans.map((l) => {
    const scenario = loanIdToScenario.get(l.id as string)
    const inputs = (scenario?.inputs as Record<string, unknown>) ?? {}
    const selected = (scenario?.selected as Record<string, unknown>) ?? {}
    const inputsById = (inputs.__byId as Record<string, unknown>) ?? {}
    const raUserIds = loanToUserIds.get(l.id as string)
    const assignedToUserIds = raUserIds ? [...raUserIds] : []
    const assignedToNames = assignedToUserIds.map((id) => userIdToName.get(id) ?? id)
    const assignedToDisplay = assignedToNames.length ? assignedToNames.join(", ") : null

    return {
      id: l.id as string,
      displayId: (l as any).display_id as string,
      status: (l as any).archived_at ? "archived" : (l.status as "active" | "inactive"),
      assignedTo: assignedToDisplay,
      createdAt: l.created_at as string,
      updatedAt: l.updated_at as string,
      inputsById,
      borrowerFirstName: (inputs["borrower_name"] as string | undefined)?.split(" ")[0],
      borrowerLastName: (() => {
        const name = inputs["borrower_name"] as string | undefined
        if (!name) return undefined
        const parts = name.trim().split(/\s+/)
        return parts.length > 1 ? parts.slice(1).join(" ") : undefined
      })(),
      guarantors: Array.isArray(inputs["guarantors"]) ? (inputs["guarantors"] as string[]) : [],
      loanAmount: (() => {
        const v = (selected["loan_amount"] ?? selected["loanAmount"]) as string | number | undefined
        const num = typeof v === "string" ? Number(v.toString().replace(/[$,]/g, "")) : (v as number | undefined)
        return Number.isFinite(num as number) ? (num as number) : undefined
      })(),
      rate: (() => {
        const v = (selected["rate"] ?? selected["interestRate"]) as string | number | undefined
        const num = typeof v === "string" ? Number(v.toString().replace(/[%]/g, "")) : (v as number | undefined)
        return Number.isFinite(num as number) ? (num as number) : undefined
      })(),
      ...Object.fromEntries(
        Object.entries(inputs).filter(([k]) => k !== "__byId")
      ),
    }
  })

  return rows
}


