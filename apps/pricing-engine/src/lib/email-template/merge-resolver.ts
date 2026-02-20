import { supabaseAdmin } from "@/lib/supabase-admin"

export type MergeValues = Record<string, string>

/**
 * Given a loanId, fetch all relevant deal data and return a flat map of
 * mergeTag name → resolved string value ready for template substitution.
 *
 * Key format mirrors the MERGE_TAGS naming convention:
 *   borrowers:*       → public.borrowers (joined via loan_scenarios.borrower_entity_id)
 *   property:*        → loan_scenarios.inputs["address"] (subject property / collateral)
 *   loans:*           → public.loans
 *   loan_inputs:*     → loan_scenarios.inputs JSON keys
 *   loan_selected:*   → loan_scenarios.selected JSON keys
 *   organizations:*   → public.organizations (via loans.organization_id)
 */
export async function resolveMergeValues(loanId: string): Promise<MergeValues> {
  // ── Step 1: Fetch loan + primary scenario in parallel ─────────────────────
  const [{ data: loan }, { data: scenario }] = await Promise.all([
    supabaseAdmin
      .from("loans")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select("id, display_id, status, organization_id" as any)
      .eq("id", loanId)
      .single(),
    supabaseAdmin
      .from("loan_scenarios")
      .select("inputs, selected, borrower_entity_id, organization_id")
      .eq("loan_id", loanId)
      .eq("primary", true)
      .limit(1)
      .maybeSingle(),
  ])

  if (!loan) return {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loanAny = loan as any
  const orgId = (scenario?.organization_id ?? loanAny.organization_id) as string | undefined
  const borrowerEntityId = scenario?.borrower_entity_id as string | null | undefined

  // ── Step 2: Fetch borrower + org in parallel ──────────────────────────────
  const [borrowerResult, orgResult] = await Promise.all([
    borrowerEntityId
      ? supabaseAdmin
          .from("borrowers")
          .select(
            "display_id, first_name, last_name, email, primary_phone, alt_phone, " +
            "fico_score, date_of_birth, citizenship, " +
            "address_line1, address_line2, city, state, zip, county"
          )
          .eq("id", borrowerEntityId)
          .single()
      : Promise.resolve({ data: null }),
    orgId
      ? supabaseAdmin
          .from("organizations")
          .select("name, clerk_org_id")
          .eq("id", orgId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const b = borrowerResult.data
  const org = orgResult.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputs = (scenario?.inputs ?? {}) as Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selected = (scenario?.selected ?? {}) as Record<string, any>

  // ── Subject property address (collateral, NOT borrower personal address) ───
  const propAddr = (inputs["address"] ?? {}) as {
    street?: string; city?: string; state?: string; zip?: string; county?: string
  }
  const propStreet = propAddr.street ?? ""
  const propCity = propAddr.city ?? ""
  const propState = propAddr.state ?? ""
  const propZip = propAddr.zip ?? ""
  const propCounty = propAddr.county ?? ""
  const propStateZip = propState && propZip ? `${propState} ${propZip}` : (propState || propZip)
  const propFullAddress = [propStreet, propCity, propStateZip].filter(Boolean).join(", ")

  // ── Currency / percent formatting helpers ─────────────────────────────────
  function parseMoney(v: unknown): string {
    const raw = typeof v === "string" ? v.replace(/[$,]/g, "") : String(v ?? "")
    const n = Number(raw)
    if (!Number.isFinite(n)) return ""
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
  }

  function parsePct(v: unknown): string {
    const raw = typeof v === "string" ? v.replace(/[%,]/g, "") : String(v ?? "")
    const n = Number(raw)
    if (!Number.isFinite(n)) return ""
    return `${n}%`
  }

  function fmtDate(v: unknown): string {
    if (!v) return ""
    try {
      return new Date(v as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    } catch {
      return String(v)
    }
  }

  // ── Build flat lookup map keyed by merge tag name ─────────────────────────
  return {
    // Borrower — public.borrowers table
    "borrowers:display_id":           b?.display_id ?? "",
    "borrowers:first_name":           b?.first_name ?? "",
    "borrowers:last_name":            b?.last_name ?? "",
    "borrowers:full_name":            [b?.first_name, b?.last_name].filter(Boolean).join(" "),
    "borrowers:email":                b?.email ?? "",
    "borrowers:primary_phone":        b?.primary_phone ?? "",
    "borrowers:alt_phone":            b?.alt_phone ?? "",
    "borrowers:fico_score":           b?.fico_score != null ? String(b.fico_score) : "",
    "borrowers:date_of_birth":        fmtDate(b?.date_of_birth),
    "borrowers:citizenship":          b?.citizenship ?? "",
    "borrowers:address_line1":        b?.address_line1 ?? "",
    "borrowers:address_line2":        b?.address_line2 ?? "",
    "borrowers:city":                 b?.city ?? "",
    "borrowers:state":                b?.state ?? "",
    "borrowers:zip":                  b?.zip ?? "",
    "borrowers:county":               b?.county ?? "",

    // Subject Property — loan_scenarios.inputs["address"]
    "property:street":               propStreet,
    "property:city":                 propCity,
    "property:state":                propState,
    "property:zip":                  propZip,
    "property:county":               propCounty,
    "property:full_address":         propFullAddress,

    // Loan — public.loans table
    "loans:display_id":              (loanAny.display_id as string | undefined) ?? (loan.id as string),
    "loans:status":                  (loanAny.status as string | undefined) ?? "",

    // Loan Inputs — loan_scenarios.inputs JSON
    "loan_inputs:loan_type":          (inputs["loan_type"] as string | undefined) ?? "",
    "loan_inputs:transaction_type":   (inputs["transaction_type"] as string | undefined) ?? "",
    "loan_inputs:closing_date":       fmtDate(inputs["closing_date"]),
    "loan_inputs:purchase_price":     parseMoney(inputs["purchase_price"]),
    "loan_inputs:after_repair_value": parseMoney(inputs["after_repair_value"] ?? inputs["arv"]),
    "loan_inputs:entity_name":        (inputs["entity_name"] as string | undefined) ?? "",

    // Loan Outputs — loan_scenarios.selected JSON
    "loan_selected:loan_amount":      parseMoney(selected["loan_amount"] ?? selected["loanAmount"]),
    "loan_selected:rate":             parsePct(selected["rate"] ?? selected["interestRate"]),
    "loan_selected:ltv":              parsePct(selected["ltv"] ?? selected["LTV"]),

    // Organization — public.organizations table
    "organizations:name":             org?.name ?? "",
    "organizations:clerk_org_id":     org?.clerk_org_id ?? "",
  }
}
