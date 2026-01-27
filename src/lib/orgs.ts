import { supabaseAdmin } from "@/lib/supabase-admin"

export async function getOrgUuidFromClerkId(clerkOrgId: string | null | undefined): Promise<string | null> {
  if (!clerkOrgId) return null
  function logError(...args: unknown[]) {
    // eslint-disable-next-line no-console
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
    .select("role")
    .eq("organization_id", orgUuid)
    .eq("user_id", userId)
    .maybeSingle()
  return (data?.role as string) ?? null
}

/**
 * Check if a role has privileged access (owner or admin)
 */
export function isPrivilegedRole(role: string | null): boolean {
  return role === "owner" || role === "admin"
}


