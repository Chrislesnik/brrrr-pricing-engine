import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { getBorrowersForOrg } from "@/app/(pricing-engine)/contacts/data/fetch-borrowers"

export async function GET() {
  try {
    const { orgId, userId } = await auth()

    if (!orgId || !userId) {
      return NextResponse.json({ items: [] })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ items: [] })
    }

    const data = await getBorrowersForOrg(orgUuid, userId)
    return NextResponse.json({ items: data })
  } catch (error) {
    console.error("Borrowers list API error:", error)
    return NextResponse.json({ items: [], error: "Failed to fetch borrowers data" }, { status: 500 })
  }
}
