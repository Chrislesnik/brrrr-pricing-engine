import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import {
  getExternalOrganizations,
  syncExternalOrgMembersFromClerk,
} from "@/app/(pricing-engine)/contacts/data/fetch-broker-companies"

export async function GET() {
  try {
    const { orgId, orgRole, userId } = await auth()

    if (!orgId) {
      return NextResponse.json({ items: [], membersMap: {} })
    }

    if (orgRole === "org:broker" || orgRole === "broker") {
      return NextResponse.json(
        { items: [], membersMap: {}, error: "Forbidden" },
        { status: 403 }
      )
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)

    await syncExternalOrgMembersFromClerk()

    const { organizations, membersMap } = await getExternalOrganizations(
      orgUuid ?? undefined,
      userId ?? undefined
    )
    return NextResponse.json({ items: organizations, membersMap })
  } catch (error) {
    console.error("Broker organizations list API error:", error)
    return NextResponse.json(
      { items: [], membersMap: {}, error: "Failed to fetch broker organizations" },
      { status: 500 }
    )
  }
}
