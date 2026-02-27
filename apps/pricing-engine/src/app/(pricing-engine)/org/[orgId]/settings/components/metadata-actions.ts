"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { assertPolicyAccess } from "@/lib/orgs";

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
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization selected.");

  // Policy-engine check: read access on organizations table
  await assertPolicyAccess("table", "organizations", "select");
  const { isInternal } = await getOrgPk(orgId);
  return { isInternal };
}

export async function setOrgInternalFlag(input: {
  isInternal: boolean;
}): Promise<{ ok: true }> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization selected.");

  // Policy-engine check: write access on organizations table
  await assertPolicyAccess("table", "organizations", "update");
  const { orgPk } = await getOrgPk(orgId);

  const { error } = await supabaseAdmin
    .from("organizations")
    .update({ is_internal_yn: input.isInternal })
    .eq("id", orgPk);

  if (error) throw new Error(error.message);

  await (await clerkClient()).organizations.updateOrganization(orgId, {
    publicMetadata: {
      is_internal_yn: input.isInternal,
    },
  });

  return { ok: true };
}

export async function getOrgMemberRoles(): Promise<{
  roles: Record<string, string | null>;
}> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization selected.");

  // Policy-engine check: read access on organization_members table
  await assertPolicyAccess("table", "organization_members", "select");
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

/**
 * Returns the list of active member roles configured in organization_member_roles
 * for the current org (both global roles and org-specific ones).
 */
export async function getActiveMemberRoleOptions(): Promise<
  { value: string; label: string }[]
> {
  const { orgId } = await auth();
  if (!orgId) return [];

  // Policy-engine check: read access on organization_member_roles table
  await assertPolicyAccess("table", "organization_member_roles", "select");
  const { orgPk } = await getOrgPk(orgId);

  const { data, error } = await supabaseAdmin
    .from("organization_member_roles")
    .select("role_code, role_name")
    .or(`organization_id.is.null,organization_id.eq.${orgPk}`)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("getActiveMemberRoleOptions error:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    value: r.role_code as string,
    label: r.role_name as string,
  }));
}

export async function setOrgMemberRole(input: {
  clerkUserId: string;
  memberRole: string | null;
}): Promise<{ ok: true }> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization selected.");

  await assertPolicyAccess("table", "organization_members", "update");
  const { orgPk } = await getOrgPk(orgId);

  const { error } = await supabaseAdmin
    .from("organization_members")
    .update({ clerk_member_role: input.memberRole })
    .eq("organization_id", orgPk)
    .eq("user_id", input.clerkUserId);

  if (error) throw new Error(error.message);

  // Sync updated role to Clerk metadata so the user's JWT is refreshed
  // with the new claim on the next token rotation.
  try {
    const clerk = await clerkClient();
    const memberships = await clerk.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });
    const membership = memberships.data?.find(
      (m) => m.publicUserData?.userId === input.clerkUserId
    );
    if (membership) {
      await clerk.organizations.updateOrganizationMembership({
        organizationId: orgId,
        userId: input.clerkUserId,
        publicMetadata: {
          ...(membership.publicMetadata ?? {}),
          org_member_role: input.memberRole,
        },
      });
    }
  } catch (syncErr) {
    console.error("Failed to sync member role to Clerk metadata:", syncErr);
  }

  return { ok: true };
}
