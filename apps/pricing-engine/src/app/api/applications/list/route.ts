import { NextResponse } from "next/server"
import { authForApiRoute, getOrgUuidFromClerkId } from "@/lib/orgs"
import { getApplicationsForOrg } from "@/app/(pricing-engine)/applications/data/fetch-applications"

export async function GET() {
  try {
    let userId: string, orgId: string
    try {
      ({ userId, orgId } = await authForApiRoute("loans", "read"))
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 401
      return NextResponse.json({ error: (e as Error).message }, { status })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ items: [] })
    }

    const data = await getApplicationsForOrg(orgUuid, userId)
    return NextResponse.json({ items: data })
  } catch (error) {
    console.error("Applications API error:", error)
    return NextResponse.json({ items: [], error: "Failed to fetch applications data" }, { status: 500 })
  }
}
