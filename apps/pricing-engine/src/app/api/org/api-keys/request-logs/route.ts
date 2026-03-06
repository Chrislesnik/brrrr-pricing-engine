import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canViewLogs = await resolveCapability(orgId, {
      featureName: "settings_api_request_logs",
      action: "view",
      fallbackFeatureName: "settings_api_keys",
      fallbackAction: "view",
    });

    if (!canViewLogs) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ data: [] });
    }

    const status = req.nextUrl.searchParams.get("status");
    const method = req.nextUrl.searchParams.get("method");
    const q = req.nextUrl.searchParams.get("q");
    const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 200)
      : 50;

    let query = supabaseAdmin
      .from("api_request_activity_logs")
      .select(
        "id, endpoint, method, status_code, duration_ms, api_key_id, source, error_message, request_headers, request_body, response_headers, response_body, created_at"
      )
      .eq("org_id", orgUuid)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      const statusCode = Number(status);
      if (Number.isFinite(statusCode)) {
        query = query.eq("status_code", statusCode);
      }
    }
    if (method) {
      query = query.eq("method", method.toUpperCase());
    }
    if (q) {
      query = query.or(`endpoint.ilike.%${q}%,api_key_id.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("Could not find")) {
        return NextResponse.json({ data: [] });
      }
      console.error("Error loading API request logs:", error);
      return NextResponse.json(
        { error: "Failed to load API request logs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("Error in request-logs route:", error);
    return NextResponse.json(
      { error: "Failed to load API request logs" },
      { status: 500 }
    );
  }
}
