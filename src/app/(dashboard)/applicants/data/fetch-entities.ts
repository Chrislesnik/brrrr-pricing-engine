import { supabaseAdmin } from "@/lib/supabase-admin"
import { EntityProfile } from "./types"

export async function getEntitiesForOrg(organizationId: string) {
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
		return [] as EntityProfile[]
	}
	return (data ?? []) as EntityProfile[]
}


