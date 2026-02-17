import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { checkFeatureAccess } from "@/lib/orgs"
import {
  getExternalOrganizations,
  syncExternalOrgMembersFromClerk,
} from "@/app/(pricing-engine)/contacts/data/fetch-broker-companies"

export async function GET() {
  try {
    const { orgId } = await auth()

    if (!orgId) {
      return NextResponse.json({ items: [], membersMap: {}, isActiveOrgInternal: false })
    }

    // Policy-engine check: replaces hardcoded org:broker deny
    const canView = await checkFeatureAccess("organization_invitations", "view")
    if (!canView) {
      return NextResponse.json(
        { items: [], membersMap: {}, isActiveOrgInternal: false, error: "Forbidden" },
        { status: 403 }
      )
    }

    // Determine whether the caller's active org is internal, and resolve its Supabase UUID
    const { data: activeOrgRow } = await supabaseAdmin
      .from("organizations")
      .select("id, is_internal_yn")
      .eq("clerk_organization_id", orgId)
      .single()
    const isActiveOrgInternal = activeOrgRow?.is_internal_yn === true
    const activeOrgSupabaseId = (activeOrgRow?.id as string) ?? null

    // JIT bulk sync: pull all external orgs' members from Clerk into Supabase
    await syncExternalOrgMembersFromClerk()

    const { organizations, membersMap } = await getExternalOrganizations()
    return NextResponse.json({ items: organizations, membersMap, isActiveOrgInternal, activeOrgSupabaseId })
  } catch (error) {
    console.error("Broker organizations list API error:", error)
    return NextResponse.json(
      { items: [], membersMap: {}, isActiveOrgInternal: false, error: "Failed to fetch broker organizations" },
      { status: 500 }
    )
  }
}
