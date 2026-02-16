import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { getBrokerCompaniesForOrg } from "@/app/(pricing-engine)/contacts/data/fetch-broker-companies"

export async function GET() {
  try {
    const { orgId, orgRole } = await auth()

    if (!orgId) {
      return NextResponse.json({ items: [], membersMap: {} })
    }

    // Block broker role from accessing this page
    if (orgRole === "org:broker" || orgRole === "broker") {
      return NextResponse.json(
        { items: [], membersMap: {}, error: "Forbidden" },
        { status: 403 }
      )
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ items: [], membersMap: {} })
    }

    const { companies, membersMap } = await getBrokerCompaniesForOrg(orgUuid)
    return NextResponse.json({ items: companies, membersMap })
  } catch (error) {
    console.error("Broker companies list API error:", error)
    return NextResponse.json(
      { items: [], membersMap: {}, error: "Failed to fetch broker companies" },
      { status: 500 }
    )
  }
}
