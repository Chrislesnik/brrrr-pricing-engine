"use client"

import { useAuth } from "@clerk/nextjs"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { useMemo, useRef } from "react"
import type { Database } from "@/types/database.types"

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

/**
 * React hook that returns a typed Supabase client authenticated with the
 * current Clerk session's JWT. The token is fetched lazily on each request
 * so the client instance is stable across re-renders (safe for Realtime
 * subscriptions).
 */
export function useSupabaseBrowser(): SupabaseClient<Database> {
	const { getToken } = useAuth()
	const getTokenRef = useRef(getToken)
	getTokenRef.current = getToken

	return useMemo(() => {
		return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
			global: {
				fetch: async (input, init) => {
					const token = await getTokenRef.current({ template: "supabase" })
					const headers = new Headers(init?.headers)
					if (token) {
						headers.set("Authorization", `Bearer ${token}`)
					}
					return fetch(input, { ...init, headers })
				},
			},
			auth: { persistSession: false },
		})
	}, [])
}

/**
 * @deprecated Use `useSupabaseBrowser()` hook instead for authenticated access.
 * This creates an unauthenticated client (anon key only, no Clerk JWT).
 * Only appropriate for contexts where a React hook cannot be called.
 */
export function createSupabaseBrowser() {
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
		throw new Error(
			"Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable."
		)
	}
	return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		auth: { persistSession: true, autoRefreshToken: true },
	})
}

