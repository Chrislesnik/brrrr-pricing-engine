import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/app-settings
 * Returns all app settings as { settings: { [key]: value } }
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("key, value");

    if (error) {
      console.error("[GET /api/app-settings] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settings: Record<string, string> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({ settings });
  } catch (e) {
    console.error("[GET /api/app-settings] Unexpected error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/app-settings
 * Upserts a setting. Body: { key: string, value: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { key, value } = body as { key: string; value: string };

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing or invalid key" }, { status: 400 });
    }
    if (typeof value !== "string") {
      return NextResponse.json({ error: "Value must be a string" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert(
        { key, value, updated_at: new Date().toISOString(), updated_by: userId },
        { onConflict: "key" }
      );

    if (error) {
      console.error("[PUT /api/app-settings] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[PUT /api/app-settings] Unexpected error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
