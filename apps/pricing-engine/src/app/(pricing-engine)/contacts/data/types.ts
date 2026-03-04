export type Borrower = {
	id: string
	display_id: string
	first_name: string
	last_name: string
	email: string | null
	primary_phone: string | null
	alt_phone: string | null
	date_of_birth: string | null
	fico_score: number | null
	organization_id: string
	assigned_to: string[]
	assigned_to_names?: string[]
	created_at: string
	updated_at: string
}

export type EntityProfile = {
	id: string
	display_id: string
	entity_name: string
	entity_type: string | null
	ein: string | null
	date_formed: string | null
	organization_id: string
	assigned_to: string[]
	assigned_to_names?: string[]
	created_at: string
	updated_at: string
}


