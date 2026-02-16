import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserRoleInOrg, isPrivilegedRole } from "@/lib/orgs"
import { Borrower } from "./types"

export async function getBorrowersForOrg(organizationId: string, userId?: string) {
	// If no user, return empty
	if (!userId) {
		return [] as Borrower[]
	}

	// Check user's role - admin/owner sees all borrowers
	const userRole = await getUserRoleInOrg(organizationId, userId)
	const hasFullAccess = isPrivilegedRole(userRole)

	// Fetch borrowers directly from the base table
	const { data: rows, error } = await supabaseAdmin
		.from("borrowers")
		.select(
			"id, display_id, first_name, last_name, email, primary_phone, alt_phone, date_of_birth, fico_score, assigned_to, organization_id, created_at, updated_at"
		)
		.eq("organization_id", organizationId)
		.order("created_at", { ascending: false })
	if (error) {
		console.error("getBorrowersForOrg error", {
			message: (error as any)?.message,
			code: (error as any)?.code,
			details: (error as any)?.details,
			hint: (error as any)?.hint,
		})
		return [] as Borrower[]
	}

	// Fetch role_assignments for these borrowers
	const borrowerIds = (rows ?? []).map((r: any) => r.id as string)
	const { data: roleAssignmentsRaw } = await supabaseAdmin
		.from("role_assignments")
		.select("resource_id, user_id")
		.eq("resource_type", "borrower")
		.in("resource_id", borrowerIds.length > 0 ? borrowerIds : ["__none__"])

	const borrowerToUserIds = new Map<string, Set<string>>()
	for (const ra of roleAssignmentsRaw ?? []) {
		const rid = ra.resource_id as string
		if (!borrowerToUserIds.has(rid)) borrowerToUserIds.set(rid, new Set())
		borrowerToUserIds.get(rid)!.add(ra.user_id as string)
	}

	// Resolve assigned_to user IDs to names from organization_members
	const { data: members } = await supabaseAdmin
		.from("organization_members")
		.select("id, user_id, first_name, last_name")
		.eq("organization_id", organizationId)

	const idToName = new Map<string, string>()
	let currentUserOrgMemberId: string | undefined

	for (const m of members ?? []) {
		const full = [m.first_name, m.last_name].filter(Boolean).join(" ").trim()
		const display = full || (m.user_id as string) || (m.id as string)
		if (m.user_id) idToName.set(m.user_id as string, display)
		if (m.id) idToName.set(m.id as string, display)
		if (m.user_id === userId) {
			currentUserOrgMemberId = m.id as string
		}
	}

	// Filter rows based on role
	const filteredRows = hasFullAccess
		? (rows ?? [])
		: (rows ?? []).filter((r: any) => {
				// Check role_assignments first, fallback to legacy
				const raIds = borrowerToUserIds.get(r.id as string)
				if (raIds && raIds.size > 0) {
					return raIds.has(userId) || (currentUserOrgMemberId != null && raIds.has(currentUserOrgMemberId))
				}
				const assigned = Array.isArray(r.assigned_to) ? (r.assigned_to as string[]) : []
				return assigned.includes(userId) || (currentUserOrgMemberId && assigned.includes(currentUserOrgMemberId))
		  })

	const mapped: Borrower[] = filteredRows.map((r: any) => {
		// Prefer role_assignments, fallback to legacy
		const raIds = borrowerToUserIds.get(r.id as string)
		const assignedIds = raIds && raIds.size > 0
			? [...raIds]
			: (Array.isArray(r.assigned_to) ? (r.assigned_to as string[]) : [])
		const names = assignedIds.map((id) => idToName.get(id) ?? id)
		return {
			id: r.id,
			display_id: r.display_id ?? r.id,
			first_name: r.first_name,
			last_name: r.last_name,
			email: r.email ?? null,
			primary_phone: r.primary_phone ?? null,
			alt_phone: r.alt_phone ?? null,
			date_of_birth: r.date_of_birth ?? null,
			fico_score: r.fico_score ?? null,
			organization_id: r.organization_id,
			assigned_to: assignedIds,
			assigned_to_names: names,
			created_at: r.created_at,
			updated_at: r.updated_at,
		}
	})
	return mapped
}


