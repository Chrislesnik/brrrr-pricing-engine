import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import {
  getExternalOrganizations,
  syncExternalOrgMembersFromClerk,
} from "@/app/(pricing-engine)/contacts/data/fetch-broker-companies"

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

    // JIT bulk sync: pull all external orgs' members from Clerk into Supabase
    await syncExternalOrgMembersFromClerk()

    const { organizations, membersMap } = await getExternalOrganizations()
    return NextResponse.json({ items: organizations, membersMap })
  } catch (error) {
    console.error("Broker organizations list API error:", error)
    return NextResponse.json(
      { items: [], membersMap: {}, error: "Failed to fetch broker organizations" },
      { status: 500 }
    )
  }
}
