import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"
import { supabaseAdmin } from "@/lib/supabase-admin"

export { isPrivilegedRole } from "@/lib/utils"

/**
 * Create a Supabase client authenticated with the caller's Clerk JWT.
 * RPC calls through this client carry the org_id/org_role/member_role
 * claims that the can_access_org_resource() function needs.
 */
async function supabaseForCaller() {
  const { getToken } = await auth()
  const token = await getToken({ template: "supabase" })
  if (!token) throw new Error("Missing Supabase JWT from Clerk session")

  return createClient<Database>(
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
  let sb
  try {
    sb = await supabaseForCaller()
  } catch (err) {
    console.error(
      `checkPolicyAccess: failed to create authenticated Supabase client for ${action} on ${resourceType}:${resourceName}`,
      err instanceof Error ? err.message : err,
    )
    return false
  }
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
 * Check whether the current caller can access a route resource via
 * organization_policies. Falls back to the wildcard route policy.
 */
export async function checkRouteAccess(
  routeName: string,
  action: "select" | "insert" | "update" | "delete",
): Promise<boolean> {
  const allowedSpecific = await checkPolicyAccess("route", routeName, action)
  if (allowedSpecific) return true
  return checkPolicyAccess("route", "*", action)
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
 * Assert the current caller has access to a route resource. Throws on denial.
 */
export async function assertRouteAccess(
  routeName: string,
  action: "select" | "insert" | "update" | "delete",
): Promise<void> {
  const allowed = await checkRouteAccess(routeName, action)
  if (!allowed) {
    throw Object.assign(
      new Error(`Access denied: ${action} on route:${routeName}`),
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

/**
 * Middleware-style resource access guard for API routes.
 * Evaluates the policy engine and returns a 403 NextResponse on denial,
 * or null if access is granted. Usage:
 *
 *   const denied = await assertResourceAccess("table", "deals", "select");
 *   if (denied) return denied;
 */
export async function assertResourceAccess(
  resourceType: string,
  resourceName: string,
  action: string,
): Promise<Response | null> {
  const allowed = await checkPolicyAccess(resourceType, resourceName, action)
  if (!allowed) {
    return Response.json(
      { error: `Access denied: ${action} on ${resourceType}:${resourceName}` },
      { status: 403 },
    )
  }
  return null
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
 * Authenticate an API route that may accept Clerk API keys in addition
 * to session tokens.  The decision of whether to accept API keys is
 * driven by the organization's `api_key` policies.
 *
 * Flow:
 *   1. Call `auth({ acceptsToken: ['session_token', 'api_key'] })`
 *   2. If the token is an API key:
 *      a. Look up the org's active `api_key` policy for (resourceName, action)
 *      b. Verify the API key carries the required scope (`read:<resource>` or `write:<resource>`)
 *   3. If the token is a session, proceed as normal.
 *
 * Returns the resolved auth context. Throws on 401/403.
 */
export async function authForApiRoute(
  resourceName: string,
  action: "read" | "write",
): Promise<{
  userId: string
  orgId: string
  isApiKey: boolean
}> {
  // Clerk returns { isAuthenticated, userId, orgId, tokenType, scopes }
  // when acceptsToken includes 'api_key'.
  const session = await auth({ acceptsToken: ["session_token", "api_key"] }) as {
    userId: string | null
    orgId: string | null
    sessionId: string | null
    tokenType?: string
    scopes?: string[]
    isAuthenticated?: boolean
    sessionClaims: Record<string, unknown> | null
  }

  const userId = session.userId
  const orgId = session.orgId
  if (!userId || !orgId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 })
  }

  const isApiKey = session.tokenType === "api_key"

  if (isApiKey) {
    const orgUuid = await getOrgUuidFromClerkId(orgId)

    const { data: policyRow } = await supabaseAdmin
      .from("organization_policies")
      .select("id")
      .eq("resource_type", "api_key")
      .eq("resource_name", resourceName)
      .eq("action", action)
      .eq("is_active", true)
      .is("archived_at", null)
      .or(
        orgUuid
          ? `org_id.eq.${orgUuid},org_id.is.null`
          : "org_id.is.null"
      )
      .limit(1)
      .maybeSingle()

    if (!policyRow) {
      throw Object.assign(
        new Error(`API key access is not enabled for ${action}:${resourceName}`),
        { status: 403 },
      )
    }

    const requiredScope = `${action}:${resourceName}`
    const scopes = session.scopes ?? []

    if (!scopes.includes(requiredScope)) {
      throw Object.assign(
        new Error(`Missing required scope: ${requiredScope}`),
        { status: 403 },
      )
    }
  }

  return { userId, orgId, isApiKey }
}

/**
 * Checks whether API key access is enabled for a given resource and action
 * in the caller's current organization. Uses the service-role client since
 * API key requests don't carry a Supabase JWT.
 */
export async function isApiResourceEnabled(
  orgId: string,
  resourceName: string,
  action: "read" | "write",
): Promise<boolean> {
  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return false

  const { data } = await supabaseAdmin
    .from("organization_policies")
    .select("id")
    .eq("resource_type", "api_key")
    .eq("resource_name", resourceName)
    .eq("action", action)
    .eq("is_active", true)
    .is("archived_at", null)
    .or(`org_id.eq.${orgUuid},org_id.is.null`)
    .limit(1)
    .maybeSingle()

  return !!data
}

/**
 * Policy-engine-aware deal access check. Combines:
 *   Layer 1 – Coarse-grained org policy (table:deals action)
 *   Layer 2 – Fine-grained domain logic (org membership, assignment, primary user, internal)
 *
 * Call sites pass the HTTP-method-appropriate action so that
 * DENY policies on specific actions (e.g. DELETE) are enforced.
 */
export async function checkDealAccess(
  deal: { organization_id: string; assigned_to_user_id: unknown; primary_user_id: string | null },
  userId: string,
  orgId: string | null | undefined,
  action: "select" | "insert" | "update" | "delete",
): Promise<boolean> {
  const policyAllowed = await checkPolicyAccess("table", "deals", action)
  if (!policyAllowed) return false

  const userOrgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null
  const hasOrgAccess = userOrgUuid && deal.organization_id === userOrgUuid

  const assignedUsers = Array.isArray(deal.assigned_to_user_id)
    ? deal.assigned_to_user_id
    : []
  const isAssigned = assignedUsers.includes(userId)
  const isPrimaryUser = deal.primary_user_id === userId

  let isInternal = false
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id, is_internal_yn")
    .eq("clerk_user_id", userId)
    .maybeSingle()

  if (userRow) {
    isInternal = Boolean(userRow.is_internal_yn)
  }

  return Boolean(hasOrgAccess || isAssigned || isPrimaryUser || isInternal)
}
