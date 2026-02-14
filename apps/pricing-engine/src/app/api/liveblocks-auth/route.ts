import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Fetch user info from Supabase
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("full_name, first_name, last_name, image_url")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    const name =
      user?.full_name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
      "Anonymous";
    const avatar = user?.image_url || "";

    // Create a session and grant access to all deal rooms
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name,
        avatar,
      },
    });

    // Grant full access to all deal:* and task:* rooms (auto-creates rooms on first connect)
    session.allow("deal:*", session.FULL_ACCESS);
    session.allow("task:*", session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
