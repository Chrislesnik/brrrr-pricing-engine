import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

interface CreateApplicationBody {
  property_street?: string
  property_city?: string
  property_state?: string
  property_zip?: string
  borrower_type?: "individual" | "entity"
  entity_name?: string
  entity_type?: string
  ein?: string
  state_of_formation?: string
  first_name?: string
  last_name?: string
  borrower_email?: string
  guarantors?: Array<{ name: string; email: string }>
  loan_amount?: number
  loan_purpose?: string
  property_type?: string
  loan_term?: string
  interest_rate?: number
  ltv?: number
}

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization mapping not found" }, { status: 400 })
    }

    const body = (await req.json().catch(() => null)) as CreateApplicationBody | null
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // 1) Create a loan shell
    const { data: loan, error: loanErr } = await supabaseAdmin
      .from("loans")
      .insert({
        organization_id: orgUuid,
        primary_user_id: userId,
        status: "active",
      })
      .select("id")
      .single()

    if (loanErr || !loan) {
      return NextResponse.json(
        { error: `Failed to create loan: ${loanErr?.message}` },
        { status: 500 },
      )
    }

    const loanId = loan.id as string

    // 2) Create a primary loan_scenario (triggers application creation via DB trigger)
    const { error: scenErr } = await supabaseAdmin
      .from("loan_scenarios")
      .insert({
        loan_id: loanId,
        name: "Application",
        primary: true,
        created_by: userId,
        organization_id: orgUuid,
      })

    if (scenErr) {
      return NextResponse.json(
        { error: `Failed to create scenario: ${scenErr.message}` },
        { status: 500 },
      )
    }

    // 3) Build the borrower name
    let borrowerName: string | null = null
    if (body.borrower_type === "entity") {
      borrowerName = body.entity_name ?? null
    } else if (body.borrower_type === "individual") {
      borrowerName = [body.first_name, body.last_name].filter(Boolean).join(" ") || null
    }

    // 4) Update the application record with form data
    const guarantorNames = (body.guarantors ?? []).map((g) => g.name)
    const guarantorEmails = (body.guarantors ?? []).map((g) => g.email)

    const formData: Record<string, unknown> = {
      borrower_type: body.borrower_type,
      entity_type: body.entity_type,
      ein: body.ein,
      state_of_formation: body.state_of_formation,
      first_name: body.first_name,
      last_name: body.last_name,
      borrower_email: body.borrower_email,
      loan_amount: body.loan_amount,
      loan_purpose: body.loan_purpose,
      property_type: body.property_type,
      loan_term: body.loan_term,
      interest_rate: body.interest_rate,
      ltv: body.ltv,
    }

    const { error: appErr } = await supabaseAdmin
      .from("applications")
      .update({
        property_street: body.property_street ?? null,
        property_city: body.property_city ?? null,
        property_state: body.property_state ?? null,
        property_zip: body.property_zip ?? null,
        borrower_name: borrowerName,
        guarantor_names: guarantorNames.length > 0 ? guarantorNames : null,
        guarantor_emails: guarantorEmails.length > 0 ? guarantorEmails : null,
        status: "pending",
        form_data: formData,
      })
      .eq("loan_id", loanId)

    if (appErr) {
      console.error("Failed to update application:", appErr.message)
    }

    return NextResponse.json({ loanId })
  } catch (err) {
    console.error("Create application error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    )
  }
}
