import { clerkClient } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * Strips the "org:" prefix from Clerk role strings so the database
 * always stores a consistent bare format ("admin", "owner", "member", "broker").
 */
export function bareRole(role: string): string {
  return role.replace(/^org:/, "")
}

type ClerkMembershipLike = {
  publicUserData?: {
    userId?: string
    firstName?: string | null
    lastName?: string | null
    identifier?: string
  } | null
  publicMetadata?: Record<string, unknown>
  role?: string
}

type MemberUpsertRow = {
  organization_id: string
  user_id: string
  clerk_org_role: string
  clerk_member_role: string
  first_name: string | null
  last_name: string | null
}

/**
 * Resolve the member role using precedence:
 *   1. pendingRole (from pending_invite_roles) — highest priority
 *   2. existingDbRole (from organization_members) — preserves manual edits
 *   3. clerkMetadataRole (from Clerk publicMetadata.org_member_role) — Clerk truth
 *   4. clerkOrgRole (from Clerk membership.role) — lowest priority fallback
 */
function resolveMemberRole(opts: {
  pendingRole: string | null
  existingDbRole: string | null
  clerkMetadataRole: string | null
  clerkOrgRole: string
}): string {
  return (
    opts.pendingRole ??
    opts.existingDbRole ??
    opts.clerkMetadataRole ??
    opts.clerkOrgRole
  )
}

/**
 * Batch-fetch existing member roles for an organization.
 * Returns a Map<userId, memberRole>.
 */
async function fetchExistingRoles(
  orgUuid: string,
): Promise<Map<string, string | null>> {
  const { data } = await supabaseAdmin
    .from("organization_members")
    .select("user_id, clerk_member_role")
    .eq("organization_id", orgUuid)

  const map = new Map<string, string | null>()
  for (const row of data ?? []) {
    if (row.user_id) {
      map.set(row.user_id as string, (row.clerk_member_role as string) ?? null)
    }
  }
  return map
}

/**
 * Batch-fetch all pending invite roles for an organization.
 * Returns a Map<lowerEmail, memberRole> and consumes (deletes) the rows.
 */
async function consumePendingRoles(
  orgUuid: string,
): Promise<Map<string, string>> {
  const { data } = await supabaseAdmin
    .from("pending_invite_roles")
    .delete()
    .eq("organization_id", orgUuid)
    .select("email, clerk_member_role")

  const map = new Map<string, string>()
  for (const row of data ?? []) {
    if (row.email && row.clerk_member_role) {
      map.set(
        (row.email as string).toLowerCase(),
        row.clerk_member_role as string,
      )
    }
  }
  return map
}

/**
 * Sync all Clerk members for a single organization into Supabase,
 * using role precedence and batch queries.
 *
 * @returns the number of members synced
 */
export async function syncOrgMembers(
  clerkOrgId: string,
  supabaseOrgId: string,
): Promise<number> {
  const clerk = await clerkClient()

  // Batch pre-fetch: existing roles + pending invite roles
  const [existingRoles, pendingRoles] = await Promise.all([
    fetchExistingRoles(supabaseOrgId),
    consumePendingRoles(supabaseOrgId),
  ])

  let totalSynced = 0
  let offset = 0
  const limit = 100
  let hasMore = true

  while (hasMore) {
    const page = await clerk.organizations.getOrganizationMembershipList({
      organizationId: clerkOrgId,
      limit,
      offset,
    })
    const items = (page.data ?? []) as ClerkMembershipLike[]
    const batch: MemberUpsertRow[] = []

    for (const m of items) {
      const memUserId = m.publicUserData?.userId
      if (!memUserId) continue

      const clerkOrgRole = bareRole(m.role ?? "member")

      const clerkMetadataRole =
        typeof m.publicMetadata?.org_member_role === "string"
          ? (m.publicMetadata.org_member_role as string)
          : null

      const memberEmail = (
        m.publicUserData?.identifier ?? ""
      ).toLowerCase()

      const memberRole = resolveMemberRole({
        pendingRole: memberEmail ? (pendingRoles.get(memberEmail) ?? null) : null,
        existingDbRole: existingRoles.get(memUserId) ?? null,
        clerkMetadataRole,
        clerkOrgRole,
      })

      batch.push({
        organization_id: supabaseOrgId,
        user_id: memUserId,
        clerk_org_role: clerkOrgRole,
        clerk_member_role: memberRole,
        first_name: m.publicUserData?.firstName ?? null,
        last_name: m.publicUserData?.lastName ?? null,
      })
    }

    // Batch upsert (chunks of 100)
    if (batch.length > 0) {
      const { error } = await supabaseAdmin
        .from("organization_members")
        .upsert(batch, { onConflict: "organization_id,user_id" })

      if (error) {
        console.error(
          `syncOrgMembers: batch upsert error for org ${supabaseOrgId}:`,
          error.message,
        )
      } else {
        totalSynced += batch.length
      }
    }

    hasMore = items.length === limit
    offset += limit
  }

  return totalSynced
}

/**
 * Sync all members for every external organization from Clerk.
 * Used by the broker companies and individuals pages.
 */
export async function syncAllExternalMembers(): Promise<void> {
  try {
    const { data: orgs, error } = await supabaseAdmin
      .from("organizations")
      .select("id, clerk_organization_id")
      .eq("is_internal_yn", false)
      .not("clerk_organization_id", "is", null)

    if (error || !orgs?.length) return

    for (const org of orgs) {
      const clerkOrgId = org.clerk_organization_id as string
      const supabaseOrgId = org.id as string
      if (!clerkOrgId) continue

      try {
        await syncOrgMembers(clerkOrgId, supabaseOrgId)
      } catch (orgSyncErr) {
        console.error(
          `syncAllExternalMembers: failed for org ${supabaseOrgId}`,
          orgSyncErr,
        )
      }
    }
  } catch (err) {
    console.error("syncAllExternalMembers: unexpected error", err)
  }
}
