import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import {
  getExternalOrgMembers,
  syncExternalIndividualsFromClerk,
} from "@/app/(pricing-engine)/contacts/data/fetch-broker-individuals"

export async function GET() {
  try {
    const { orgId, orgRole } = await auth()

    if (!orgId) {
      return NextResponse.json({ items: [], orgsMap: {} })
    }

    if (orgRole === "org:broker" || orgRole === "broker") {
      return NextResponse.json(
        { items: [], orgsMap: {}, error: "Forbidden" },
        { status: 403 }
      )
    }

    // JIT bulk sync from Clerk
    await syncExternalIndividualsFromClerk()

    const { individuals, orgsMap } = await getExternalOrgMembers()
    return NextResponse.json({ items: individuals, orgsMap })
  } catch (error) {
    console.error("Broker individuals list API error:", error)
    return NextResponse.json(
      { items: [], orgsMap: {}, error: "Failed to fetch broker individuals" },
      { status: 500 }
    )
  }
}
