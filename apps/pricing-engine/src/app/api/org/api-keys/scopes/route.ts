import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkFeatureAccess } from "@/lib/orgs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";
import { API_RESOURCES } from "@/app/(pricing-engine)/org/[orgId]/settings/policies/constants";

/**
 * Returns the list of API key scopes that are currently enabled for
 * this organization, based on active `api_key` policies.
 *
 * The API Keys creation dialog fetches this to populate its scope picker.
 */
export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canView = await checkFeatureAccess("settings_api_keys", "view").catch(
      () => false
    );
    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);

    const { data: policies } = await supabaseAdmin
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

    if (!policies || policies.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const labelMap = new Map(API_RESOURCES.map((r) => [r.name, r.label]));

    const scopes = (policies as Array<{ resource_name: string; action: string }>)
      .filter((row) => row.action === "read" || row.action === "write")
      .map((row) => ({
        value: `${row.action}:${row.resource_name}`,
        label: `${row.action === "read" ? "Read" : "Write"} ${labelMap.get(row.resource_name) ?? row.resource_name}`,
        group: labelMap.get(row.resource_name) ?? row.resource_name,
        resource: row.resource_name,
        action: row.action,
      }));

    return NextResponse.json({ data: scopes });
  } catch (error) {
    console.error("Error fetching API scopes:", error);
    return NextResponse.json(
      { error: "Failed to fetch available scopes" },
      { status: 500 }
    );
  }
}
