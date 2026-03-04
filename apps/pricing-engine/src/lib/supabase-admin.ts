import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _supabaseAdmin: SupabaseClient | null = null;

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!_supabaseAdmin) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
      }
      _supabaseAdmin = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
