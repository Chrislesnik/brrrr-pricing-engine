"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

export type MemberRole = {
  id: string;
  organization_id: string;
  role_code: string;
  role_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export async function getMemberRoles(): Promise<{ roles: MemberRole[] }> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  if (!orgId) throw new Error("No active organization");

  const orgUuid = await getOrgUuidFromClerkId(orgId);
  if (!orgUuid) throw new Error("Organization not found");

  // Fetch both global roles (organization_id IS NULL) and org-specific roles
  const { data, error } = await supabaseAdmin
    .from("organization_member_roles")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${orgUuid}`)
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);

  return { roles: (data as MemberRole[]) || [] };
}

export async function createMemberRole(input: {
  roleCode: string;
  roleName: string;
  description: string;
  isActive: boolean;
  isGlobal?: boolean;
}): Promise<{ ok: true }> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  if (!orgId) throw new Error("No active organization");

  const orgUuid = await getOrgUuidFromClerkId(orgId);
  if (!orgUuid) throw new Error("Organization not found");

  // Validate role code format
  const cleanCode = input.roleCode.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  if (!cleanCode) throw new Error("Invalid role code");

  // Get next display order
  const { data: existing } = await supabaseAdmin
    .from("organization_member_roles")
    .select("display_order")
    .eq("organization_id", orgUuid)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.display_order || 0) + 1;

  const { error } = await supabaseAdmin
    .from("organization_member_roles")
    .insert({
      organization_id: input.isGlobal ? null : orgUuid,
      role_code: cleanCode,
      role_name: input.roleName,
      description: input.description || null,
      is_active: input.isActive,
      display_order: nextOrder,
    });

  if (error) throw new Error(error.message);

  revalidatePath(`/org/${orgId}/settings`);
  return { ok: true };
}

export async function updateMemberRole(input: {
  id: string;
  roleName: string;
  description: string;
  isActive: boolean;
}): Promise<{ ok: true }> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  if (!orgId) throw new Error("No active organization");

  const orgUuid = await getOrgUuidFromClerkId(orgId);
  if (!orgUuid) throw new Error("Organization not found");

  const { error } = await supabaseAdmin
    .from("organization_member_roles")
    .update({
      role_name: input.roleName,
      description: input.description || null,
      is_active: input.isActive,
    })
    .eq("id", input.id)
    .eq("organization_id", orgUuid);

  if (error) throw new Error(error.message);

  revalidatePath(`/org/${orgId}/settings`);
  return { ok: true };
}

export async function deleteMemberRole(input: {
  id: string;
  action?: "restore";
}): Promise<{ ok: true }> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  if (!orgId) throw new Error("No active organization");

  const orgUuid = await getOrgUuidFromClerkId(orgId);
  if (!orgUuid) throw new Error("Organization not found");

  if (input.action === "restore") {
    const { error } = await supabaseAdmin
      .from("organization_member_roles")
      .update({ archived_at: null, archived_by: null })
      .eq("id", input.id)
      .eq("organization_id", orgUuid);
    if (error) throw new Error(error.message);
    revalidatePath(`/org/${orgId}/settings`);
    return { ok: true };
  }

  // Check if role is in use
  const { data: inUse } = await supabaseAdmin
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgUuid)
    .eq("clerk_member_role", (await supabaseAdmin
      .from("organization_member_roles")
      .select("role_code")
      .eq("id", input.id)
      .single()
    ).data?.role_code)
    .limit(1);

  if (inUse && inUse.length > 0) {
    throw new Error(
      "Cannot archive role - it is currently assigned to one or more members"
    );
  }

  // Archive instead of delete
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("organization_member_roles")
    .update({ archived_at: now, archived_by: userId })
    .eq("id", input.id)
    .eq("organization_id", orgUuid);

  if (error) throw new Error(error.message);

  revalidatePath(`/org/${orgId}/settings`);
  return { ok: true };
}
