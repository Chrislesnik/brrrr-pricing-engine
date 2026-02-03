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

	// Filter entities based on role
	const filteredData = hasFullAccess
		? (data ?? [])
		: (data ?? []).filter((e: any) => {
				const assigned = Array.isArray(e.assigned_to) ? (e.assigned_to as string[]) : []
				return assigned.includes(userId) || (currentUserOrgMemberId && assigned.includes(currentUserOrgMemberId))
		  })

	const entities = filteredData as EntityProfile[]
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


