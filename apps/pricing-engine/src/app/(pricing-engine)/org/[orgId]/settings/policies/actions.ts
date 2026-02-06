"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export type PolicyRuleInput = {
  orgRole?: string;
  memberRole?: string;
  orgType?: string; // "any" | "internal" | "external"
  operator?: "AND" | "OR"; // How to combine conditions within this rule
};

export type PolicyDefinitionInput = {
  allowInternalUsers: boolean;
  rules: PolicyRuleInput[];
};

export type OrgPolicyRow = {
  id: string;
  resource_type: "table" | "storage_bucket";
  resource_name: string;
  action: "select" | "insert" | "update" | "delete" | "all";
  definition_json: Record<string, unknown>;
  compiled_config: Record<string, unknown>;
  version: number;
  is_active: boolean;
  created_at: string;
};

type SavePolicyInput = {
  resourceType: "table" | "storage_bucket";
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
  const allowInternalUsers = !!definition.allowInternalUsers;
  const pairs = new Set<string>();

  for (const rule of definition.rules ?? []) {
    const orgRole = normalizeRole(rule.orgRole) || "*";
    const memberRole = normalizeRole(rule.memberRole) || "*";
    pairs.add(`${orgRole}|${memberRole}`);
  }

  const allowedRolePairs = Array.from(pairs);

  return {
    allow_internal_users: allowInternalUsers,
    allowed_role_pairs: allowedRolePairs,
  };
}

function buildDefinition(definition: PolicyDefinitionInput) {
  return {
    version: 1,
    effect: "ALLOW",
    allow_internal_users: !!definition.allowInternalUsers,
    rules: (definition.rules ?? []).map((rule) => ({
      org_role: normalizeRole(rule.orgRole) || "*",
      member_role: normalizeRole(rule.memberRole) || "*",
    })),
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
      "id,resource_type,resource_name,action,definition_json,compiled_config,version,is_active,created_at"
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
    (!compiledConfig.allowed_role_pairs ||
      compiledConfig.allowed_role_pairs.length === 0)
  ) {
    throw new Error("At least one rule or internal-user allowance is required.");
  }

  const normalizedOrgRole = normalizeRole(orgRole ?? "");
  const currentUserAllowed =
    normalizedOrgRole === "owner" ||
    compiledConfig.allowed_role_pairs.some((pair) => {
      const [orgRolePart, memberRolePart] = pair.split("|");
      return (
        (orgRolePart === "*" || orgRolePart === normalizedOrgRole) &&
        memberRolePart === "*"
      );
    }) ||
    compiledConfig.allow_internal_users;

  if (!currentUserAllowed && normalizedOrgRole !== "owner") {
    throw new Error(
      "This policy would deny your access based on your org role. Update the rules or use an owner account."
    );
  }

  const actions = input.actions.length
    ? input.actions
    : ["select", "insert", "update", "delete"];

  const rows = await Promise.all(
    actions.map(async (action) => {
      const { data: existing } = await supabase
        .from("organization_policies")
        .select("id,version")
        .eq("org_id", orgPk)
        .eq("resource_type", input.resourceType)
        .eq("resource_name", "*")
        .eq("action", action)
        .maybeSingle();

      return {
        id: existing?.id,
        org_id: orgPk,
        resource_type: input.resourceType,
        resource_name: "*",
        action,
        definition_json: definitionJson,
        compiled_config: compiledConfig,
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
