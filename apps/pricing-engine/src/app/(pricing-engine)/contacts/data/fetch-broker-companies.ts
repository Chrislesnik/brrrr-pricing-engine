import { clerkClient } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export type BrokerOrgRow = {
	id: string
	name: string
	slug: string | null
	member_count: number
	created_at: string
}

export type OrgMemberRow = {
	id: string
	user_id: string | null
	first_name: string | null
	last_name: string | null
	clerk_org_role: string
	clerk_member_role: string | null
	created_at: string
}

/**
 * Fetches all external organizations (is_internal_yn = false) and
 * pre-loads their member counts + members for the expanded rows.
 */
export async function getExternalOrganizations(): Promise<{
	organizations: BrokerOrgRow[]
	membersMap: Record<string, OrgMemberRow[]>
}> {
	// Fetch all external organizations
	const { data: orgs, error } = await supabaseAdmin
		.from("organizations")
		.select("id, name, slug, created_at")
		.eq("is_internal_yn", false)
		.order("created_at", { ascending: false })

	if (error) {
		console.error("getExternalOrganizations error:", error.message)
		return { organizations: [], membersMap: {} }
	}

	const rows = orgs ?? []
	if (rows.length === 0) return { organizations: [], membersMap: {} }

	const orgIds = rows.map((o) => o.id as string)

	// Batch-fetch all members for these organizations
	const { data: allMembers, error: membersErr } = await supabaseAdmin
		.from("organization_members")
		.select(
			"id, user_id, first_name, last_name, clerk_org_role, clerk_member_role, organization_id, created_at"
		)
		.in("organization_id", orgIds)
		.order("created_at", { ascending: true })

	if (membersErr) {
		console.error(
			"getExternalOrganizations members error:",
			membersErr.message
		)
	}

	// Group members by organization_id
	const membersMap: Record<string, OrgMemberRow[]> = {}
	for (const m of allMembers ?? []) {
		const orgId = m.organization_id as string
		if (!membersMap[orgId]) membersMap[orgId] = []
		membersMap[orgId].push({
			id: m.id as string,
			user_id: (m.user_id as string) ?? null,
			first_name: (m.first_name as string) ?? null,
			last_name: (m.last_name as string) ?? null,
			clerk_org_role: (m.clerk_org_role as string) ?? "member",
			clerk_member_role: (m.clerk_member_role as string) ?? null,
			created_at: m.created_at as string,
		})
	}

	// Build organization rows with member counts
	const organizations: BrokerOrgRow[] = rows.map((o) => ({
		id: o.id as string,
		name: (o.name as string) ?? "Unnamed",
		slug: (o.slug as string) ?? null,
		member_count: (membersMap[o.id as string] ?? []).length,
		created_at: o.created_at as string,
	}))

	return { organizations, membersMap }
}

/**
 * JIT bulk sync: fetches all members from Clerk for every external
 * organization that has a clerk_organization_id, and upserts them
 * into the Supabase organization_members table.
 *
 * Call this before getExternalOrganizations() so the returned data
 * includes freshly synced member information.
 */
export async function syncExternalOrgMembersFromClerk(): Promise<void> {
	try {
		// Get all external orgs that have a Clerk org ID
		const { data: orgs, error } = await supabaseAdmin
			.from("organizations")
			.select("id, clerk_organization_id")
			.eq("is_internal_yn", false)
			.not("clerk_organization_id", "is", null)

		if (error || !orgs?.length) return

		const clerk = await clerkClient()

		for (const org of orgs) {
			const clerkOrgId = org.clerk_organization_id as string
			const supabaseOrgId = org.id as string
			if (!clerkOrgId) continue

			try {
				let offset = 0
				const limit = 100
				let hasMore = true

				while (hasMore) {
					const page =
						await clerk.organizations.getOrganizationMembershipList({
							organizationId: clerkOrgId,
							limit,
							offset,
						})
					const items = page.data ?? []

					for (const m of items) {
						const memUserId = m.publicUserData?.userId
						if (!memUserId) continue

						const clerkRole = m.role ?? "member"
						const memberRole =
							typeof (m.publicMetadata as Record<string, unknown>)
								?.org_member_role === "string"
								? ((m.publicMetadata as Record<string, unknown>)
										.org_member_role as string)
								: clerkRole

						await supabaseAdmin
							.from("organization_members")
							.upsert(
								{
									organization_id: supabaseOrgId,
									user_id: memUserId,
									clerk_org_role: clerkRole,
									clerk_member_role: memberRole,
									first_name:
										m.publicUserData?.firstName ?? null,
									last_name:
										m.publicUserData?.lastName ?? null,
								},
								{ onConflict: "organization_id,user_id" }
							)
					}

					hasMore = items.length === limit
					offset += limit
				}
			} catch (orgSyncErr) {
				console.error(
					`syncExternalOrgMembers: failed for org ${supabaseOrgId}`,
					orgSyncErr
				)
			}
		}
	} catch (err) {
		console.error("syncExternalOrgMembersFromClerk: unexpected error", err)
	}
}
