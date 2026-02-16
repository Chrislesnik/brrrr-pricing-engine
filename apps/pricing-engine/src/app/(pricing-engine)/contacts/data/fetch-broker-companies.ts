import { supabaseAdmin } from "@/lib/supabase-admin"

export type BrokerCompanyRow = {
	id: string
	company_name: string
	company_logo_url: string | null
	organization_id: string
	broker_count: number
	active_count: number
	pending_count: number
	inactive_count: number
	emails: string[]
	created_at: string
}

export type OrgMemberRow = {
	id: string
	first_name: string | null
	last_name: string | null
	clerk_org_role: string
	clerk_member_role: string | null
	created_at: string
}

export async function getBrokerCompaniesForOrg(
	orgUuid: string
): Promise<{
	companies: BrokerCompanyRow[]
	membersMap: Record<string, OrgMemberRow[]>
}> {
	if (!orgUuid) return { companies: [], membersMap: {} }

	const { data: brokers, error } = await supabaseAdmin
		.from("brokers")
		.select(
			"id, company_name, company_logo_url, organization_id, status, created_at, email"
		)
		.eq("organization_id", orgUuid)
		.order("created_at", { ascending: false })

	if (error) {
		console.error("getBrokerCompaniesForOrg error:", error.message)
		return { companies: [], membersMap: {} }
	}

	const rows = brokers ?? []
	if (rows.length === 0) return { companies: [], membersMap: {} }

	// Group brokers by company_name
	const companyMap = new Map<
		string,
		{
			firstId: string
			company_name: string
			company_logo_url: string | null
			organization_id: string
			broker_count: number
			active_count: number
			pending_count: number
			inactive_count: number
			emails: string[]
			created_at: string
		}
	>()

	for (const b of rows) {
		const name = ((b.company_name as string) ?? "").trim() || "Unknown Company"
		const existing = companyMap.get(name)
		const status = ((b.status as string) ?? "pending").toLowerCase()

		if (!existing) {
			companyMap.set(name, {
				firstId: b.id as string,
				company_name: name,
				company_logo_url: (b.company_logo_url as string) ?? null,
				organization_id: b.organization_id as string,
				broker_count: 1,
				active_count: status === "active" ? 1 : 0,
				pending_count: status === "pending" ? 1 : 0,
				inactive_count: status === "inactive" ? 1 : 0,
				emails: b.email ? [b.email as string] : [],
				created_at: b.created_at as string,
			})
		} else {
			existing.broker_count++
			if (status === "active") existing.active_count++
			else if (status === "pending") existing.pending_count++
			else if (status === "inactive") existing.inactive_count++
			if (b.email) existing.emails.push(b.email as string)
			// Keep the earliest created_at
			if ((b.created_at as string) < existing.created_at) {
				existing.created_at = b.created_at as string
			}
		}
	}

	const companies: BrokerCompanyRow[] = Array.from(companyMap.values()).map(
		(c) => ({
			id: c.firstId,
			company_name: c.company_name,
			company_logo_url: c.company_logo_url,
			organization_id: c.organization_id,
			broker_count: c.broker_count,
			active_count: c.active_count,
			pending_count: c.pending_count,
			inactive_count: c.inactive_count,
			emails: [...new Set(c.emails)],
			created_at: c.created_at,
		})
	)

	// Fetch organization members for all unique organization_ids
	const orgIds = [...new Set(companies.map((c) => c.organization_id))]
	const membersMap: Record<string, OrgMemberRow[]> = {}

	if (orgIds.length > 0) {
		const { data: members, error: membersErr } = await supabaseAdmin
			.from("organization_members")
			.select(
				"id, first_name, last_name, clerk_org_role, clerk_member_role, organization_id, created_at"
			)
			.in("organization_id", orgIds)
			.order("created_at", { ascending: true })

		if (membersErr) {
			console.error(
				"getBrokerCompaniesForOrg members error:",
				membersErr.message
			)
		} else {
			for (const m of members ?? []) {
				const orgId = m.organization_id as string
				if (!membersMap[orgId]) membersMap[orgId] = []
				membersMap[orgId].push({
					id: m.id as string,
					first_name: (m.first_name as string) ?? null,
					last_name: (m.last_name as string) ?? null,
					clerk_org_role: (m.clerk_org_role as string) ?? "member",
					clerk_member_role: (m.clerk_member_role as string) ?? null,
					created_at: m.created_at as string,
				})
			}
		}
	}

	return { companies, membersMap }
}
