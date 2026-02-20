import { createClient } from "@supabase/supabase-js"

/**
 * Clerk JWT Template: "supabase"
 *
 * The following claims are embedded in the JWT and available to
 * Supabase RLS policies via auth.jwt():
 *
 *   org_id            – Clerk organization ID (e.g. "org_abc123")
 *   org_role          – Clerk org membership role (e.g. "org:admin")
 *   org_slug          – Clerk org slug
 *   org_member_role   – Custom member role from org_membership.public_metadata
 *   is_internal_yn    – Whether the org is internal (from org.public_metadata)
 *   user_id           – Clerk user ID
 *   email             – Primary email address
 *   first_name        – User first name
 *   last_name         – User last name
 *   full_name         – "last_name first_name"
 *   avatar            – User image URL
 *   phone             – Primary phone number
 *   aud               – "authenticated" (fixed)
 *   role              – "authenticated" (fixed)
 *
 * These claims are used by:
 *   - can_access_org_resource() RPC for the policy engine
 *   - get_active_org_id() helper for RLS
 *   - is_org_owner() / is_org_admin() helpers
 */
export function createSupabaseBrowser() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
	const anon =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
	if (!url || !anon) {
		throw new Error(
			"Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable."
		)
	}
	return createClient(url, anon, {
		auth: { persistSession: true, autoRefreshToken: true },
	})
}





