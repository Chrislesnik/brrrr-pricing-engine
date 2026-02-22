import { supabaseAdmin } from "@/lib/supabase-admin"
import { syncAllExternalMembers } from "@/lib/sync-members"

export type BrokerOrgRow = {
	id: string
	name: string
	slug: string | null
	member_count: number
	created_at: string
	permissions: "default" | "custom"
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
 * Fetches external organizations (is_internal_yn = false), optionally
 * filtered to only those assigned to the given internal org member.
 * Also resolves a "permissions" badge per org (default vs custom).
 */
export async function getExternalOrganizations(
	internalOrgUuid?: string,
	currentUserId?: string
): Promise<{
	organizations: BrokerOrgRow[]
	membersMap: Record<string, OrgMemberRow[]>
}> {
	// Get assigned broker org IDs from role_assignments (source of truth)
	let assignedOrgIds: string[] | null = null
	if (currentUserId) {
		const { data: assignments } = await supabaseAdmin
			.from("role_assignments")
			.select("resource_id")
			.eq("resource_type", "broker_org")
			.eq("user_id", currentUserId)
		if (assignments && assignments.length > 0) {
			assignedOrgIds = assignments.map((a) => a.resource_id as string)
		}
	}

	// Fetch external organizations (filtered if assignments exist)
	let query = supabaseAdmin
		.from("organizations")
		.select("id, name, slug, created_at")
		.eq("is_internal_yn", false)
		.order("created_at", { ascending: false })

	if (assignedOrgIds !== null) {
		query = query.in("id", assignedOrgIds)
	}

	const { data: orgs, error } = await query

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
		const oid = m.organization_id as string
		if (!membersMap[oid]) membersMap[oid] = []
		membersMap[oid].push({
			id: m.id as string,
			user_id: (m.user_id as string) ?? null,
			first_name: (m.first_name as string) ?? null,
			last_name: (m.last_name as string) ?? null,
			clerk_org_role: (m.clerk_org_role as string) ?? "member",
			clerk_member_role: (m.clerk_member_role as string) ?? null,
			created_at: m.created_at as string,
		})
	}

	// Batch-fetch custom_broker_settings to determine permissions per org
	const customSettingsMap = new Map<string, boolean>()
	if (internalOrgUuid) {
		const { data: customRows } = await supabaseAdmin
			.from("custom_broker_settings")
			.select("broker_org_id, \"default\"")
			.eq("organization_id", internalOrgUuid)
			.in("broker_org_id", orgIds)
		for (const c of customRows ?? []) {
			const row = c as { broker_org_id: string; default?: boolean }
			customSettingsMap.set(
				row.broker_org_id,
				row.default === false
			)
		}
	}

	// Build organization rows
	const organizations: BrokerOrgRow[] = rows.map((o) => ({
		id: o.id as string,
		name: (o.name as string) ?? "Unnamed",
		slug: (o.slug as string) ?? null,
		member_count: (membersMap[o.id as string] ?? []).length,
		created_at: o.created_at as string,
		permissions: customSettingsMap.get(o.id as string) ? "custom" : "default",
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
