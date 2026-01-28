import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { getEntitiesForOrg } from "@/app/(dashboard)/applicants/data/fetch-entities"

export async function GET() {
  try {
    const { orgId, userId } = await auth()

    if (!orgId || !userId) {
      return NextResponse.json({ items: [], ownersMap: {} })
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
