import { Liveblocks } from "@liveblocks/node";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

type RoomType = "deal" | "deal_task" | "email_template";

type LiveblocksPermission =
  | ["room:write"]
  | ["room:read", "room:presence:write"]
  | [];

// ============================================================================
// Policy condition evaluation — mirrors check_org_access SQL logic.
// Sync functions run under service_role which bypasses the RPC, so conditions
// must be evaluated in JS.
// ============================================================================

type UserClaims = {
  orgRole: string;
  memberRole: string;
  isInternal: boolean;
  isInternalOrg: boolean;
  isOwner: boolean;
};

async function getUserClaims(
  clerkUserId: string,
  orgUuid: string,
): Promise<UserClaims> {
  const [memberRes, userRes, orgRes] = await Promise.all([
    supabaseAdmin
      .from("organization_members")
      .select("clerk_org_role, clerk_member_role")
      .eq("organization_id", orgUuid)
      .eq("user_id", clerkUserId)
      .maybeSingle(),
    supabaseAdmin
      .from("users")
      .select("is_internal_yn")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle(),
    supabaseAdmin
      .from("organizations")
      .select("is_internal_yn")
      .eq("id", orgUuid)
      .maybeSingle(),
  ]);

  const orgRole = ((memberRes.data?.clerk_org_role as string) ?? "")
    .toLowerCase()
    .replace(/^org:/, "");
  const memberRole = ((memberRes.data?.clerk_member_role as string) ?? "")
    .toLowerCase()
    .replace(/^org:/, "");

  return {
    orgRole,
    memberRole,
    isInternal: userRes.data?.is_internal_yn === true,
    isInternalOrg: orgRes.data?.is_internal_yn === true,
    isOwner: orgRole === "owner",
  };
}

function evaluateConditionSet(
  ruleOrConfig: Record<string, unknown>,
  claims: UserClaims,
): boolean {
  const connector = (ruleOrConfig.connector as string) ?? "AND";
  const conditions =
    (ruleOrConfig.conditions as Array<{
      field: string;
      operator: string;
      values: string[];
    }>) ?? [];

  if (conditions.length === 0) return false;

  let allMatch = true;
  let anyMatch = false;

  for (const cond of conditions) {
    let fieldVal: string | null = null;
    switch (cond.field) {
      case "org_role":
        fieldVal = claims.orgRole;
        break;
      case "member_role":
        fieldVal = claims.memberRole;
        break;
      case "org_type":
        fieldVal = claims.isInternalOrg ? "internal" : "external";
        break;
      case "internal_user":
        fieldVal = claims.isInternal ? "yes" : "no";
        break;
    }

    if (fieldVal === null) {
      allMatch = false;
      continue;
    }

    let condMatch = false;
    if (cond.operator === "is") {
      condMatch = cond.values.some((v) => v === fieldVal || v === "*");
    } else if (cond.operator === "is_not") {
      condMatch = !cond.values.includes(fieldVal);
    }

    if (condMatch) anyMatch = true;
    else allMatch = false;
  }

  return connector === "AND" ? allMatch : anyMatch;
}

function policyMatchesUser(
  compiledConfig: Record<string, unknown>,
  claims: UserClaims,
): boolean {
  if (
    (compiledConfig.allow_internal_users as boolean) === true &&
    claims.isInternal
  ) {
    return true;
  }

  const version = (compiledConfig.version as number) ?? 2;
  if (version >= 3) {
    const rules =
      (compiledConfig.rules as Array<Record<string, unknown>>) ?? [];
    return rules.some((rule) => evaluateConditionSet(rule, claims));
  }
  return evaluateConditionSet(compiledConfig, claims);
}

// ============================================================================
// Resolve effective Liveblocks permission from matched policy actions
// ============================================================================

function resolvePermissionFromActions(actions: Set<string>): LiveblocksPermission {
  if (actions.has("room_write")) return ["room:write"];
  if (actions.has("room_read") || actions.has("room_presence_write"))
    return ["room:read", "room:presence:write"];
  return [];
}

// ============================================================================
// Ensure room exists with restrictive default access.
// defaultAccesses: [] means only users with explicit usersAccesses can enter.
// ============================================================================

export async function ensureLiveblocksRoom(opts: {
  roomType: RoomType;
  entityId: string;
  organizationId: string;
  creatorUserId: string;
  assignedUserIds?: string[];
}) {
  const roomId = `${opts.roomType}:${opts.entityId}`;

  const usersAccesses: Record<string, ["room:write"]> = {};
  usersAccesses[opts.creatorUserId] = ["room:write"];
  if (opts.assignedUserIds) {
    for (const uid of opts.assignedUserIds) {
      usersAccesses[uid] = ["room:write"];
    }
  }

  try {
    await liveblocks.getOrCreateRoom(roomId, {
      defaultAccesses: [],
      usersAccesses,
      metadata: {
        roomType: opts.roomType,
        entityId: opts.entityId,
        organizationId: opts.organizationId,
      },
    });
  } catch (error) {
    console.error(`[liveblocks] Failed to ensure room ${roomId}:`, error);
  }
}

// ============================================================================
// Grant / revoke helpers
// ============================================================================

export async function grantLiveblocksRoomAccess(opts: {
  roomType: RoomType;
  entityId: string;
  userId: string;
  permission?: "write" | "read";
}) {
  const roomId = `${opts.roomType}:${opts.entityId}`;
  const access: ["room:write"] | ["room:read", "room:presence:write"] =
    opts.permission === "read"
      ? ["room:read", "room:presence:write"]
      : ["room:write"];

  try {
    await liveblocks.updateRoom(roomId, {
      usersAccesses: { [opts.userId]: access },
    });
  } catch (error) {
    console.error(
      `[liveblocks] Failed to grant access on ${roomId} for ${opts.userId}:`,
      error,
    );
  }
}

export async function revokeLiveblocksRoomAccess(opts: {
  roomType: RoomType;
  entityId: string;
  userId: string;
}) {
  const roomId = `${opts.roomType}:${opts.entityId}`;

  try {
    await liveblocks.updateRoom(roomId, {
      usersAccesses: { [opts.userId]: null },
    });
  } catch (error) {
    console.error(
      `[liveblocks] Failed to revoke access on ${roomId} for ${opts.userId}:`,
      error,
    );
  }
}

// ============================================================================
// Room Permission Sync — evaluates organization policies with room_scope
// and pushes per-user permissions to Liveblocks rooms.
// ============================================================================

type PolicyRow = {
  action: string;
  effect: string;
  compiled_config: Record<string, unknown>;
  definition_json: Record<string, unknown>;
};

async function fetchRoomPolicies(
  resourceName: string,
  orgUuid: string,
): Promise<PolicyRow[]> {
  const { data } = await supabaseAdmin
    .from("organization_policies")
    .select("action, effect, compiled_config, definition_json")
    .eq("resource_type", "liveblocks")
    .eq("is_active", true)
    .or(`resource_name.eq.${resourceName},resource_name.eq.*`)
    .or(`org_id.eq.${orgUuid},org_id.is.null`);

  return (data ?? []) as PolicyRow[];
}

/**
 * Evaluate all policies for a given room resource against the user's claims.
 * Returns the effective Liveblocks permission, applying DENY-first logic.
 *
 * @param requireRoomScope  When true, only policies that include a `room_scope`
 *   key in compiled_config are considered. Used by sync functions so that
 *   un-scoped policies (handled at the session level) are skipped.
 */
function resolveEffectivePermission(
  policies: PolicyRow[],
  claims: UserClaims,
  requireRoomScope: boolean,
): LiveblocksPermission {
  if (claims.isOwner) return ["room:write"];

  const deniedActions = new Set<string>();
  const allowedActions = new Set<string>();

  for (const p of policies) {
    const config = (p.compiled_config ??
      p.definition_json) as Record<string, unknown>;

    if (requireRoomScope) {
      const rs = config.room_scope as { level: string } | undefined;
      if (!rs) continue;
    }

    if (!policyMatchesUser(config, claims)) continue;

    const expandAction = (a: string, target: Set<string>) => {
      target.add(a);
      if (a === "all") {
        target.add("room_write");
        target.add("room_read");
        target.add("room_presence_write");
      }
    };

    if (p.effect === "DENY") {
      expandAction(p.action, deniedActions);
    } else {
      expandAction(p.action, allowedActions);
    }
  }

  for (const denied of deniedActions) {
    allowedActions.delete(denied);
  }

  if (allowedActions.size === 0) return [];
  return resolvePermissionFromActions(allowedActions);
}

// ============================================================================
// Sync: deal rooms (room:deal)
// Called when a deal role is assigned or removed.
// ============================================================================

export async function syncDealRoomPermissions(opts: {
  clerkUserId: string;
  dealId: string;
  orgUuid: string;
  assigned: boolean;
}) {
  const { clerkUserId, dealId, orgUuid, assigned } = opts;
  const roomId = `deal:${dealId}`;

  if (!assigned) {
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (userData) {
      const { count } = await supabaseAdmin
        .from("deal_roles")
        .select("id", { count: "exact", head: true })
        .eq("deal_id", dealId)
        .eq("users_id", userData.id);

      if ((count ?? 0) === 0) {
        try {
          await liveblocks.updateRoom(roomId, {
            usersAccesses: { [clerkUserId]: null },
          });
        } catch {
          /* Room may not exist */
        }
      }
    }
    return;
  }

  const [claims, policies] = await Promise.all([
    getUserClaims(clerkUserId, orgUuid),
    fetchRoomPolicies("room:deal", orgUuid),
  ]);

  const permission = resolveEffectivePermission(policies, claims, true);

  type LbAccess = ["room:write"] | ["room:read", "room:presence:write"] | null;
  const resolvedAccess: LbAccess =
    permission.length > 0
      ? (permission as ["room:write"] | ["room:read", "room:presence:write"])
      : null;

  try {
    await liveblocks.updateRoom(roomId, {
      usersAccesses: { [clerkUserId]: resolvedAccess },
    });
  } catch {
    /* Room may not exist yet */
  }
}

// ============================================================================
// Sync: org admin/owner deal room visibility (org-level room_scope)
// ============================================================================

export async function syncOrgAdminDealRoomPermissions(opts: {
  dealId: string;
  orgUuid: string;
}) {
  const { dealId, orgUuid } = opts;
  const roomId = `deal:${dealId}`;

  const policies = await fetchRoomPolicies("room:deal", orgUuid);
  if (!policies.length) return;

  const orgLevelPolicies = policies.filter((p) => {
    const config = (p.compiled_config ??
      p.definition_json) as Record<string, unknown>;
    const rs = config.room_scope as { level: string } | undefined;
    return rs?.level === "org";
  });
  if (!orgLevelPolicies.length) return;

  const { data: admins } = await supabaseAdmin
    .from("organization_members")
    .select("user_id, clerk_org_role, clerk_member_role")
    .eq("organization_id", orgUuid)
    .in("clerk_org_role", ["org:admin", "admin", "org:owner", "owner"]);

  if (!admins?.length) return;

  const adminUserIds = admins
    .map((a) => a.user_id as string)
    .filter(Boolean);

  const [userRows, orgRes] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("clerk_user_id, is_internal_yn")
      .in("clerk_user_id", adminUserIds),
    supabaseAdmin
      .from("organizations")
      .select("is_internal_yn")
      .eq("id", orgUuid)
      .maybeSingle(),
  ]);

  const userInternalMap = new Map(
    (userRows.data ?? []).map((u) => [
      u.clerk_user_id as string,
      u.is_internal_yn === true,
    ]),
  );
  const isInternalOrg = orgRes.data?.is_internal_yn === true;

  type LbAccess = ["room:write"] | ["room:read", "room:presence:write"] | null;
  const usersAccesses: Record<string, LbAccess> = {};

  for (const admin of admins) {
    if (!admin.user_id) continue;
    const uid = admin.user_id as string;
    const role = ((admin.clerk_org_role as string) ?? "")
      .toLowerCase()
      .replace(/^org:/, "");

    const claims: UserClaims = {
      orgRole: role,
      memberRole: ((admin.clerk_member_role as string) ?? "")
        .toLowerCase()
        .replace(/^org:/, ""),
      isInternal: userInternalMap.get(uid) ?? false,
      isInternalOrg,
      isOwner: role === "owner",
    };

    const perm = resolveEffectivePermission(orgLevelPolicies, claims, true);
    usersAccesses[uid] =
      perm.length > 0
        ? (perm as ["room:write"] | ["room:read", "room:presence:write"])
        : null;
  }

  if (Object.keys(usersAccesses).length === 0) return;

  try {
    await liveblocks.updateRoom(roomId, { usersAccesses });
  } catch {
    /* Room may not exist yet */
  }
}

// ============================================================================
// Sync: deal task rooms (room:deal_task)
// Called when a task is assigned/unassigned.
// ============================================================================

export async function syncDealTaskRoomPermissions(opts: {
  clerkUserId: string;
  taskId: string;
  orgUuid: string;
  assigned: boolean;
}) {
  const { clerkUserId, taskId, orgUuid, assigned } = opts;
  const roomId = `deal_task:${taskId}`;

  if (!assigned) {
    try {
      await liveblocks.updateRoom(roomId, {
        usersAccesses: { [clerkUserId]: null },
      });
    } catch {
      /* Room may not exist */
    }
    return;
  }

  const [claims, policies] = await Promise.all([
    getUserClaims(clerkUserId, orgUuid),
    fetchRoomPolicies("room:deal_task", orgUuid),
  ]);

  const permission = resolveEffectivePermission(policies, claims, false);

  type LbAccess = ["room:write"] | ["room:read", "room:presence:write"] | null;
  const resolvedAccess: LbAccess =
    permission.length > 0
      ? (permission as ["room:write"] | ["room:read", "room:presence:write"])
      : null;

  try {
    await liveblocks.updateRoom(roomId, {
      usersAccesses: { [clerkUserId]: resolvedAccess },
    });
  } catch {
    /* Room may not exist yet */
  }
}
