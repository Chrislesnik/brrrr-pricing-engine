"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function createOrganizationAction(input: {
  name: string;
  slug?: string;
  isInternal: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const clerk = await clerkClient();

  const org = await clerk.organizations.createOrganization({
    name: input.name,
    slug: input.slug || undefined,
    createdBy: userId,
    publicMetadata: { is_internal_yn: input.isInternal },
  });

  await supabaseAdmin
    .from("organizations")
    .upsert(
      {
        clerk_organization_id: org.id,
        name: org.name,
        slug: org.slug ?? null,
        is_internal_yn: input.isInternal,
      },
      { onConflict: "clerk_organization_id" },
    );

  return { clerkOrgId: org.id, name: org.name, slug: org.slug };
}

export async function searchClerkUsersAction(query: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const clerk = await clerkClient();
  const result = await clerk.users.getUserList({ query, limit: 10 });

  return result.data.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.emailAddresses[0]?.emailAddress ?? "",
    imageUrl: u.imageUrl,
  }));
}

export async function addExistingUserToOrgAction(input: {
  orgId: string;
  userId: string;
  role: string;
  memberRole: string;
}) {
  const { userId: authUserId } = await auth();
  if (!authUserId) throw new Error("Not authenticated");

  const clerk = await clerkClient();
  await clerk.organizations.createOrganizationMembership({
    organizationId: input.orgId,
    userId: input.userId,
    role: input.role,
  });

  // Sync member role to Clerk membership metadata
  try {
    await clerk.organizations.updateOrganizationMembershipMetadata({
      organizationId: input.orgId,
      userId: input.userId,
      publicMetadata: { org_member_role: input.memberRole },
    });
  } catch (err) {
    console.error("Failed to sync member role to Clerk metadata:", err);
  }

  // Sync both roles to Supabase organization_members
  await syncMemberRolesToSupabase(
    input.orgId,
    input.userId,
    input.role,
    input.memberRole,
  );

  return { ok: true };
}

export async function createUserAndAddToOrgAction(input: {
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
  memberRole: string;
  skipPasswordChecks?: boolean;
}) {
  const { userId: authUserId } = await auth();
  if (!authUserId) throw new Error("Not authenticated");

  const clerk = await clerkClient();

  const newUser = await clerk.users.createUser({
    firstName: input.firstName,
    lastName: input.lastName,
    emailAddress: [input.email],
    ...(input.phone ? { phoneNumber: [input.phone] } : {}),
    password: input.password,
    skipPasswordChecks: input.skipPasswordChecks ?? false,
  });

  await clerk.organizations.createOrganizationMembership({
    organizationId: input.orgId,
    userId: newUser.id,
    role: input.role,
  });

  try {
    await clerk.organizations.updateOrganizationMembershipMetadata({
      organizationId: input.orgId,
      userId: newUser.id,
      publicMetadata: { org_member_role: input.memberRole },
    });
  } catch (err) {
    console.error("Failed to sync member role to Clerk metadata:", err);
  }

  await syncMemberRolesToSupabase(
    input.orgId,
    newUser.id,
    input.role,
    input.memberRole,
  );

  return { ok: true, userId: newUser.id };
}

export async function inviteUserToOrgAction(input: {
  orgId: string;
  email: string;
  role: string;
  memberRole: string;
  expiresInDays?: number;
}) {
  const { userId: authUserId } = await auth();
  if (!authUserId) throw new Error("Not authenticated");

  const clerk = await clerkClient();
  const rawOrgRole = input.role.startsWith("org:")
    ? input.role
    : `org:${input.role}`;

  await clerk.organizations.createOrganizationInvitation({
    organizationId: input.orgId,
    emailAddress: input.email,
    inviterUserId: authUserId,
    role: rawOrgRole,
  });

  // Store intended member role in pending_invite_roles so it is applied
  // when the membership is created via webhook
  const { data: orgRow } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", input.orgId)
    .single();

  if (orgRow?.id) {
    const orgRole = input.role.replace(/^org:/, "");
    const memberRole = input.memberRole.replace(/^org:/, "");

    await supabaseAdmin
      .from("pending_invite_roles")
      .upsert(
        {
          organization_id: orgRow.id,
          email: input.email.toLowerCase(),
          clerk_org_role: orgRole,
          clerk_member_role: memberRole,
        },
        { onConflict: "organization_id,email" },
      )
      .then(({ error }) => {
        if (error) {
          console.warn(
            "pending_invite_roles upsert skipped:",
            error.message,
          );
        }
      });
  }

  return { ok: true };
}

export async function getOrgRolesAction() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return [
      { value: "org:member", label: "Member" },
      { value: "org:admin", label: "Admin" },
    ];
  }

  try {
    const res = await fetch("https://api.clerk.com/v1/organization_roles", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!res.ok) throw new Error("Failed to fetch roles");
    const body = await res.json();
    return (body?.data ?? []).map((r: { key: string; name: string }) => ({
      value: r.key,
      label: r.name,
    }));
  } catch {
    return [
      { value: "org:member", label: "Member" },
      { value: "org:admin", label: "Admin" },
    ];
  }
}

export async function getMemberRoleOptionsAction(
  clerkOrgId: string,
): Promise<{ value: string; label: string }[]> {
  const { data: orgRow } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", clerkOrgId)
    .single();

  const orgPk = orgRow?.id as string | undefined;

  const { data, error } = await supabaseAdmin
    .from("organization_member_roles")
    .select("role_code, role_name")
    .or(
      orgPk
        ? `organization_id.is.null,organization_id.eq.${orgPk}`
        : "organization_id.is.null",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("getMemberRoleOptionsAction error:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    value: r.role_code as string,
    label: r.role_name as string,
  }));
}

async function syncMemberRolesToSupabase(
  clerkOrgId: string,
  clerkUserId: string,
  orgRole: string,
  memberRole: string,
) {
  const { data: orgRow } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", clerkOrgId)
    .single();

  if (!orgRow?.id) return;

  const normalized = orgRole.replace(/^org:/, "");

  const { error } = await supabaseAdmin
    .from("organization_members")
    .update({
      clerk_org_role: normalized,
      clerk_member_role: memberRole || null,
    })
    .eq("organization_id", orgRow.id)
    .eq("user_id", clerkUserId);

  if (error) {
    console.error("syncMemberRolesToSupabase error:", error.message);
  }
}
