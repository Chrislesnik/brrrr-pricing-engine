import { NextResponse } from "next/server"
import { authForApiRoute, getOrgUuidFromClerkId } from "@/lib/orgs"
import { getEntitiesForOrg } from "@/app/(pricing-engine)/contacts/data/fetch-entities"

export async function GET() {
  try {
    let userId: string, orgId: string
    try {
      ({ userId, orgId } = await authForApiRoute("entities", "read"))
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 401
      return NextResponse.json({ error: (e as Error).message }, { status })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ items: [], ownersMap: {} })
    }

    const { entities, ownersMap } = await getEntitiesForOrg(orgUuid, userId)
    return NextResponse.json({ items: entities, ownersMap })
  } catch (error) {
    console.error("Entities list API error:", error)
    return NextResponse.json({ items: [], ownersMap: {}, error: "Failed to fetch entities data" }, { status: 500 })
  }
}
