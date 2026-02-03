import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getPipelineLoansForOrg } from "@/app/(pricing-engine)/scenarios/data/fetch-loans"

export async function GET() {
  try {
    const { orgId, userId } = await auth()

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
