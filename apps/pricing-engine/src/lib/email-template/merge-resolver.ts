import { supabaseAdmin } from "@/lib/supabase-admin"

export type MergeValues = Record<string, string>

// ─── Shared formatting helpers ──────────────────────────────────────────────

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

function buildBorrowerValues(b: Record<string, unknown> | null): MergeValues {
  if (!b) return {}
  return {
    "borrowers:display_id":    String(b.display_id ?? ""),
    "borrowers:first_name":    String(b.first_name ?? ""),
    "borrowers:last_name":     String(b.last_name ?? ""),
    "borrowers:full_name":     [b.first_name, b.last_name].filter(Boolean).join(" "),
    "borrowers:email":         String(b.email ?? ""),
    "borrowers:primary_phone": String(b.primary_phone ?? ""),
    "borrowers:alt_phone":     String(b.alt_phone ?? ""),
    "borrowers:fico_score":    b.fico_score != null ? String(b.fico_score) : "",
    "borrowers:date_of_birth": fmtDate(b.date_of_birth),
    "borrowers:citizenship":   String(b.citizenship ?? ""),
    "borrowers:address_line1": String(b.address_line1 ?? ""),
    "borrowers:address_line2": String(b.address_line2 ?? ""),
    "borrowers:city":          String(b.city ?? ""),
    "borrowers:state":         String(b.state ?? ""),
    "borrowers:zip":           String(b.zip ?? ""),
    "borrowers:county":        String(b.county ?? ""),
  }
}

function buildOrgValues(org: Record<string, unknown> | null): MergeValues {
  if (!org) return {}
  return {
    "organizations:name":         String(org.name ?? ""),
    "organizations:clerk_org_id": String(org.clerk_organization_id ?? ""),
  }
}

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
          .select("name, clerk_organization_id")
          .eq("id", orgId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = borrowerResult.data as Record<string, any> | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const org = orgResult.data as Record<string, any> | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputs = (scenario?.inputs ?? {}) as Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selected = (scenario?.selected ?? {}) as Record<string, any>

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

  return {
    ...buildBorrowerValues(b),
    ...buildOrgValues(org),

    "property:street":               propStreet,
    "property:city":                 propCity,
    "property:state":                propState,
    "property:zip":                  propZip,
    "property:county":               propCounty,
    "property:full_address":         propFullAddress,

    "loans:display_id":              (loanAny.display_id as string | undefined) ?? (loan.id as string),
    "loans:status":                  (loanAny.status as string | undefined) ?? "",

    "loan_inputs:loan_type":          (inputs["loan_type"] as string | undefined) ?? "",
    "loan_inputs:transaction_type":   (inputs["transaction_type"] as string | undefined) ?? "",
    "loan_inputs:closing_date":       fmtDate(inputs["closing_date"]),
    "loan_inputs:purchase_price":     parseMoney(inputs["purchase_price"]),
    "loan_inputs:after_repair_value": parseMoney(inputs["after_repair_value"] ?? inputs["arv"]),
    "loan_inputs:entity_name":        (inputs["entity_name"] as string | undefined) ?? "",

    "loan_selected:loan_amount":      parseMoney(selected["loan_amount"] ?? selected["loanAmount"]),
    "loan_selected:rate":             parsePct(selected["rate"] ?? selected["interestRate"]),
    "loan_selected:ltv":              parsePct(selected["ltv"] ?? selected["LTV"]),
  }
}

// ─── Deal-based merge tag resolution ────────────────────────────────────────

/**
 * Normalise an input_code (generated from label, e.g. "borrower_id_ineqgy")
 * into a canonical column name by stripping the random suffix.
 * Only strips short suffixes (4-8 chars) that are ALL lowercase alphanumeric
 * AND don't look like common meaningful words.
 */
function canonicalCode(code: string): string {
  const m = code.match(/^(.+)_([a-z0-9]{4,8})$/)
  if (!m) return code
  const suffix = m[2]
  const MEANINGFUL = new Set([
    "name", "type", "date", "rate", "code", "text", "bool",
    "price", "total", "count", "label", "value", "phone",
    "email", "state", "city", "term", "path", "file",
    "address", "company", "period", "amount", "number",
    "initial", "capital", "repair", "source",
    "locked", "carrier", "purpose", "buyer", "cost",
    "structure", "completed", "explanation",
  ])
  if (MEANINGFUL.has(suffix)) return code
  return m[1]
}

/**
 * Map from canonical input_code → merge tag name.
 * Covers deal inputs that map to existing merge tags.
 *
 * Any deal input whose canonical code is NOT in this map will be emitted
 * as "deal_inputs:{canonical_code}" automatically (see fallback below).
 */
const INPUT_CODE_TO_TAG: Record<string, string> = {
  // Property / address
  property_street:         "property:street",
  property_address:        "property:street",
  address_street:          "property:street",
  street_address:          "property:street",
  property_city:           "property:city",
  address_city:            "property:city",
  property_state:          "property:state",
  address_state:           "property:state",
  property_zip:            "property:zip",
  address_zip:             "property:zip",
  property_county:         "property:county",
  address_county:          "property:county",

  // Loan-like inputs stored as deal inputs
  loan_type:               "loan_inputs:loan_type",
  project_type:            "loan_inputs:loan_type",
  deal_type:               "loan_inputs:loan_type",
  transaction_type:        "loan_inputs:transaction_type",
  closing_date:            "loan_inputs:closing_date",
  target_closing_date:     "loan_inputs:closing_date",
  purchase_price:          "loan_inputs:purchase_price",
  after_repair_value:      "loan_inputs:after_repair_value",
  arv:                     "loan_inputs:after_repair_value",
  entity_name:             "loan_inputs:entity_name",
  borrowing_entity:        "loan_inputs:entity_name",

  // Loan selected / computed
  loan_amount:             "loan_selected:loan_amount",
  loan_amount_total:       "loan_selected:loan_amount",
  loan_amount_initial:     "loan_selected:loan_amount",
  interest_rate:           "loan_selected:rate",
  rate:                    "loan_selected:rate",
  note_rate:               "loan_selected:rate",
  ltv:                     "loan_selected:ltv",
  ltv_as_is:               "loan_selected:ltv",

  // Borrower-like fields stored as deal inputs
  guarantor_name:          "borrowers:full_name",
  guarantor_fico:          "borrowers:fico_score",
  mid_fico:                "borrowers:fico_score",
}

type DealInputRow = {
  input_id: number
  input_type: string
  value_text: string | null
  value_numeric: number | null
  value_date: string | null
  value_bool: boolean | null
  linked_record_id: string | null
  input_code: string | null
  linked_table: string | null
}

function readDealInputValue(row: DealInputRow): string {
  switch (row.input_type) {
    case "currency":
      return parseMoney(row.value_numeric)
    case "percentage":
      return parsePct(row.value_numeric)
    case "number":
      return row.value_numeric != null ? String(row.value_numeric) : ""
    case "date":
      return fmtDate(row.value_date)
    case "boolean":
      return row.value_bool != null ? String(row.value_bool) : ""
    default:
      return row.value_text ?? ""
  }
}

/**
 * Given a dealId, fetch deal data (deal_inputs, linked borrower, org)
 * and return a flat merge-tag map.
 *
 * This is the deal-system counterpart of resolveMergeValues (which is
 * loan/scenario-based). Both return the same MergeValues shape so they
 * can be used interchangeably by the template renderer and send-email route.
 */
export async function resolveDealMergeValues(dealId: string): Promise<MergeValues> {
  // Step 1: Fetch deal + deal_inputs with input definitions
  const [{ data: deal, error: dealErr }, { data: diRows, error: diErr }] = await Promise.all([
    supabaseAdmin
      .from("deals")
      .select("id, organization_id")
      .eq("id", dealId)
      .single(),
    supabaseAdmin
      .from("deal_inputs")
      .select("input_id, input_type, value_text, value_numeric, value_date, value_bool, linked_record_id, inputs(input_code, linked_table)")
      .eq("deal_id", dealId),
  ])

  if (dealErr) console.error("[resolveDealMerge] deal fetch error:", dealErr.message)
  if (diErr) console.error("[resolveDealMerge] deal_inputs fetch error:", diErr.message)

  if (!deal) return {}

  // Flatten the joined inputs metadata
  const rows: DealInputRow[] = (diRows ?? []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputMeta = (r as any).inputs as { input_code: string | null; linked_table: string | null } | null
    return {
      input_id: r.input_id as number,
      input_type: r.input_type as string,
      value_text: r.value_text as string | null,
      value_numeric: r.value_numeric as number | null,
      value_date: r.value_date as string | null,
      value_bool: r.value_bool as boolean | null,
      linked_record_id: r.linked_record_id as string | null,
      input_code: inputMeta?.input_code ?? null,
      linked_table: inputMeta?.linked_table ?? null,
    }
  })

  // Step 2: Find borrower linked record (if any input links to "borrowers")
  const borrowerLinkedRow = rows.find((r) => r.linked_table === "borrowers" && r.linked_record_id)
  const borrowerTextRow = !borrowerLinkedRow
    ? rows.find((r) => r.linked_table === "borrowers" && r.value_text)
    : null

  const borrowerPromise = borrowerLinkedRow
    ? supabaseAdmin
        .from("borrowers")
        .select(
          "display_id, first_name, last_name, email, primary_phone, alt_phone, " +
          "fico_score, date_of_birth, citizenship, " +
          "address_line1, address_line2, city, state, zip, county"
        )
        .eq("id", borrowerLinkedRow.linked_record_id!)
        .single()
    : Promise.resolve({ data: null })

  const orgPromise = supabaseAdmin
    .from("organizations")
    .select("name, clerk_organization_id")
    .eq("id", deal.organization_id as string)
    .single()

  const [borrowerResult, orgResult] = await Promise.all([borrowerPromise, orgPromise])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const borrowerData = borrowerResult.data as Record<string, unknown> | null
  const values: MergeValues = {
    ...buildBorrowerValues(borrowerData),
    ...buildOrgValues(orgResult.data as Record<string, unknown> | null),
  }

  // If no linked borrower record but we have a name from the deal input, use it
  if (!borrowerData && borrowerTextRow?.value_text) {
    values["borrowers:full_name"] = borrowerTextRow.value_text
  }

  // Step 3: Map deal_inputs → merge tags via input_code
  const propertyParts: Record<string, string> = {}

  for (const row of rows) {
    if (!row.input_code) continue
    const raw = row.input_code
    const canon = canonicalCode(raw)
    const val = readDealInputValue(row)
    if (!val) continue

    // Try raw code first, then canonical (handles random-suffix codes)
    const tagName = INPUT_CODE_TO_TAG[raw] ?? INPUT_CODE_TO_TAG[canon]
    if (tagName) {
      values[tagName] = val
      if (tagName.startsWith("property:")) {
        propertyParts[tagName] = val
      }
    }

    // Always emit as deal_inputs:{code} so every deal input is reachable
    values[`deal_inputs:${raw}`] = val
    if (canon !== raw) values[`deal_inputs:${canon}`] = val
  }

  // Build property:full_address from resolved parts
  if (Object.keys(propertyParts).length > 0) {
    const street = propertyParts["property:street"] ?? ""
    const city = propertyParts["property:city"] ?? ""
    const state = propertyParts["property:state"] ?? ""
    const zip = propertyParts["property:zip"] ?? ""
    const stateZip = state && zip ? `${state} ${zip}` : (state || zip)
    values["property:full_address"] = [street, city, stateZip].filter(Boolean).join(", ")
  }

  return values
}
