import { supabaseAdmin } from "@/lib/supabase-admin"

export async function getOrgUuidFromClerkId(clerkOrgId: string | null | undefined): Promise<string | null> {
  if (!clerkOrgId) return null
  function logError(...args: unknown[]) {
     
    console.error(...args)
  }
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", clerkOrgId)
    .single()
  if (error) {
    logError("Failed to resolve organization UUID:", error.message)
    return null
  }
  return (data?.id as string) ?? null
}

/**
 * Get the user's role in an organization
 */
export async function getUserRoleInOrg(orgUuid: string, userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("organization_members")
    .select("clerk_org_role")
    .eq("organization_id", orgUuid)
    .eq("user_id", userId)
    .maybeSingle()
  return (data?.clerk_org_role as string) ?? null
}

/**
 * Check if a role has privileged access (owner or admin)
 */
export function isPrivilegedRole(role: string | null): boolean {
  if (!role) return false
  // Handle both "owner" and "org:owner" formats
  const normalizedRole = role.replace(/^org:/, "")
  return normalizedRole === "owner" || normalizedRole === "admin"
}


