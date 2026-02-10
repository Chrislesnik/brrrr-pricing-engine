"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

export type MemberRoleOption = {
  value: string;
  label: string;
  description: string | null;
  isOrgSpecific: boolean;
};

export async function getMemberRolesForPolicies(): Promise<MemberRoleOption[]> {
  const { orgId } = await auth();
  if (!orgId) return [{ value: "_all", label: "All", description: "Matches all member roles", isOrgSpecific: false }];

  const orgUuid = await getOrgUuidFromClerkId(orgId);
  if (!orgUuid) return [{ value: "_all", label: "All", description: "Matches all member roles", isOrgSpecific: false }];

  // Fetch both global roles (organization_id IS NULL) and org-specific roles
  const { data } = await supabaseAdmin
    .from("organization_member_roles")
    .select("role_code, role_name, description, organization_id")
    .or(`organization_id.is.null,organization_id.eq.${orgUuid}`)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const options: MemberRoleOption[] = [
    { value: "_all", label: "All", description: "Matches all member roles", isOrgSpecific: false },
  ];

  if (data) {
    options.push(
      ...data.map((role) => ({
        value: role.role_code,
        label: role.organization_id
          ? `${role.role_name}`
          : role.role_name,
        description: role.description ?? null,
        isOrgSpecific: !!role.organization_id,
      }))
    );
  }

  return options;
}
