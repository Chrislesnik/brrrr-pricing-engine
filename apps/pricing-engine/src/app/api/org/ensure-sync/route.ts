import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { syncOrgMembers } from "@/lib/sync-members"

/**
 * Just-in-time sync: ensures the current Clerk organization AND all of its
 * members exist in the Supabase `organizations` and `organization_members`
 * tables.
 *
 * This handles:
 *  - Local development where Clerk webhooks can't reach localhost
 *  - Race conditions where the user navigates before the webhook fires
 *  - Any webhook delivery failures
 */
export async function POST() {
  try {
    const { orgId, userId } = await auth()

    if (!orgId || !userId) {
      return NextResponse.json({ synced: false, reason: "No active organization" })
    }

    const clerk = await clerkClient()

    // Fetch the full organization from Clerk
    let clerkOrg
    try {
      clerkOrg = await clerk.organizations.getOrganization({ organizationId: orgId })
    } catch (err) {
      console.error("ensure-sync: failed to fetch Clerk org", err)
      return NextResponse.json(
        { synced: false, reason: "Failed to fetch organization from Clerk" },
        { status: 500 }
      )
    }

    // Upsert the organization into Supabase
    const { data: orgRow, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .upsert(
        {
          clerk_organization_id: clerkOrg.id,
          name: clerkOrg.name,
          slug: clerkOrg.slug ?? null,
        },
        { onConflict: "clerk_organization_id" }
      )
      .select("id")
      .single()

    if (orgErr) {
      console.error("ensure-sync: org upsert error", orgErr.message)
      return NextResponse.json(
        { synced: false, reason: orgErr.message },
        { status: 500 }
      )
    }

    const orgUuid = orgRow?.id as string
    if (!orgUuid) {
      return NextResponse.json(
        { synced: false, reason: "No org UUID returned" },
        { status: 500 }
      )
    }

    // Sync all memberships using the shared utility (batch queries, role precedence)
    let syncedCount = 0
    try {
      syncedCount = await syncOrgMembers(orgId, orgUuid)
    } catch (err) {
      console.error("ensure-sync: failed to sync memberships", err)
    }

    return NextResponse.json({
      synced: true,
      orgId: orgUuid,
      membersSynced: syncedCount,
    })
  } catch (error) {
    console.error("ensure-sync: unexpected error", error)
    return NextResponse.json(
      { synced: false, reason: "Internal error" },
      { status: 500 }
    )
  }
}
