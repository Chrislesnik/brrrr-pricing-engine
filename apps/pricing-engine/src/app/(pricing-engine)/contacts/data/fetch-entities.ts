import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserRoleInOrg, isPrivilegedRole } from "@/lib/orgs"
import { EntityProfile } from "./types"

export type EntityOwner = {
	entity_id: string
	entity_owner_id: string | null
	name: string | null
	title: string | null
	member_type: string | null
	ownership_percent: number | null
	borrower_id: string | null
	entity_display_id: string | null
	entity_display_name: string | null
	borrower_display_id: string | null
}

export async function getEntitiesForOrg(organizationId: string, userId?: string): Promise<{
	entities: EntityProfile[]
	ownersMap: Record<string, EntityOwner[]>
}> {
	// If no user, return empty
	if (!userId) {
		return { entities: [], ownersMap: {} }
	}

	// Check user's role - admin/owner sees all entities
	const userRole = await getUserRoleInOrg(organizationId, userId)
	const hasFullAccess = isPrivilegedRole(userRole)

	// Get current user's org member UUID for filtering
	let currentUserOrgMemberId: string | undefined
	if (!hasFullAccess) {
		const { data: memberRow } = await supabaseAdmin
			.from("organization_members")
			.select("id")
			.eq("organization_id", organizationId)
			.eq("user_id", userId)
			.maybeSingle()
		currentUserOrgMemberId = memberRow?.id as string | undefined
	}

	const { data, error } = await supabaseAdmin
		.from("entities_view")
		.select("*")
		.eq("organization_id", organizationId)
		.order("created_at", { ascending: false })
	if (error) {
		console.error("getEntitiesForOrg error", {
			message: (error as any)?.message,
			code: (error as any)?.code,
			details: (error as any)?.details,
			hint: (error as any)?.hint,
		})
		return { entities: [], ownersMap: {} }
	}

	// Fetch role_assignments for entities to overlay names
	const allEntityIds = (data ?? []).map((e: any) => e.id as string)
	const { data: roleAssignmentsRaw } = await supabaseAdmin
		.from("role_assignments")
		.select("resource_id, user_id")
		.eq("resource_type", "entity")
		.in("resource_id", allEntityIds.length > 0 ? allEntityIds : ["__none__"])

	const entityToUserIds = new Map<string, Set<string>>()
	for (const ra of roleAssignmentsRaw ?? []) {
		const rid = ra.resource_id as string
		if (!entityToUserIds.has(rid)) entityToUserIds.set(rid, new Set())
		entityToUserIds.get(rid)!.add(ra.user_id as string)
	}

	// Resolve names for role_assignment user_ids
	const allRaUserIds = new Set<string>()
	for (const ra of roleAssignmentsRaw ?? []) allRaUserIds.add(ra.user_id as string)
	const userIdToName = new Map<string, string>()
	if (allRaUserIds.size > 0) {
		const { data: memberRows } = await supabaseAdmin
			.from("organization_members")
			.select("user_id, first_name, last_name")
			.in("user_id", [...allRaUserIds])
		for (const m of memberRows ?? []) {
			const full = [m.first_name, m.last_name].filter(Boolean).join(" ").trim()
			if (m.user_id) userIdToName.set(m.user_id as string, full || (m.user_id as string))
		}
	}

	// Filter entities based on role
	const filteredData = hasFullAccess
		? (data ?? [])
		: (data ?? []).filter((e: any) => {
				// Check role_assignments first
				const raIds = entityToUserIds.get(e.id as string)
				if (raIds && raIds.size > 0) {
					return raIds.has(userId) || (currentUserOrgMemberId != null && raIds.has(currentUserOrgMemberId))
				}
				const assigned = Array.isArray(e.assigned_to) ? (e.assigned_to as string[]) : []
				return assigned.includes(userId) || (currentUserOrgMemberId && assigned.includes(currentUserOrgMemberId))
		  })

	// Overlay role_assignment names
	const entities = filteredData.map((e: any) => {
		const raIds = entityToUserIds.get(e.id as string)
		if (raIds && raIds.size > 0) {
			return {
				...e,
				assigned_to: [...raIds],
				assigned_to_names: [...raIds].map((uid) => userIdToName.get(uid) ?? uid),
			}
		}
		return e
	}) as EntityProfile[]
	const entityIds = entities.map((e) => e.id)

	// Batch-fetch all owners for all entities
	const ownersMap: Record<string, EntityOwner[]> = {}
	if (entityIds.length > 0) {
		const { data: allOwners, error: ownersErr } = await supabaseAdmin
			.from("entity_owners")
			.select(`
				entity_id,
				entity_owner_id,
				name,
				title,
				member_type,
				ownership_percent,
				borrower_id,
				created_at
			`)
			.in("entity_id", entityIds)
			.order("created_at", { ascending: true })

		if (ownersErr) {
			console.error("getEntitiesForOrg owners error", ownersErr.message)
			return { entities, ownersMap: {} }
		}

		const owners = allOwners ?? []

		// Collect all entity_owner_ids and borrower_ids for enrichment
		const ownerEntityIds = owners
			.map((o: any) => o.entity_owner_id as string | null)
			.filter((v): v is string => typeof v === "string" && v.length > 0)
		const borrowerIds = owners
			.map((o: any) => o.borrower_id as string | null)
			.filter((v): v is string => typeof v === "string" && v.length > 0)

		// Fetch entity display info for linked entities
		let ownerEntityMap: Record<string, { display_id: string | null; entity_name: string | null }> = {}
		if (ownerEntityIds.length > 0) {
			const { data: entitiesData } = await supabaseAdmin
				.from("entities")
				.select("id, display_id, entity_name")
				.in("id", ownerEntityIds)
			ownerEntityMap = Object.fromEntries(
				(entitiesData ?? []).map((e) => [
					e.id as string,
					{ display_id: (e.display_id as string) ?? null, entity_name: (e.entity_name as string) ?? null },
				])
			)
		}

		// Fetch borrower display IDs
		let borrowerMap: Record<string, string> = {}
		if (borrowerIds.length > 0) {
			const { data: borrowers } = await supabaseAdmin
				.from("borrowers")
				.select("id, display_id")
				.in("id", borrowerIds)
			borrowerMap = Object.fromEntries((borrowers ?? []).map((b) => [b.id as string, (b.display_id as string) ?? ""]))
		}

		// Enrich owners and group by entity_id
		owners.forEach((o: any) => {
			const entityId = o.entity_id as string
			const ent = o.entity_owner_id ? ownerEntityMap[o.entity_owner_id] : null
			const enrichedOwner: EntityOwner = {
				entity_id: entityId,
				entity_owner_id: o.entity_owner_id ?? null,
				name: o.name ?? null,
				title: o.title ?? null,
				member_type: o.member_type ?? null,
				ownership_percent: o.ownership_percent ?? null,
				borrower_id: o.borrower_id ?? null,
				entity_display_id: ent?.display_id ?? null,
				entity_display_name: ent?.entity_name ?? null,
				borrower_display_id: o.borrower_id ? borrowerMap[o.borrower_id] ?? null : null,
			}
			if (!ownersMap[entityId]) {
				ownersMap[entityId] = []
			}
			ownersMap[entityId].push(enrichedOwner)
		})
	}

	return { entities, ownersMap }
}


