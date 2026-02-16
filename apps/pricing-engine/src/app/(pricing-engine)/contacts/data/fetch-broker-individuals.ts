import { clerkClient } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export type BrokerIndividualRow = {
	id: string
	user_id: string | null
	first_name: string | null
	last_name: string | null
	clerk_org_role: string
	clerk_member_role: string | null
	org_count: number
	created_at: string
}

export type MemberOrgRow = {
	id: string
	name: string
	slug: string | null
	member_count: number
	created_at: string
}

/**
 * Fetches all organization_members across external organizations
 * (is_internal_yn = false) and groups their linked organizations
 * as sub-items for expanded rows.
 */
export async function getExternalOrgMembers(): Promise<{
	individuals: BrokerIndividualRow[]
	orgsMap: Record<string, MemberOrgRow[]>
}> {
	// Get all external org IDs first
	const { data: extOrgs, error: extErr } = await supabaseAdmin
		.from("organizations")
		.select("id, name, slug, created_at")
		.eq("is_internal_yn", false)

	if (extErr || !extOrgs?.length) {
		if (extErr) console.error("getExternalOrgMembers orgs error:", extErr.message)
		return { individuals: [], orgsMap: {} }
	}

	const extOrgIds = extOrgs.map((o) => o.id as string)

	// Fetch all members belonging to those external orgs
	const { data: allMembers, error: memErr } = await supabaseAdmin
		.from("organization_members")
		.select(
			"id, user_id, first_name, last_name, clerk_org_role, clerk_member_role, organization_id, created_at"
		)
		.in("organization_id", extOrgIds)
		.order("created_at", { ascending: false })

	if (memErr) {
		console.error("getExternalOrgMembers members error:", memErr.message)
		return { individuals: [], orgsMap: {} }
	}

	const members = allMembers ?? []

	// Build a lookup: org_id -> org details
	const orgById: Record<string, typeof extOrgs[number]> = {}
	for (const o of extOrgs) {
		orgById[o.id as string] = o
	}

	// Count members per org (for the sub-item member_count display)
	const memberCountByOrg: Record<string, number> = {}
	for (const m of members) {
		const oid = m.organization_id as string
		memberCountByOrg[oid] = (memberCountByOrg[oid] ?? 0) + 1
	}

	// Deduplicate members by user_id (a member may belong to multiple external orgs).
	// For each unique user, collect all their orgs as sub-items.
	const membersByUserId: Record<
		string,
		{
			member: (typeof members)[number]
			orgIds: Set<string>
		}
	> = {}

	for (const m of members) {
		const key = (m.user_id as string) ?? (m.id as string)
		if (!membersByUserId[key]) {
			membersByUserId[key] = { member: m, orgIds: new Set() }
		}
		membersByUserId[key].orgIds.add(m.organization_id as string)
	}

	const individuals: BrokerIndividualRow[] = []
	const orgsMap: Record<string, MemberOrgRow[]> = {}

	for (const [key, { member, orgIds }] of Object.entries(membersByUserId)) {
		const rowId = member.id as string

		individuals.push({
			id: rowId,
			user_id: (member.user_id as string) ?? null,
			first_name: (member.first_name as string) ?? null,
			last_name: (member.last_name as string) ?? null,
			clerk_org_role: (member.clerk_org_role as string) ?? "member",
			clerk_member_role: (member.clerk_member_role as string) ?? null,
			org_count: orgIds.size,
			created_at: member.created_at as string,
		})

		const orgRows: MemberOrgRow[] = []
		for (const oid of orgIds) {
			const org = orgById[oid]
			if (!org) continue
			orgRows.push({
				id: org.id as string,
				name: (org.name as string) ?? "Unnamed",
				slug: (org.slug as string) ?? null,
				member_count: memberCountByOrg[oid] ?? 0,
				created_at: org.created_at as string,
			})
		}
		orgsMap[rowId] = orgRows
	}

	return { individuals, orgsMap }
}

/**
 * JIT bulk sync for external org members (reuses the same logic).
 */
export async function syncExternalIndividualsFromClerk(): Promise<void> {
	try {
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
					`syncExternalIndividuals: failed for org ${supabaseOrgId}`,
					orgSyncErr
				)
			}
		}
	} catch (err) {
		console.error("syncExternalIndividualsFromClerk: unexpected error", err)
	}
}
