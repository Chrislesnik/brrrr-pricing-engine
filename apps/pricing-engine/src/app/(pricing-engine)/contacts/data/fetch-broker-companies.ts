import { supabaseAdmin } from "@/lib/supabase-admin"
import { syncAllExternalMembers } from "@/lib/sync-members"

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
 * JIT bulk sync: delegates to the shared syncAllExternalMembers() utility
 * which handles batch queries, role precedence, and pending invite roles.
 *
 * Call this before getExternalOrganizations() so the returned data
 * includes freshly synced member information.
 */
export async function syncExternalOrgMembersFromClerk(): Promise<void> {
	return syncAllExternalMembers()
}
