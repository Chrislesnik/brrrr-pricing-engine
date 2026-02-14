import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/appraisal-amcs
 * List all AMCs for the current org.
 */
export async function GET() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from("appraisal_amcs")
      .select("*")
      .eq("organization_id", orgUuid)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("[GET /api/appraisal-amcs] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ amcs: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * POST /api/appraisal-amcs
 * Create a new AMC.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { name } = body
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from("appraisal_amcs")
      .insert({ organization_id: orgUuid, name: name.trim() })
      .select("*")
      .single()

    if (error) {
      console.error("[POST /api/appraisal-amcs] error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ amc: data })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
