/**
 * Shared helper to get a Supabase client for step execution.
 * Uses the app's own supabaseAdmin if no external credentials provided,
 * otherwise creates a temporary client for the external project.
 */
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchCredentials } from "@/components/workflow-builder/lib/credential-fetcher";

export async function getSupabaseClient(
  integrationId?: string
): Promise<SupabaseClient> {
  if (!integrationId) {
    return supabaseAdmin;
  }

  const credentials = await fetchCredentials(integrationId);
  const url = credentials.SUPABASE_URL;
  const key = credentials.SUPABASE_KEY;

  if (url && key) {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  // Fallback to own project if external creds are empty
  return supabaseAdmin;
}
