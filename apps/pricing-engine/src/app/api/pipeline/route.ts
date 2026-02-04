import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getPipelineLoansForOrg } from "@/app/(pricing-engine)/scenarios/data/fetch-loans"

type DealRow = {
  id: string
  deal_name: string | null
  deal_stage_2: string | null
  loan_amount_total: number | null
  funding_date: string | null
  project_type: string | null
  property_id: number | null
  loan_number: string | null
  deal_guarantors?: Array<{
    guarantor_id: number
    is_primary: boolean | null
    guarantor?: { id: number; name: string | null } | null
  }>
}

export async function GET(req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    const { searchParams } = new URL(req.url)
    const view = searchParams.get("view")

    const isMissingTableError = (message?: string) =>
      Boolean(message && message.toLowerCase().includes("does not exist"))
    const isMissingColumnError = (message?: string) =>
      Boolean(message && message.toLowerCase().includes("column") && message.toLowerCase().includes("does not exist"))

    if (view === "deals") {
      if (!userId) {
        return NextResponse.json({ deals: [] }, { status: 401 })
      }

      const { data: userRow, error: userErr } = await supabaseAdmin
        .from("users")
        .select("id, is_internal_yn")
        .eq("clerk_user_id", userId)
        .maybeSingle()

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
            .from("deal_document_participants")
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

        const orgIds = (orgRes.data ?? [])
          .map((row) => row.organization_id)
          .filter(Boolean) as string[]

        let orgDealIds: string[] = []
        if (orgIds.length > 0) {
          const { data: orgDeals, error: orgDealsErr } = await supabaseAdmin
            .from("deals_clerk_orgs")
            .select("deal_id")
            .in("clerk_org_id", orgIds)
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

      const dealsQuery = supabaseAdmin
        .from("deal")
        .select(
          `
          id,
          deal_name,
          deal_stage_2,
          loan_amount_total,
          funding_date,
          project_type,
          property_id,
          loan_number,
          deal_guarantors(
            guarantor_id,
            is_primary,
            guarantor:guarantor_id(id, name)
          )
        `
        )
        .order("created_at", { ascending: false })

      const { data: deals, error: dealsErr } = isInternal
        ? await dealsQuery
        : dealIds.length > 0
          ? await dealsQuery.in("id", dealIds)
          : { data: [], error: null }

      if (dealsErr) {
        const message = (dealsErr as { message?: string })?.message ?? ""
        const missingDealTable = isMissingTableError(message)
        const isRelationError =
          message.toLowerCase().includes("relationship") ||
          message.toLowerCase().includes("schema cache") ||
          message.toLowerCase().includes("deal_guarantors")

        if (!missingDealTable && !isRelationError) {
          return NextResponse.json({ error: message || "Failed to fetch deals" }, { status: 500 })
        }

        if (missingDealTable) {
          const fallbackQuery = supabaseAdmin
            .from("deals")
            .select(
              `
              id,
              property_address,
              loan_amount,
              status,
              transaction_type,
              loan_type,
              borrower_first_name,
              borrower_last_name,
              created_at,
              updated_at
            `
            )
            .order("created_at", { ascending: false })

          const { data: fallbackDeals, error: fallbackErr } = isInternal
            ? await fallbackQuery
            : dealIds.length > 0
              ? await fallbackQuery.in("id", dealIds)
              : { data: [], error: null }

          if (fallbackErr) {
            const fallbackMessage = fallbackErr.message ?? ""
            if (isMissingColumnError(fallbackMessage) || isMissingTableError(fallbackMessage)) {
              return NextResponse.json({ deals: [] })
            }
            return NextResponse.json({ error: fallbackMessage }, { status: 500 })
          }

          const transformed = (fallbackDeals ?? []).map((deal) => {
            const borrowerName = [deal.borrower_first_name, deal.borrower_last_name]
              .filter(Boolean)
              .join(" ")
            return {
              id: deal.id,
              deal_name: borrowerName || deal.property_address || null,
              deal_stage_2: deal.status ?? null,
              loan_amount_total: deal.loan_amount ?? null,
              funding_date: deal.updated_at ?? deal.created_at ?? null,
              project_type: deal.transaction_type ?? deal.loan_type ?? null,
              property_address: deal.property_address ?? "No property",
              guarantor_name: borrowerName || "No guarantor",
              loan_number: deal.id ?? null,
            }
          })

          return NextResponse.json({ deals: transformed })
        }

        const simpleDealQuery = supabaseAdmin
          .from("deal")
          .select(
            `
            id,
            deal_name,
            deal_stage_2,
            loan_amount_total,
            funding_date,
            project_type,
            property_id,
            loan_number
          `
          )
          .order("created_at", { ascending: false })

        const { data: simpleDeals, error: simpleErr } = isInternal
          ? await simpleDealQuery
          : dealIds.length > 0
            ? await simpleDealQuery.in("id", dealIds)
            : { data: [], error: null }

        if (simpleErr) {
          const simpleMessage = simpleErr.message ?? ""
          if (isMissingColumnError(simpleMessage) || isMissingTableError(simpleMessage)) {
            return NextResponse.json({ deals: [] })
          }
          return NextResponse.json({ error: simpleMessage }, { status: 500 })
        }

        const dealRows = (simpleDeals ?? []) as DealRow[]
        const transformed = dealRows.map((deal) => ({
          id: deal.id,
          deal_name: deal.deal_name,
          deal_stage_2: deal.deal_stage_2,
          loan_amount_total: deal.loan_amount_total,
          funding_date: deal.funding_date,
          project_type: deal.project_type,
          property_address: deal.property_id ? `Property ID: ${deal.property_id}` : "No property",
          guarantor_name: "No guarantor",
          loan_number: deal.loan_number,
        }))

        return NextResponse.json({ deals: transformed })
      }

      const dealRows = (deals ?? []) as DealRow[]
      const propertyIds = dealRows
        .map((deal) => deal.property_id)
        .filter((id): id is number => typeof id === "number")

      let propertyMap: Record<number, string> = {}
      if (propertyIds.length > 0) {
        const { data: properties, error: propErr } = await supabaseAdmin
          .from("property")
          .select("id, address")
          .in("id", propertyIds)
        if (!propErr && properties) {
          propertyMap = properties.reduce(
            (acc: Record<number, string>, prop: { id: number; address: string | null }) => {
              if (prop.address) acc[prop.id] = prop.address
              return acc
            },
            {}
          )
        }
      }

      const transformed = dealRows.map((deal) => {
        const primaryGuarantor = deal.deal_guarantors?.find((dg) => dg.is_primary)
        const firstGuarantor = deal.deal_guarantors?.[0]
        const guarantorRecord = primaryGuarantor || firstGuarantor
        const guarantorName = guarantorRecord?.guarantor?.name || "No guarantor"

        return {
          id: deal.id,
          deal_name: deal.deal_name,
          deal_stage_2: deal.deal_stage_2,
          loan_amount_total: deal.loan_amount_total,
          funding_date: deal.funding_date,
          project_type: deal.project_type,
          property_address: deal.property_id
            ? propertyMap[deal.property_id] || `Property ID: ${deal.property_id}`
            : "No property",
          guarantor_name: guarantorName,
          loan_number: deal.loan_number,
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
