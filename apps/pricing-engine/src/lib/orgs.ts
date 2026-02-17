import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * Create a Supabase client authenticated with the caller's Clerk JWT.
 * RPC calls through this client carry the org_id/org_role/member_role
 * claims that the can_access_org_resource() function needs.
 */
async function supabaseForCaller(): Promise<ReturnType<typeof createClient>> {
  const { getToken } = await auth()
  const token = await getToken({ template: "supabase" })
  if (!token) throw new Error("Missing Supabase JWT from Clerk session")

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    },
  )
}

/**
 * Generic policy-engine check. Evaluates the `can_access_org_resource()`
 * RPC for any resource type (table, storage_bucket, feature).
 *
 * @returns true if access is granted, false otherwise
 */
export async function checkPolicyAccess(
  resourceType: string,
  resourceName: string,
  action: string,
): Promise<boolean> {
  const sb = await supabaseForCaller()
  const { data, error } = await sb.rpc("can_access_org_resource", {
    p_resource_type: resourceType,
    p_resource_name: resourceName,
    p_action: action,
  })
  if (error) {
    console.error("checkPolicyAccess RPC error:", error.message)
    return false
  }
  return data === true
}

/**
 * Check whether the current caller has access to a feature via the
 * organization_policies engine.
 *
 * Convenience wrapper around checkPolicyAccess() for feature resources.
 *
 * @returns true if access is granted, false otherwise
 */
export async function checkFeatureAccess(
  featureName: string,
  action: string,
): Promise<boolean> {
  return checkPolicyAccess("feature", featureName, action)
}

/**
 * Assert the current caller has access to a feature. Throws an Error
 * with a 403-appropriate message if denied.
 */
export async function assertFeatureAccess(
  featureName: string,
  action: string,
): Promise<void> {
  const allowed = await checkFeatureAccess(featureName, action)
  if (!allowed) {
    throw Object.assign(
      new Error(`Access denied: you do not have permission to ${action} ${featureName}`),
      { status: 403 },
    )
  }
}

/**
 * Assert policy access for any resource type. Throws on denial.
 */
export async function assertPolicyAccess(
  resourceType: string,
  resourceName: string,
  action: string,
): Promise<void> {
  const allowed = await checkPolicyAccess(resourceType, resourceName, action)
  if (!allowed) {
    throw Object.assign(
      new Error(`Access denied: ${action} on ${resourceType}:${resourceName}`),
      { status: 403 },
    )
  }
}

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


