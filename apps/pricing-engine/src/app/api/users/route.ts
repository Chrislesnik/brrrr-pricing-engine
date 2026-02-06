import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all active users from the organization
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("clerk_user_id, full_name, first_name, last_name, email, image_url")
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format user data for mentions
    const formattedUsers = (users ?? []).map((user) => ({
      id: user.clerk_user_id,
      name:
        user.full_name ||
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.email ||
        "Unknown User",
      email: user.email || "",
      avatar_url: user.image_url,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
