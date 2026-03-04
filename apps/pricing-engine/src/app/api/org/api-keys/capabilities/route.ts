import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkFeatureAccess, getOrgUuidFromClerkId } from "@/lib/orgs";
import { supabaseAdmin } from "@/lib/supabase-admin";

type CapabilityCheck = {
  featureName: string;
  action: "view" | "insert" | "delete" | "submit";
  fallbackFeatureName: string;
  fallbackAction: "view" | "insert" | "delete";
};

async function hasPolicyForFeature(
  orgId: string,
  featureName: string,
  action: "view" | "insert" | "delete" | "submit"
): Promise<boolean> {
  const orgUuid = await getOrgUuidFromClerkId(orgId);

  const { data } = await supabaseAdmin
    .from("organization_policies")
    .select("id")
    .eq("resource_type", "feature")
    .eq("resource_name", featureName)
    .eq("action", action)
    .eq("is_active", true)
    .is("archived_at", null)
    .or(orgUuid ? `org_id.eq.${orgUuid},org_id.is.null` : "org_id.is.null")
    .limit(1)
    .maybeSingle();

  return !!data;
}

async function resolveCapability(
  orgId: string,
  check: CapabilityCheck
): Promise<boolean> {
  const hasDedicatedPolicy = await hasPolicyForFeature(
    orgId,
    check.featureName,
    check.action
  ).catch(() => false);

  if (hasDedicatedPolicy) {
    return checkFeatureAccess(check.featureName, check.action).catch(() => false);
  }

  return checkFeatureAccess(check.fallbackFeatureName, check.fallbackAction).catch(
    () => false
  );
}

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [canViewKeys, canCreateKeys, canRevokeKeys] = await Promise.all([
      checkFeatureAccess("settings_api_keys", "view").catch(() => false),
      checkFeatureAccess("settings_api_keys", "insert").catch(() => false),
      checkFeatureAccess("settings_api_keys", "delete").catch(() => false),
    ]);

    const [canViewRequestLogs, canViewWebhookTester, canRunWebhookTests] =
      await Promise.all([
        resolveCapability(orgId, {
          featureName: "settings_api_request_logs",
          action: "view",
          fallbackFeatureName: "settings_api_keys",
          fallbackAction: "view",
        }),
        resolveCapability(orgId, {
          featureName: "settings_webhook_tester",
          action: "view",
          fallbackFeatureName: "settings_api_keys",
          fallbackAction: "view",
        }),
        resolveCapability(orgId, {
          featureName: "settings_webhook_tester",
          action: "submit",
          fallbackFeatureName: "settings_api_keys",
          fallbackAction: "insert",
        }),
      ]);

    return NextResponse.json({
      data: {
        canViewKeys,
        canCreateKeys,
        canRevokeKeys,
        canManageKeys: canCreateKeys || canRevokeKeys,
        canViewRequestLogs,
        canViewWebhookTester,
        canRunWebhookTests,
      },
    });
  } catch (error) {
    console.error("Error fetching API keys capabilities:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys capabilities" },
      { status: 500 }
    );
  }
}
