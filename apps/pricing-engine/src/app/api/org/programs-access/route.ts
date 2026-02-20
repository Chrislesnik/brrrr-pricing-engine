import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkFeatureAccess } from "@/lib/orgs";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ canAccess: false }, { status: 200 });
    }

    // Policy engine check: feature:settings_programs/view
    const canAccess = await checkFeatureAccess("settings_programs", "view").catch(() => false);

    if (canAccess) {
      return NextResponse.json({ canAccess: true }, { status: 200 });
    }

    // Fallback: if no feature:settings_programs policy exists yet (migration not applied),
    // use the original hardcoded query to avoid locking users out.
    const { data: policyExists } = await supabaseAdmin
      .from("organization_policies")
      .select("id")
      .eq("resource_type", "feature")
      .eq("resource_name", "settings_programs")
      .eq("action", "view")
      .eq("is_active", true)
      .limit(1);

    if (!policyExists || policyExists.length === 0) {
      // No policy seeded yet — fall back to legacy hardcoded check
      const { data } = await supabaseAdmin
        .from("organization_members")
        .select(`
          clerk_org_role,
          organizations!inner (
            is_internal_yn,
            clerk_organization_id
          )
        `)
        .eq("user_id", userId)
        .eq("organizations.clerk_organization_id", orgId)
        .in("clerk_org_role", ["admin", "owner"])
        .eq("organizations.is_internal_yn", true)
        .limit(1);

      const legacyAccess = data && data.length > 0;
      return NextResponse.json({ canAccess: legacyAccess }, { status: 200 });
    }

    return NextResponse.json({ canAccess: false }, { status: 200 });
  } catch (error) {
    console.error("Error in programs-access:", error);
    return NextResponse.json({ canAccess: false }, { status: 200 });
  }
}
