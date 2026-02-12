import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/liveblocks-users?userIds=id1,id2,...
 * Returns user info for the given Clerk user IDs (used by resolveUsers)
 *
 * GET /api/liveblocks-users?search=text
 * Returns matching users for mention suggestions (used by resolveMentionSuggestions)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get("userIds");
    const search = searchParams.get("search");

    // Resolve specific users by IDs
    if (userIds) {
      const ids = userIds.split(",").filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ users: [] });
      }

      const { data: users } = await supabaseAdmin
        .from("users")
        .select("clerk_user_id, full_name, first_name, last_name, image_url")
        .in("clerk_user_id", ids);

      const userMap = new Map(
        (users ?? []).map((u) => [
          u.clerk_user_id,
          {
            name:
              u.full_name ||
              [u.first_name, u.last_name].filter(Boolean).join(" ") ||
              "Anonymous",
            avatar: u.image_url || "",
          },
        ])
      );

      // Return in the same order as requested, with fallbacks
      const resolved = ids.map((id) => userMap.get(id) ?? { name: "Anonymous", avatar: "" });
      return NextResponse.json({ users: resolved });
    }

    // Search users for mention suggestions
    if (search !== null) {
      let query = supabaseAdmin
        .from("users")
        .select("clerk_user_id, full_name, first_name, last_name, image_url")
        .limit(20);

      if (search.trim()) {
        query = query.or(
          `full_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
        );
      }

      const { data: users } = await query;

      const results = (users ?? []).map((u) => ({
        id: u.clerk_user_id,
        name:
          u.full_name ||
          [u.first_name, u.last_name].filter(Boolean).join(" ") ||
          "Anonymous",
        avatar: u.image_url || "",
      }));

      return NextResponse.json({ users: results });
    }

    return NextResponse.json({ users: [] });
  } catch (error) {
    console.error("Liveblocks users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
