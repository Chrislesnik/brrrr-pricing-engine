import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkFeatureAccess } from "@/lib/orgs";
import { supabaseAdmin } from "@/lib/supabase-admin";

const VALID_TABS = new Set([
  "general",
  "members",
  "domains",
  "permissions",
  "policies",
  "programs",
  "inputs",
  "documents",
  "tasks",
  "themes",
]);

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ canAccess: false }, { status: 200 });
    }

    const tab = req.nextUrl.searchParams.get("tab");
    const featureName = tab && VALID_TABS.has(tab) ? `settings_${tab}` : null;

    if (featureName) {
      const canAccess = await checkFeatureAccess(featureName, "view").catch(
        () => false
      );

      if (canAccess) {
        return NextResponse.json({ canAccess: true }, { status: 200 });
      }

      // Fallback: if per-tab policy not yet seeded, try legacy hardcoded check
      const { data: policyExists } = await supabaseAdmin
        .from("organization_policies")
        .select("id")
        .eq("resource_type", "feature")
        .eq("resource_name", featureName)
        .eq("action", "view")
        .eq("is_active", true)
        .limit(1);

      if (!policyExists || policyExists.length === 0) {
        return legacyCheck(userId, orgId);
      }

      return NextResponse.json({ canAccess: false }, { status: 200 });
    }

    // No tab param (backward compat, e.g. pipeline-columns) — general check
    const canAccess = await checkFeatureAccess("settings_general", "view").catch(
      () => false
    );

    if (canAccess) {
      return NextResponse.json({ canAccess: true }, { status: 200 });
    }

    // Fallback: try legacy hardcoded check if no policies exist
    const { data: anySettingsPolicy } = await supabaseAdmin
      .from("organization_policies")
      .select("id")
      .eq("resource_type", "feature")
      .like("resource_name", "settings_%")
      .eq("action", "view")
      .eq("is_active", true)
      .limit(1);

    if (!anySettingsPolicy || anySettingsPolicy.length === 0) {
      return legacyCheck(userId, orgId);
    }

    return NextResponse.json({ canAccess: false }, { status: 200 });
  } catch (error) {
    console.error("Error in settings-access:", error);
    return NextResponse.json({ canAccess: false }, { status: 200 });
  }
}

async function legacyCheck(userId: string, orgId: string) {
  const { data } = await supabaseAdmin
    .from("organization_members")
    .select(
      `
      clerk_org_role,
      organizations!inner (
        is_internal_yn,
        clerk_organization_id
      )
    `
    )
    .eq("user_id", userId)
    .eq("organizations.clerk_organization_id", orgId)
    .in("clerk_org_role", ["admin", "owner"])
    .eq("organizations.is_internal_yn", true)
    .limit(1);

  const legacyAccess = data && data.length > 0;
  return NextResponse.json({ canAccess: legacyAccess }, { status: 200 });
}
