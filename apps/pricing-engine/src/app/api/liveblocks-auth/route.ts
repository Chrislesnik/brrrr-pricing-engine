import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { liveblocks } from "@/lib/liveblocks";

type LiveblocksPermission =
  | ["room:write"]
  | ["room:read", "room:presence:write"];

/**
 * Room patterns mapped to the policy resource they're governed by.
 * `task:*` shares policies with `deal_task` since task rooms are deal-task
 * collaboration rooms.
 */
const ROOM_POLICY_MAP: Array<{ pattern: string; resource: string }> = [
  { pattern: "deal:*", resource: "room:deal" },
  { pattern: "deal_task:*", resource: "room:deal_task" },
  { pattern: "task:*", resource: "room:deal_task" },
  { pattern: "email_template:*", resource: "room:email_template" },
  { pattern: "appraisal:*", resource: "room:appraisal" },
];

function supabaseForUser(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    },
  );
}

/**
 * For a given Liveblocks resource (e.g. "room:deal"), call the
 * `can_access_org_resource` RPC for each action tier and return the
 * highest permission level the user qualifies for.
 *
 * The RPC already handles condition evaluation and DENY-first logic
 * via the user's Supabase JWT claims.
 */
async function resolveRoomPermission(
  supabase: ReturnType<typeof createClient>,
  resource: string,
): Promise<LiveblocksPermission | null> {
  const [writeRes, readRes, presenceRes] = await Promise.all([
    supabase.rpc("can_access_org_resource", {
      p_resource_type: "liveblocks",
      p_resource_name: resource,
      p_action: "room_write",
    }),
    supabase.rpc("can_access_org_resource", {
      p_resource_type: "liveblocks",
      p_resource_name: resource,
      p_action: "room_read",
    }),
    supabase.rpc("can_access_org_resource", {
      p_resource_type: "liveblocks",
      p_resource_name: resource,
      p_action: "room_presence_write",
    }),
  ]);

  if (writeRes.data === true) return ["room:write"];
  if (readRes.data === true || presenceRes.data === true) {
    return ["room:read", "room:presence:write"];
  }
  return null;
}

export async function POST() {
  try {
    const { userId, orgId, getToken } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userResult = await supabaseAdmin
      .from("users")
      .select("full_name, first_name, last_name, image_url")
      .eq("clerk_user_id", userId)
      .maybeSingle()
      .then((r) => r.data);

    const name =
      userResult?.full_name ||
      [userResult?.first_name, userResult?.last_name]
        .filter(Boolean)
        .join(" ") ||
      "Anonymous";
    const avatar = (userResult?.image_url as string) || "";

    const session = liveblocks.prepareSession(userId, {
      userInfo: { name, avatar },
    });

    if (orgId) {
      let supabaseToken: string | null = null;
      try {
        supabaseToken = await getToken({ template: "supabase" });
      } catch {
        console.warn("[liveblocks-auth] Failed to get Supabase token; no room access granted");
      }

      if (supabaseToken) {
        const supabase = supabaseForUser(supabaseToken);

        const results = await Promise.all(
          ROOM_POLICY_MAP.map(async ({ pattern, resource }) => {
            const perm = await resolveRoomPermission(supabase, resource);
            return { pattern, permission: perm };
          }),
        );

        for (const { pattern, permission } of results) {
          if (permission) {
            session.allow(pattern, permission);
          }
        }
      }

      session.allow(`org:${orgId}:*`, session.FULL_ACCESS);
    }

    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
