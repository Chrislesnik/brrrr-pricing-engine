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

/** Strip secret values from config, replacing with "configured" */
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

export async function GET(req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }

    const type = req.nextUrl.searchParams.get("type")
    const id = req.nextUrl.searchParams.get("id")

    let query = supabaseAdmin
      .from("integration_setup")
      .select("id, type, name, config, created_at, updated_at")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)

    if (type) {
      query = query.eq("type", type)
    }
    if (id) {
      query = query.eq("id", id)
    }

    const { data, error } = await query.order("created_at", { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If fetching by id, return single item with full config (for update flows)
    if (id) {
      const item = data?.[0]
      if (!item) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      return NextResponse.json({
        integration: {
          id: item.id,
          name: item.name || "",
          type: item.type,
          config: stripSecrets((item.config as Record<string, unknown>) || {}),
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        },
      })
    }

    // Return list with stripped secrets
    const integrations = (data ?? []).map((row) => ({
      id: row.id as string,
      name: (row.name as string) || "",
      type: row.type as string,
      config: stripSecrets((row.config as Record<string, unknown>) || {}),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }))

    return NextResponse.json({ integrations })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const type = body.type as string | undefined
    const name = (body.name as string | undefined) || null
    const config = (body.config as Record<string, unknown>) || {}

    if (!type) {
      return NextResponse.json({ error: "Missing type" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("integration_setup")
      .insert({
        organization_id: orgUuid,
        user_id: userId,
        type,
        name,
        config,
      })
      .select("id, type, name, config, created_at, updated_at")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An integration of this type already exists with that name" },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
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
