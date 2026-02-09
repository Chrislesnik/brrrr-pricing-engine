import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getPipelineLoansForOrg } from "@/app/(pricing-engine)/scenarios/data/fetch-loans"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export async function GET(req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    const { searchParams } = new URL(req.url)
    const view = searchParams.get("view")

    if (view === "deals") {
      if (!userId || !orgId) {
        return NextResponse.json({ deals: [] }, { status: 401 })
      }

      // Get the organization UUID from Clerk org ID
      const organizationId = await getOrgUuidFromClerkId(orgId)
      if (!organizationId) {
        console.log("[Pipeline API] Organization not found for orgId:", orgId)
        return NextResponse.json({ deals: [] })
      }

      // Query deals filtered by organization_id
      // Using the actual deals table schema
      const { data: deals, error: dealsErr } = await supabaseAdmin
        .from("deals")
        .select(`
          id,
          organization_id,
          property_address,
          loan_amount,
          rate,
          status,
          loan_type,
          transaction_type,
          borrower_first_name,
          borrower_last_name,
          inputs,
          created_at,
          updated_at,
          assigned_to_user_id,
          primary_user_id
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })

      if (dealsErr) {
        console.error("[Pipeline API] Error fetching deals:", dealsErr)
        return NextResponse.json({ error: dealsErr.message }, { status: 500 })
      }

      // Transform the deals to match the expected format for the data table
      const transformed = (deals ?? []).map((deal) => {
        const inputs = (deal.inputs as Record<string, unknown>) || {}
        
        // Get borrower name from top-level or inputs
        const borrowerName = [deal.borrower_first_name, deal.borrower_last_name]
          .filter(Boolean)
          .join(" ") || (inputs.borrower_name as string) || null
        
        // Get loan number from inputs
        const loanNumber = (inputs.loan_number as string) || deal.id
        
        // Get deal name from inputs or construct from borrower/property
        const dealName = (inputs.deal_name as string) || borrowerName || deal.property_address || null
        
        // Get deal stage from inputs
        const dealStage = (inputs.deal_stage_2 as string) || (inputs.deal_stage_1 as string) || deal.status || null
        
        // Get loan amount from top-level or inputs
        const loanAmount = deal.loan_amount || (inputs.loan_amount_total as number) || (inputs.loan_amount_initial as number) || null
        
        // Get funding date from inputs
        const fundingDate = (inputs.funding_date as string) || deal.updated_at || deal.created_at || null
        
        // Get project type from inputs or top-level
        const projectType = (inputs.project_type as string) || (inputs.deal_type as string) || deal.transaction_type || deal.loan_type || null
        
        // Get property address
        const propertyAddress = deal.property_address || (inputs.property_address as string) || "No property"
        
        // Get guarantor name from inputs
        const guarantorName = (inputs.guarantor_name as string) || borrowerName || "No guarantor"

        return {
          id: deal.id,
          deal_name: dealName,
          deal_stage_2: dealStage,
          loan_amount_total: loanAmount,
          funding_date: fundingDate,
          project_type: projectType,
          property_address: propertyAddress,
          guarantor_name: guarantorName,
          loan_number: loanNumber,
        }
      })

      return NextResponse.json({ deals: transformed })
    }

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
