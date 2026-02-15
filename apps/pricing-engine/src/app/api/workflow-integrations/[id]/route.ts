import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

/** Fields that should be masked in API responses */
const SECRET_FIELD_PATTERNS = [
  "key", "token", "secret", "password", "url",
]

function isSecretField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase()
  return SECRET_FIELD_PATTERNS.some((p) => lower.includes(p))
}

function stripSecrets(config: Record<string, unknown>): Record<string, string> {
  const stripped: Record<string, string> = {}
  for (const [key, value] of Object.entries(config)) {
    if (isSecretField(key) && typeof value === "string" && value.trim()) {
      stripped[key] = "configured"
    } else {
      stripped[key] = String(value ?? "")
    }
  }
  return stripped
}

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }

    const { id } = await context.params

    const body = await req.json().catch(() => ({}))
    const name = body.name as string | undefined
    const config = body.config as Record<string, unknown> | undefined

    // Build update payload
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (config !== undefined) {
      // If config contains "configured" placeholders, merge with existing config
      // to preserve unchanged secrets
      const { data: existing } = await supabaseAdmin
        .from("workflow_integrations")
        .select("config")
        .eq("id", id)
        .eq("organization_id", orgUuid)
        .eq("user_id", userId)
        .single()

      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      const existingConfig = (existing.config as Record<string, unknown>) || {}
      const mergedConfig = { ...existingConfig }

      for (const [key, value] of Object.entries(config)) {
        // Skip "configured" placeholder values — keep existing secret
        if (value === "configured") continue
        mergedConfig[key] = value
      }

      updates.config = mergedConfig
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("workflow_integrations")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .select("id, type, name, config, created_at, updated_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      integration: {
        id: data.id as string,
        name: (data.name as string) || "",
        type: data.type as string,
        config: stripSecrets((data.config as Record<string, unknown>) || {}),
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }

    const { id } = await context.params

    // Check for restore action
    const url = new URL(_req.url)
    if (url.searchParams.get("action") === "restore") {
      const { error } = await supabaseAdmin
        .from("workflow_integrations")
        .update({ archived_at: null, archived_by: null })
        .eq("id", id)
        .eq("organization_id", orgUuid)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Archive instead of delete
    const now = new Date().toISOString()
    const { error } = await supabaseAdmin
      .from("workflow_integrations")
      .update({ archived_at: now, archived_by: userId })
      .eq("id", id)
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
