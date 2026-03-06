"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkPolicyAccess } from "@/lib/orgs";

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

/**
 * Policy check with server-side membership fallback.
 * The JWT-based check_org_access RPC can fail when the Clerk session token
 * is unavailable (e.g. server action race, token refresh). In that case we
 * verify the caller is an authenticated org member via supabaseAdmin before
 * allowing the request to proceed.
 */
async function assertPolicyWithFallback(
  resourceType: string,
  resourceName: string,
  action: string,
  clerkOrgId: string,
  clerkUserId: string,
): Promise<void> {
  const allowed = await checkPolicyAccess(resourceType, resourceName, action);
  if (allowed) return;

  const { data: orgRow } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", clerkOrgId)
    .single();

  if (!orgRow?.id) {
    throw Object.assign(
      new Error(`Access denied: organization not found for ${clerkOrgId}`),
      { status: 403 },
    );
  }

  const { data: member } = await supabaseAdmin
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgRow.id)
    .eq("user_id", clerkUserId)
    .limit(1)
    .maybeSingle();

  if (!member) {
    console.error(
      `[policy-fallback] denied: user ${clerkUserId} not a member of org ${clerkOrgId} for ${action} on ${resourceType}:${resourceName}`,
    );
    throw Object.assign(
      new Error(`Access denied: ${action} on ${resourceType}:${resourceName}`),
      { status: 403 },
    );
  }
}

export async function getOrgInternalFlag(): Promise<{ isInternal: boolean }> {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) throw new Error("No active organization selected.");

  await assertPolicyWithFallback("table", "organizations", "select", orgId, userId);
  const { isInternal } = await getOrgPk(orgId);
  return { isInternal };
}

export async function setOrgInternalFlag(input: {
  isInternal: boolean;
}): Promise<{ ok: true }> {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) throw new Error("No active organization selected.");

  await assertPolicyWithFallback("table", "organizations", "update", orgId, userId);
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
  error?: string;
}> {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId)
      return { roles: {}, error: "No active organization selected." };

    await assertPolicyWithFallback(
      "table",
      "organization_members",
      "select",
      orgId,
      userId,
    );
    const { orgPk } = await getOrgPk(orgId);

    const { data, error } = await supabaseAdmin
      .from("organization_members")
      .select("user_id,clerk_member_role")
      .eq("organization_id", orgPk);

    if (error) {
      console.error("getOrgMemberRoles query error:", error.message);
      return { roles: {}, error: error.message };
    }

    const roles: Record<string, string | null> = {};
    for (const row of data ?? []) {
      if (row.user_id) {
        roles[row.user_id] = row.clerk_member_role ?? null;
      }
    }

    return { roles };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("getOrgMemberRoles failed:", msg);
    return { roles: {}, error: msg };
  }
}

/**
 * Returns the list of active member roles configured in organization_member_roles
 * for the current org (both global roles and org-specific ones).
 */
export async function getActiveMemberRoleOptions(): Promise<
  { value: string; label: string }[]
> {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) return [];

    await assertPolicyWithFallback(
      "table",
      "organization_member_roles",
      "select",
      orgId,
      userId,
    );
    const { orgPk } = await getOrgPk(orgId);

    const { data, error } = await supabaseAdmin
      .from("organization_member_roles")
      .select("role_code, role_name")
      .or(`organization_id.is.null,organization_id.eq.${orgPk}`)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("getActiveMemberRoleOptions query error:", error.message);
      return [];
    }

    return (data ?? []).map((r) => ({
      value: r.role_code as string,
      label: r.role_name as string,
    }));
  } catch (err) {
    console.error(
      "getActiveMemberRoleOptions failed:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

export async function getClerkOrgRoleOptions(): Promise<
  { value: string; label: string }[]
> {
  try {
    const { orgId } = await auth();
    if (!orgId) return [];

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      console.error("getClerkOrgRoleOptions: CLERK_SECRET_KEY not set");
      return [];
    }

    const res = await fetch("https://api.clerk.com/v1/organization_roles", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    if (!res.ok) {
      console.error(
        "getClerkOrgRoleOptions: Clerk API returned",
        res.status,
        await res.text(),
      );
      return [];
    }

    const body = await res.json();
    const roles: { key: string; name: string }[] = body?.data ?? [];
    return roles.map((r) => ({ value: r.key, label: r.name }));
  } catch (err) {
    console.error(
      "getClerkOrgRoleOptions failed:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

export async function setOrgClerkRole(input: {
  clerkUserId: string;
  clerkOrgRole: string;
}): Promise<{ ok: true }> {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) throw new Error("No active organization selected.");

  await assertPolicyWithFallback("table", "organization_members", "update", orgId, userId);
  const { orgPk } = await getOrgPk(orgId);

  const { error } = await supabaseAdmin
    .from("organization_members")
    .update({ clerk_org_role: input.clerkOrgRole })
    .eq("organization_id", orgPk)
    .eq("user_id", input.clerkUserId);

  if (error) throw new Error(error.message);

  return { ok: true };
}

export async function setOrgMemberRole(input: {
  clerkUserId: string;
  memberRole: string | null;
}): Promise<{ ok: true }> {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) throw new Error("No active organization selected.");

  await assertPolicyWithFallback("table", "organization_members", "update", orgId, userId);
  const { orgPk } = await getOrgPk(orgId);

  const { error } = await supabaseAdmin
    .from("organization_members")
    .update({ clerk_member_role: input.memberRole })
    .eq("organization_id", orgPk)
    .eq("user_id", input.clerkUserId);

  if (error) throw new Error(error.message);

  // Sync updated role to Clerk membership metadata so the user's JWT
  // includes the new org_member_role claim on the next token rotation.
  try {
    const clerk = await clerkClient();
    await clerk.organizations.updateOrganizationMembershipMetadata({
      organizationId: orgId,
      userId: input.clerkUserId,
      publicMetadata: {
        org_member_role: input.memberRole,
      },
    });
  } catch (syncErr) {
    console.error("Failed to sync member role to Clerk metadata:", syncErr);
  }

  return { ok: true };
}

export async function deleteOrganizationAction(input: {
  confirmationName: string;
}): Promise<{ ok: true }> {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) throw new Error("No active organization selected.");

  await assertPolicyWithFallback("table", "organizations", "delete", orgId, userId);

  const clerk = await clerkClient();
  const clerkOrg = await clerk.organizations.getOrganization({
    organizationId: orgId,
  });

  if (
    input.confirmationName.trim().toLowerCase() !==
    clerkOrg.name.trim().toLowerCase()
  ) {
    throw new Error(
      "Confirmation name does not match. Please type the exact organization name.",
    );
  }

  const { orgPk } = await getOrgPk(orgId);

  // Delete from Supabase first (cascade will handle related rows)
  const { error: membersErr } = await supabaseAdmin
    .from("organization_members")
    .delete()
    .eq("organization_id", orgPk);
  if (membersErr) {
    console.error("deleteOrg: members delete error:", membersErr.message);
  }

  const { error: orgErr } = await supabaseAdmin
    .from("organizations")
    .delete()
    .eq("id", orgPk);
  if (orgErr) {
    throw new Error(`Failed to delete organization from database: ${orgErr.message}`);
  }

  // Delete from Clerk
  await clerk.organizations.deleteOrganization(orgId);

  return { ok: true };
}
