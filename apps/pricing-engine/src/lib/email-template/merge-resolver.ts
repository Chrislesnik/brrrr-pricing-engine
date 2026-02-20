import { supabaseAdmin } from "@/lib/supabase-admin"

export type MergeValues = Record<string, string>

/**
 * Given a loanId, fetch all deal data and return a flat map of
 * mergeTag name → resolved string value ready for template substitution.
 */
export async function resolveMergeValues(loanId: string): Promise<MergeValues> {
  // Fetch loan + primary scenario in parallel
  const [{ data: loan }, { data: scenario }] = await Promise.all([
    supabaseAdmin
      .from("loans")
      .select("id, display_id, loan_type, organization_id")
      .eq("id", loanId)
      .single(),
    supabaseAdmin
      .from("loan_scenarios")
      .select("inputs, selected")
      .eq("loan_id", loanId)
      .eq("primary", true)
      .limit(1)
      .maybeSingle(),
  ])

  if (!loan) return {}

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("name")
    .eq("id", loan.organization_id)
    .single()

  // loan_scenarios.inputs / selected hold all the deal-specific values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputs = (scenario?.inputs ?? {}) as Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selected = (scenario?.selected ?? {}) as Record<string, any>

  // ── Borrower ──────────────────────────────────────────────────────────────
  const borrowerName = (inputs["borrower_name"] as string | undefined) ?? ""
  const nameParts = borrowerName.trim().split(/\s+/).filter(Boolean)
  const firstName = nameParts[0] ?? ""
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

  // ── Property address (stored as inputs["address"] object) ─────────────────
  const addr = (inputs["address"] ?? {}) as {
    street?: string
    city?: string
    state?: string
    zip?: string
  }
  const fullAddress = [addr.street, addr.city, addr.state && addr.zip ? `${addr.state} ${addr.zip}` : (addr.state ?? addr.zip)]
    .filter(Boolean)
    .join(", ")

  // ── Loan financials (from selected scenario outputs) ──────────────────────
  function parseNum(v: unknown): number | undefined {
    const n = typeof v === "string" ? Number(String(v).replace(/[$,%]/g, "")) : (v as number | undefined)
    return Number.isFinite(n) ? n : undefined
  }

  const loanAmountNum = parseNum(selected["loan_amount"] ?? selected["loanAmount"])
  const loanAmountStr = loanAmountNum != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(loanAmountNum)
    : ""

  const rateNum = parseNum(selected["rate"] ?? selected["interestRate"])
  const rateStr = rateNum != null ? `${rateNum}%` : ""

  const ltvNum = parseNum(selected["ltv"] ?? selected["LTV"])
  const ltvStr = ltvNum != null ? `${ltvNum}%` : ""

  const closingDateRaw = (inputs["closing_date"] ?? selected["closing_date"]) as string | undefined
  const closingDateStr = closingDateRaw
    ? new Date(closingDateRaw).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : ""

  return {
    // Borrower
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    email: (inputs["borrower_email"] as string | undefined) ?? "",
    phone: (inputs["borrower_phone"] as string | undefined) ?? "",
    company: ((inputs["entity_name"] ?? inputs["borrower_company"]) as string | undefined) ?? "",
    // Loan
    loanId: (loan as { display_id?: string }).display_id ?? loan.id,
    loanAmount: loanAmountStr,
    loanType: ((inputs["loan_type"] ?? (loan as { loan_type?: string }).loan_type) as string | undefined) ?? "",
    interestRate: rateStr,
    ltv: ltvStr,
    closingDate: closingDateStr,
    // Property
    propertyAddress: fullAddress || (addr.street ?? ""),
    propertyCity: addr.city ?? "",
    propertyState: addr.state ?? "",
    // Organization
    lenderName: org?.name ?? "",
    lenderEmail: "",
    orgName: org?.name ?? "",
  }
}
