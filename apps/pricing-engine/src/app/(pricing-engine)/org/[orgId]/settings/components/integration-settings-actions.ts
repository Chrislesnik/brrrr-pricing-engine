"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export type ConnectionRow = {
  id: string;
  type: string;
  name: string | null;
  config: Record<string, string>;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

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
  const { userId, orgId, getToken } = await auth();
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

  return { userId, orgId, token };
}

async function getOrgUuid(
  supabase: ReturnType<typeof supabaseForUser>,
  clerkOrgId: string,
) {
  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", clerkOrgId)
    .single();
  if (!data?.id) throw new Error("Organization not found");
  return data.id as string;
}

/* ------------------------------------------------------------------ */
/*  Catalog settings                                                   */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Connection management                                              */
/* ------------------------------------------------------------------ */

const SECRET_FIELD_PATTERNS = ["key", "token", "secret", "password", "url"];

function isSecretField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return SECRET_FIELD_PATTERNS.some((p) => lower.includes(p));
}

function stripSecrets(config: Record<string, unknown>): Record<string, string> {
  const stripped: Record<string, string> = {};
  for (const [key, value] of Object.entries(config)) {
    if (isSecretField(key) && typeof value === "string" && value.trim()) {
      stripped[key] = "configured";
    } else {
      stripped[key] = String(value ?? "");
    }
  }
  return stripped;
}

export async function getIntegrationConnections(
  slug: string,
): Promise<ConnectionRow[]> {
  const { userId, orgId, token } = await requireAuth();
  if (!orgId) throw new Error("No active organization");
  const supabase = supabaseForUser(token);
  const orgUuid = await getOrgUuid(supabase, orgId);

  const { data, error } = await supabase
    .from("integration_setup")
    .select("id, type, name, config, created_at, updated_at, archived_at")
    .eq("organization_id", orgUuid)
    .eq("user_id", userId)
    .eq("type", slug)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    config: stripSecrets((row.config as Record<string, unknown>) || {}),
  })) as ConnectionRow[];
}

export async function saveIntegrationConnection(input: {
  id?: string;
  type: string;
  name?: string | null;
  config: Record<string, string>;
}): Promise<{ ok: true }> {
  const { userId, orgId, token } = await requireAuth();
  if (!orgId) throw new Error("No active organization");
  const supabase = supabaseForUser(token);
  const orgUuid = await getOrgUuid(supabase, orgId);

  if (input.id) {
    const { data: existing } = await supabase
      .from("integration_setup")
      .select("config")
      .eq("id", input.id)
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .single();

    if (!existing) throw new Error("Connection not found");

    const existingConfig = (existing.config as Record<string, unknown>) || {};
    const mergedConfig = { ...existingConfig };
    for (const [key, value] of Object.entries(input.config)) {
      if (value === "configured") continue;
      mergedConfig[key] = value;
    }

    const { error } = await supabase
      .from("integration_setup")
      .update({ config: mergedConfig })
      .eq("id", input.id)
      .eq("organization_id", orgUuid)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("integration_setup")
      .insert({
        organization_id: orgUuid,
        user_id: userId,
        type: input.type,
        name: input.name || null,
        config: input.config,
      });

    if (error) {
      if (error.code === "23505") {
        throw new Error("A connection of this type already exists");
      }
      throw new Error(error.message);
    }
  }

  return { ok: true };
}

export async function archiveIntegrationConnection(
  id: string,
): Promise<{ ok: true }> {
  const { userId, orgId, token } = await requireAuth();
  if (!orgId) throw new Error("No active organization");
  const supabase = supabaseForUser(token);
  const orgUuid = await getOrgUuid(supabase, orgId);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("integration_setup")
    .update({ archived_at: now, archived_by: userId })
    .eq("id", id)
    .eq("organization_id", orgUuid)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return { ok: true };
}
