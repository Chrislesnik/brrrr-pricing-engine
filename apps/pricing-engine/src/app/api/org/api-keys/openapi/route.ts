import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { checkFeatureAccess, getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { generateOpenApiSpec } from "@/lib/openapi-generator"

/**
 * GET /api/org/api-keys/openapi
 *
 * Returns an OpenAPI 3.0.3 JSON spec scoped to the active API key policies
 * for the caller's organization. Optionally filter to a specific key's scopes
 * via `?scopes=read:deals,write:deals`.
 *
 * Supports `?format=yaml` for YAML output (via JSON — consumers can convert).
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canView = await checkFeatureAccess("settings_api_keys", "view").catch(
      () => false,
    )
    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId)

    const scopeParam = req.nextUrl.searchParams.get("scopes")
    let scopes: string[] | undefined

    if (scopeParam) {
      scopes = scopeParam.split(",").map((s) => s.trim()).filter(Boolean)
    } else {
      const { data: policies } = await supabaseAdmin
        .from("organization_policies")
        .select("resource_name, action")
        .eq("resource_type", "api_key")
        .eq("is_active", true)
        .is("archived_at", null)
        .or(
          orgUuid
            ? `org_id.eq.${orgUuid},org_id.is.null`
            : "org_id.is.null",
        )

      if (policies && policies.length > 0) {
        scopes = (policies as Array<{ resource_name: string; action: string }>)
          .filter((row) => row.action === "read" || row.action === "write")
          .map((row) => `${row.action}:${row.resource_name}`)
      }
    }

    const { data: orgRow } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("clerk_organization_id", orgId)
      .maybeSingle()

    const baseUrl = req.nextUrl.origin
    const spec = generateOpenApiSpec({
      baseUrl,
      scopes,
      orgName: (orgRow?.name as string) ?? undefined,
    })

    return NextResponse.json(spec, {
      headers: {
        "Content-Disposition": 'inline; filename="openapi.json"',
      },
    })
  } catch (error) {
    console.error("Error generating OpenAPI spec:", error)
    return NextResponse.json(
      { error: "Failed to generate OpenAPI spec" },
      { status: 500 },
    )
  }
}
