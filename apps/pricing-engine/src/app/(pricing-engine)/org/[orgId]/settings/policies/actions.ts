"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// v2 condition-based input
export type ConditionInput = {
  field: string;      // "org_role" | "member_role" | "org_type" | "internal_user"
  operator: "is" | "is_not";
  values: string[];
};

export type PolicyScope = "all" | "org_records" | "user_records" | "org_and_user";
export type PolicyEffect = "ALLOW" | "DENY";

export type PolicyDefinitionInput = {
  allowInternalUsers: boolean;
  conditions: ConditionInput[];
  connector: "AND" | "OR";
  scope?: PolicyScope;
  effect?: PolicyEffect;
};

export type OrgPolicyRow = {
  id: string;
  resource_type: "table" | "storage_bucket";
  resource_name: string;
  action: "select" | "insert" | "update" | "delete" | "all";
  definition_json: Record<string, unknown>;
  compiled_config: Record<string, unknown>;
  scope: PolicyScope;
  effect: PolicyEffect;
  version: number;
  is_active: boolean;
  created_at: string;
};

type SavePolicyInput = {
  resourceType: "table" | "storage_bucket";
  resourceName?: string; // specific table/bucket name, defaults to "*" (all)
  actions: Array<"select" | "insert" | "update" | "delete">;
  definition: PolicyDefinitionInput;
};

function supabaseForUser(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please add it to your .env file."
    );
  }

  if (!anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable. Please add it to your .env file."
    );
  }

  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

async function requireAuthAndOrg() {
  const { userId, orgId, getToken, orgRole } = await auth();
  if (!userId) throw new Error("Not authenticated");
  if (!orgId) throw new Error("No active organization selected");

  // Always use the supabase template - don't fallback to default
  let token: string | null = null;
  try {
    token = await getToken({ template: "supabase" });
    console.log("Got token successfully (with supabase template)");
  } catch (error) {
    console.error("Error getting Supabase token with template:", error);
    throw new Error(
      "Failed to get Supabase authentication token. Please ensure the Supabase JWT template is configured in Clerk Dashboard with name 'supabase'."
    );
  }

  if (!token) {
    throw new Error(
      "Missing Clerk Supabase token. Please configure the 'supabase' JWT template in your Clerk Dashboard."
    );
  }

  return { userId, orgId, orgRole, token };
}

async function getOrgPk(
  supabase: ReturnType<typeof supabaseForUser>,
  orgId: string
) {
  // Validate that this is an organization ID, not a user ID
  if (!orgId.startsWith('org_')) {
    throw new Error(
      `Invalid organization ID: "${orgId}". ` +
      `Organization IDs must start with "org_", not "user_". ` +
      `Please check your URL and ensure you're using the correct organization ID.`
    );
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", orgId)
    .single();

  if (data?.id) return data.id as string;

  if (error && error.code !== "PGRST116") {
    throw new Error(
      `Failed to fetch organization from Supabase: ${error.message}.`
    );
  }

  // Org doesn't exist - should be synced via Clerk webhooks
  console.warn(`Organization ${orgId} not found in Supabase. Should be synced via webhooks.`);
  
  throw new Error(
    `Organization not found in Supabase database. ` +
    `Please ensure Clerk webhooks are properly configured to sync organizations. ` +
    `If you just created this organization, you may need to manually sync it using the SQL script provided.`
  );
}

function normalizeRole(value?: string) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  return trimmed.toLowerCase().replace(/^org:/, "");
}

function compilePolicy(definition: PolicyDefinitionInput) {
  return {
    version: 2,
    allow_internal_users: !!definition.allowInternalUsers,
    conditions: (definition.conditions ?? []).map((c) => ({
      field: c.field,
      operator: c.operator,
      values: c.values.map((v) => v.toLowerCase()),
    })),
    connector: definition.connector || "AND",
    scope: definition.scope || "all",
  };
}

function buildDefinition(definition: PolicyDefinitionInput) {
  return {
    version: 2,
    effect: "ALLOW",
    allow_internal_users: !!definition.allowInternalUsers,
    conditions: (definition.conditions ?? []).map((c) => ({
      field: c.field,
      operator: c.operator,
      values: c.values,
    })),
    connector: definition.connector || "AND",
    scope: definition.scope || "all",
  };
}

export async function getOrgPolicies(): Promise<{
  orgPk: string;
  policies: OrgPolicyRow[];
}> {
  const { orgId, token } = await requireAuthAndOrg();
  const supabase = supabaseForUser(token);
  const orgPk = await getOrgPk(supabase, orgId);

  const { data, error } = await supabase
    .from("organization_policies")
    .select(
      "id,resource_type,resource_name,action,definition_json,compiled_config,scope,effect,version,is_active,created_at"
    )
    .eq("org_id", orgPk)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return {
    orgPk,
    policies: (data ?? []) as OrgPolicyRow[],
  };
}

export async function saveOrgPolicy(
  input: SavePolicyInput
): Promise<{ ok: true }> {
  const { orgId, token, orgRole, userId } = await requireAuthAndOrg();
  const supabase = supabaseForUser(token);
  const orgPk = await getOrgPk(supabase, orgId);

  const compiledConfig = compilePolicy(input.definition);
  const definitionJson = buildDefinition(input.definition);

  if (
    !compiledConfig.allow_internal_users &&
    (!compiledConfig.conditions || compiledConfig.conditions.length === 0)
  ) {
    throw new Error("At least one condition or internal-user allowance is required.");
  }

  // Self-lockout protection: owners and admins can always save policies
  // (the DB-level is_org_owner/is_org_admin bypass ensures they're never locked out)
  const normalizedOrgRole = normalizeRole(orgRole ?? "");
  const isPrivileged = ["owner", "admin"].includes(normalizedOrgRole);

  if (!isPrivileged) {
    // For non-admin users, check if the policy would still grant them access
    const currentUserAllowed =
      compiledConfig.allow_internal_users ||
      compiledConfig.conditions.some((c: { field: string; operator: string; values: string[] }) =>
        c.field === "org_role" &&
        c.operator === "is" &&
        (c.values.includes("*") || c.values.includes(normalizedOrgRole))
      );

    if (!currentUserAllowed) {
      throw new Error(
        "This policy would deny your access based on your org role. Update the conditions or use an owner/admin account."
      );
    }
  }

  const actions = input.actions.length
    ? input.actions
    : ["select", "insert", "update", "delete"];

  const resourceName = input.resourceName || "*";

  const rows = await Promise.all(
    actions.map(async (action) => {
      const { data: existing } = await supabase
        .from("organization_policies")
        .select("id,version")
        .eq("org_id", orgPk)
        .eq("resource_type", input.resourceType)
        .eq("resource_name", resourceName)
        .eq("action", action)
        .maybeSingle();

      return {
        id: existing?.id ?? crypto.randomUUID(),
        org_id: orgPk,
        resource_type: input.resourceType,
        resource_name: resourceName,
        action,
        definition_json: definitionJson,
        compiled_config: compiledConfig,
        scope: input.definition.scope || "all",
        effect: input.definition.effect || "ALLOW",
        version: (existing?.version ?? 0) + 1,
        is_active: true,
        created_by_clerk_sub: userId,
      };
    })
  );

  const { error } = await supabase
    .from("organization_policies")
    .upsert(rows, {
      onConflict: "org_id,resource_type,resource_name,action",
    });

  if (error) throw new Error(error.message);

  return { ok: true };
}

export async function setOrgPolicyActive(input: {
  id: string;
  isActive: boolean;
}): Promise<{ ok: true }> {
  const { token } = await requireAuthAndOrg();
  const supabase = supabaseForUser(token);

  const { error } = await supabase
    .from("organization_policies")
    .update({ is_active: input.isActive })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  return { ok: true };
}

export async function updateOrgPolicy(input: {
  id: string;
  definition: PolicyDefinitionInput;
}): Promise<{ ok: true }> {
  const { orgId, token, orgRole, userId } = await requireAuthAndOrg();
  const supabase = supabaseForUser(token);

  const compiledConfig = compilePolicy(input.definition);
  const definitionJson = buildDefinition(input.definition);

  if (
    !compiledConfig.allow_internal_users &&
    (!compiledConfig.conditions || compiledConfig.conditions.length === 0)
  ) {
    throw new Error("At least one condition or internal-user allowance is required.");
  }

  const normalizedOrgRole = normalizeRole(orgRole ?? "");
  const currentUserAllowed =
    normalizedOrgRole === "owner" ||
    compiledConfig.allow_internal_users ||
    compiledConfig.conditions.some(
      (c: { field: string; operator: string; values: string[] }) =>
        c.field === "org_role" &&
        c.operator === "is" &&
        (c.values.includes("*") || c.values.includes(normalizedOrgRole))
    );

  if (!currentUserAllowed && normalizedOrgRole !== "owner") {
    throw new Error(
      "This policy would deny your access based on your org role. Update the conditions or use an owner account."
    );
  }

  const { error } = await supabase
    .from("organization_policies")
    .update({
      definition_json: definitionJson,
      compiled_config: compiledConfig,
      scope: input.definition.scope || "all",
      effect: input.definition.effect || "ALLOW",
      created_by_clerk_sub: userId,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  return { ok: true };
}

export async function getAvailableResources(): Promise<{
  tables: string[];
  buckets: string[];
}> {
  const { token } = await requireAuthAndOrg();
  const supabase = supabaseForUser(token);

  // Fetch public table names (excluding system/excluded tables)
  const excludedTables = [
    "organization_policies",
    "organizations",
    "organization_members",
    "users",
    "organization_member_roles",
    "schema_migrations",
  ];

  const { data: tables } = await supabase.rpc("get_public_table_names").select();

  // Fetch storage buckets
  const { data: buckets } = await supabase.storage.listBuckets();

  return {
    tables: (tables as Array<{ table_name: string }> | null)
      ?.map((t) => t.table_name)
      .filter((t) => !excludedTables.includes(t))
      .sort() ?? [],
    buckets: buckets?.map((b) => b.name).sort() ?? [],
  };
}

export async function getColumnFilters(): Promise<
  Array<{ table_name: string; org_column: string | null; user_column: string | null }>
> {
  const { token } = await requireAuthAndOrg();
  const supabase = supabaseForUser(token);

  const { data } = await supabase
    .from("organization_policies_column_filters")
    .select("table_name,org_column,user_column")
    .eq("is_excluded", false)
    .order("table_name");

  return (data ?? []) as Array<{ table_name: string; org_column: string | null; user_column: string | null }>;
}

export async function deleteOrgPolicy(input: {
  id: string;
  action?: "restore";
}): Promise<{ ok: true }> {
  const { token, userId } = await requireAuthAndOrg();
  const supabase = supabaseForUser(token);

  if (input.action === "restore") {
    const { error } = await supabase
      .from("organization_policies")
      .update({ archived_at: null, archived_by: null })
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  }

  // Archive instead of delete
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("organization_policies")
    .update({ archived_at: now, archived_by: userId })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  return { ok: true };
}
