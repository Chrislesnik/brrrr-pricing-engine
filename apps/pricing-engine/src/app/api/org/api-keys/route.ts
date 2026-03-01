import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkFeatureAccess, getOrgUuidFromClerkId } from "@/lib/orgs";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canView = await checkFeatureAccess("settings_api_keys", "view").catch(() => false);
    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const clerk = await clerkClient();
    const apiKeys = await clerk.apiKeys.list({
      subject: orgId,
      includeInvalid: false,
    });

    return NextResponse.json({ data: apiKeys.data ?? apiKeys });
  } catch (error) {
    console.error("Error listing API keys:", error);
    return NextResponse.json({ error: "Failed to list API keys" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canCreate = await checkFeatureAccess("settings_api_keys", "insert").catch(() => false);
    if (!canCreate) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, scopes, secondsUntilExpiration } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json({ error: "At least one scope is required" }, { status: 400 });
    }

    // Validate every requested scope against active api_key policies
    const orgUuid = await getOrgUuidFromClerkId(orgId);
    const { data: activePolicies } = await supabaseAdmin
      .from("organization_policies")
      .select("resource_name, action")
      .eq("resource_type", "api_key")
      .eq("is_active", true)
      .is("archived_at", null)
      .or(
        orgUuid
          ? `org_id.eq.${orgUuid},org_id.is.null`
          : "org_id.is.null"
      );

    const enabledScopes = new Set(
      (activePolicies ?? []).map(
        (p: { resource_name: string; action: string }) =>
          `${p.action}:${p.resource_name}`
      )
    );

    const invalidScopes = (scopes as string[]).filter((s) => !enabledScopes.has(s));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: `These scopes are not enabled by any active API Access policy: ${invalidScopes.join(", ")}` },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();
    const apiKey = await clerk.apiKeys.create({
      name: name.trim(),
      subject: orgId,
      description: description?.trim() || undefined,
      scopes,
      createdBy: userId,
      secondsUntilExpiration: secondsUntilExpiration || undefined,
    });

    return NextResponse.json({ data: apiKey });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canDelete = await checkFeatureAccess("settings_api_keys", "delete").catch(() => false);
    if (!canDelete) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { apiKeyId, revocationReason } = await req.json();

    if (!apiKeyId) {
      return NextResponse.json({ error: "API key ID is required" }, { status: 400 });
    }

    const clerk = await clerkClient();
    await clerk.apiKeys.revoke({
      apiKeyId,
      revocationReason: revocationReason || "Revoked by organization admin",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}
