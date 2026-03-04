import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkFeatureAccess, getOrgUuidFromClerkId } from "@/lib/orgs";
import { supabaseAdmin } from "@/lib/supabase-admin";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

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

function parseJsonMaybe(value: string | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRunTests = await resolveCapability(orgId, {
      featureName: "settings_webhook_tester",
      action: "submit",
      fallbackFeatureName: "settings_api_keys",
      fallbackAction: "insert",
    });

    if (!canRunTests) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const {
      url,
      method,
      headers,
      body,
      apiKeyId,
    }: {
      url?: string;
      method?: HttpMethod;
      headers?: Record<string, string>;
      body?: string;
      apiKeyId?: string;
    } = await req.json();

    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "A valid http(s) URL is required" },
        { status: 400 }
      );
    }

    const requestMethod: HttpMethod = method ?? "POST";
    const requestHeaders = headers ?? {};
    const started = performance.now();

    const response = await fetch(url, {
      method: requestMethod,
      headers: requestHeaders,
      body: requestMethod === "GET" ? undefined : body,
    });

    const duration = Math.round(performance.now() - started);
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody: unknown;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (orgUuid) {
      await supabaseAdmin.from("api_request_activity_logs").insert({
        org_id: orgUuid,
        actor_user_id: userId,
        source: "webhook_tester",
        endpoint: url,
        method: requestMethod,
        status_code: response.status,
        duration_ms: duration,
        api_key_id: apiKeyId ?? null,
        request_headers: requestHeaders,
        request_body: parseJsonMaybe(body),
        response_headers: responseHeaders,
        response_body: responseBody,
      });
    }

    return NextResponse.json({
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        timing: duration,
      },
    });
  } catch (error) {
    console.error("Error running webhook test:", error);
    return NextResponse.json(
      { error: "Failed to run webhook test" },
      { status: 500 }
    );
  }
}
