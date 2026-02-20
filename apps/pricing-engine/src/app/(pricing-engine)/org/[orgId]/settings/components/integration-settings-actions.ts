"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

function supabaseForUser(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }
  if (!anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable."
    );
  }

  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

async function requireAuth() {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Not authenticated");

  let token: string | null = null;
  try {
    token = await getToken({ template: "supabase" });
  } catch {
    throw new Error(
      "Failed to get Supabase authentication token. Please ensure the Supabase JWT template is configured in Clerk Dashboard."
    );
  }

  if (!token) {
    throw new Error("Missing Clerk Supabase token.");
  }

  return { userId, token };
}

export async function updateIntegrationSettings(input: {
  id: number;
  active: boolean;
  description: string | null;
  level_global: boolean;
  level_org: boolean;
  level_individual: boolean;
  tags: string[];
}): Promise<{ ok: true }> {
  const { token } = await requireAuth();
  const supabase = supabaseForUser(token);

  const { error } = await supabase
    .from("integration_settings")
    .update({
      active: input.active,
      description: input.description || null,
      level_global: input.level_global,
      level_org: input.level_org,
      level_individual: input.level_individual,
      tags: input.tags,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  return { ok: true };
}
