import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

// GET: Load organization's saved theme
export async function GET() {
  try {
    const { orgId } = await auth()
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { data, error } = await supabaseAdmin
      .from("organization_themes")
      .select("theme_light, theme_dark")
      .eq("organization_id", orgUuid)
      .maybeSingle()
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    // Return empty themes if none saved yet
    if (!data) {
      return NextResponse.json({ light: {}, dark: {} })
    }

    return NextResponse.json({
      light: data.theme_light ?? {},
      dark: data.theme_dark ?? {},
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST: Save organization's theme
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId, orgRole } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    
    // Only org owners and admins can save themes
    const canEdit = orgRole === "org:owner" || orgRole === "owner" || orgRole === "org:admin" || orgRole === "admin"
    if (!canEdit) {
      return NextResponse.json({ error: "Only organization owners and admins can update themes" }, { status: 403 })
    }
    
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const body = (await req.json().catch(() => ({}))) as {
      light?: Record<string, string>
      dark?: Record<string, string>
    }

    const themeLight = body.light ?? {}
    const themeDark = body.dark ?? {}

    // Upsert the theme (insert or update)
    const { error } = await supabaseAdmin
      .from("organization_themes")
      .upsert(
        {
          organization_id: orgUuid,
          theme_light: themeLight,
          theme_dark: themeDark,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE: Reset organization's theme to defaults
export async function DELETE() {
  try {
    const { userId, orgId, orgRole } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    
    // Only org owners and admins can delete themes
    const canEdit = orgRole === "org:owner" || orgRole === "owner" || orgRole === "org:admin" || orgRole === "admin"
    if (!canEdit) {
      return NextResponse.json({ error: "Only organization owners and admins can reset themes" }, { status: 403 })
    }
    
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { error } = await supabaseAdmin
      .from("organization_themes")
      .delete()
      .eq("organization_id", orgUuid)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
