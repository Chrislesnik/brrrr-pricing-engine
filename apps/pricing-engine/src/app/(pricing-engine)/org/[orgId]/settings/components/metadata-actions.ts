"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeRole(value?: string | null) {
  return (value ?? "").toLowerCase();
}

function assertOrgAccess(orgRole: string | null | undefined, required: "owner" | "admin") {
  const role = normalizeRole(orgRole);
  const isOwner = role === "org:owner" || role === "owner";
  const isAdmin = role === "org:admin" || role === "admin";
  if (required === "owner" && !isOwner) {
    throw new Error("Owner access required.");
  }
  if (required === "admin" && !(isOwner || isAdmin)) {
    throw new Error("Admin access required.");
  }
}

async function getOrgPk(clerkOrgId: string) {
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("id,is_internal_yn")
    .eq("clerk_organization_id", clerkOrgId)
    .single();

  if (error || !data?.id) {
    throw new Error("Organization not found in Supabase.");
  }

  return { orgPk: data.id as string, isInternal: !!data.is_internal_yn };
}

export async function getOrgInternalFlag(): Promise<{ isInternal: boolean }> {
  const { orgId, orgRole } = await auth();
  if (!orgId) throw new Error("No active organization selected.");

  assertOrgAccess(orgRole, "admin");
  const { isInternal } = await getOrgPk(orgId);
  return { isInternal };
}

export async function setOrgInternalFlag(input: {
  isInternal: boolean;
}): Promise<{ ok: true }> {
  const { orgId, orgRole } = await auth();
  if (!orgId) throw new Error("No active organization selected.");

  assertOrgAccess(orgRole, "owner");
  const { orgPk } = await getOrgPk(orgId);

  const { error } = await supabaseAdmin
    .from("organizations")
    .update({ is_internal_yn: input.isInternal })
    .eq("id", orgPk);

  if (error) throw new Error(error.message);

  await clerkClient.organizations.updateOrganization(orgId, {
    publicMetadata: {
      is_internal_yn: input.isInternal,
    },
  });

  return { ok: true };
}

export async function getOrgMemberRoles(): Promise<{
  roles: Record<string, string | null>;
}> {
  const { orgId, orgRole } = await auth();
  if (!orgId) throw new Error("No active organization selected.");

  assertOrgAccess(orgRole, "admin");
  const { orgPk } = await getOrgPk(orgId);

  const { data, error } = await supabaseAdmin
    .from("organization_members")
    .select("user_id,clerk_member_role")
    .eq("organization_id", orgPk);

  if (error) throw new Error(error.message);

  const roles: Record<string, string | null> = {};
  for (const row of data ?? []) {
    if (row.user_id) {
      roles[row.user_id] = row.clerk_member_role ?? null;
    }
  }

  return { roles };
}

export async function setOrgMemberRole(input: {
  clerkUserId: string;
  memberRole: string | null;
}): Promise<{ ok: true }> {
  const { orgId, orgRole } = await auth();
  if (!orgId) throw new Error("No active organization selected.");

  assertOrgAccess(orgRole, "admin");
  const { orgPk } = await getOrgPk(orgId);

  const { error } = await supabaseAdmin
    .from("organization_members")
    .update({ clerk_member_role: input.memberRole })
    .eq("organization_id", orgPk)
    .eq("user_id", input.clerkUserId);

  if (error) throw new Error(error.message);

  await clerkClient.organizations.updateOrganizationMembership({
    organizationId: orgId,
    userId: input.clerkUserId,
    publicMetadata: {
      org_member_role: input.memberRole,
    },
  });

  return { ok: true };
}
