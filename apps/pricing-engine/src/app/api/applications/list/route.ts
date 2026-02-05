import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { getApplicationsForOrg } from "@/app/(pricing-engine)/applications/data/fetch-applications"

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

    const data = await getApplicationsForOrg(orgUuid, userId)
    return NextResponse.json({ items: data })
  } catch (error) {
    console.error("Applications API error:", error)
    return NextResponse.json({ items: [], error: "Failed to fetch applications data" }, { status: 500 })
  }
}
