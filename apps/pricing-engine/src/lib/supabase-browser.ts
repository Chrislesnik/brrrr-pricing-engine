import { createClient } from "@supabase/supabase-js"

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





