"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

export async function getMemberRolesForPolicies(): Promise<
  Array<{ value: string; label: string }>
> {
  const { orgId } = await auth();
  if (!orgId) return [{ value: "*", label: "Any member role" }];

  const orgUuid = await getOrgUuidFromClerkId(orgId);
  if (!orgUuid) return [{ value: "*", label: "Any member role" }];

  const { data } = await supabaseAdmin
    .from("organization_member_roles")
    .select("role_code, role_name")
    .eq("organization_id", orgUuid)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const options = [{ value: "*", label: "Any member role" }];
  
  if (data) {
    options.push(
      ...data.map((role) => ({
        value: role.role_code,
        label: role.role_name,
      }))
    );
  }

  return options;
}
