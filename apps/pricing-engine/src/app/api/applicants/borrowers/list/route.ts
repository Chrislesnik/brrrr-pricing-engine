import { NextResponse } from "next/server"
import { authForApiRoute, getOrgUuidFromClerkId } from "@/lib/orgs"
import { getBorrowersForOrg } from "@/app/(pricing-engine)/contacts/data/fetch-borrowers"

export async function GET() {
  try {
    let userId: string, orgId: string
    try {
      ({ userId, orgId } = await authForApiRoute("borrowers", "read"))
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 401
      return NextResponse.json({ error: (e as Error).message }, { status })
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
