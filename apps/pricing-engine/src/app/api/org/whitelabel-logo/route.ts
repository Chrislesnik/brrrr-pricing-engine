import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

function getObjectPathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    // Expected: https://<project>.supabase.co/storage/v1/object/public/org-assets/<path>
    const marker = "/storage/v1/object/public/org-assets/"
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    const p = url.slice(idx + marker.length)
    return decodeURIComponent(p)
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No org" }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("whitelabel_logo_light_url, whitelabel_logo_dark_url")
      .eq("id", orgUuid)
      .single()
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    return NextResponse.json({ 
      light_url: (data?.whitelabel_logo_light_url as string | undefined) ?? null,
      dark_url: (data?.whitelabel_logo_dark_url as string | undefined) ?? null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No org" }, { status: 400 })

    // Fetch existing URLs to remove after successful replacement
    const { data: current } = await supabaseAdmin
      .from("organizations")
      .select("whitelabel_logo_light_url, whitelabel_logo_dark_url")
      .eq("id", orgUuid)
      .single()
    
    const previousLightUrl = (current?.whitelabel_logo_light_url as string | undefined) ?? null
    const previousDarkUrl = (current?.whitelabel_logo_dark_url as string | undefined) ?? null

    let lightUrl: string | null = null
    let darkUrl: string | null = null
    let updateLight = false
    let updateDark = false

    const ct = req.headers.get("content-type") || ""
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData()
      const lightFile = form.get("logo_light") as File | null
      const darkFile = form.get("logo_dark") as File | null
      
      // Upload light mode logo if provided
      if (lightFile && lightFile.size > 0) {
        updateLight = true
        const arrayBuffer = await lightFile.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const path = `whitelabel-logos/${orgUuid}/light-${Date.now()}-${lightFile.name}`
        
        const { data: upload, error: upErr } = await supabaseAdmin.storage
          .from("org-assets")
          .upload(path, bytes, { contentType: lightFile.type, upsert: true })
        
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
        
        const { data: pub } = supabaseAdmin.storage.from("org-assets").getPublicUrl(upload.path)
        lightUrl = pub.publicUrl
      }

      // Upload dark mode logo if provided
      if (darkFile && darkFile.size > 0) {
        updateDark = true
        const arrayBuffer = await darkFile.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const path = `whitelabel-logos/${orgUuid}/dark-${Date.now()}-${darkFile.name}`
        
        const { data: upload, error: upErr } = await supabaseAdmin.storage
          .from("org-assets")
          .upload(path, bytes, { contentType: darkFile.type, upsert: true })
        
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
        
        const { data: pub } = supabaseAdmin.storage.from("org-assets").getPublicUrl(upload.path)
        darkUrl = pub.publicUrl
      }
    } else {
      // JSON mode for programmatic updates
      const body = (await req.json().catch(() => ({}))) as { 
        light_url?: string | null
        dark_url?: string | null 
      }
      if ("light_url" in body) {
        updateLight = true
        lightUrl = body.light_url ?? null
      }
      if ("dark_url" in body) {
        updateDark = true
        darkUrl = body.dark_url ?? null
      }
    }

    // Build update object (only include fields that are being updated)
    const updateObj: Record<string, string | null> = {}
    if (updateLight) updateObj.whitelabel_logo_light_url = lightUrl
    if (updateDark) updateObj.whitelabel_logo_dark_url = darkUrl

    if (Object.keys(updateObj).length > 0) {
      const { error: updErr } = await supabaseAdmin
        .from("organizations")
        .update(updateObj)
        .eq("id", orgUuid)
      
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    // Best-effort cleanup: delete old files if replaced
    if (updateLight && previousLightUrl && lightUrl !== previousLightUrl) {
      const objectPath = getObjectPathFromPublicUrl(previousLightUrl)
      if (objectPath) {
        try {
          await supabaseAdmin.storage.from("org-assets").remove([objectPath])
        } catch {
          // ignore cleanup errors
        }
      }
    }
    if (updateDark && previousDarkUrl && darkUrl !== previousDarkUrl) {
      const objectPath = getObjectPathFromPublicUrl(previousDarkUrl)
      if (objectPath) {
        try {
          await supabaseAdmin.storage.from("org-assets").remove([objectPath])
        } catch {
          // ignore cleanup errors
        }
      }
    }

    // Return current state (merged with updates)
    return NextResponse.json({ 
      ok: true, 
      light_url: updateLight ? lightUrl : previousLightUrl,
      dark_url: updateDark ? darkUrl : previousDarkUrl,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No org" }, { status: 400 })

    // Check query param for which logo to delete (light, dark, or both)
    const url = new URL(req.url)
    const mode = url.searchParams.get("mode") // "light", "dark", or null for both

    // Fetch current URLs
    const { data: current, error: curErr } = await supabaseAdmin
      .from("organizations")
      .select("whitelabel_logo_light_url, whitelabel_logo_dark_url")
      .eq("id", orgUuid)
      .single()
    
    if (curErr) return NextResponse.json({ error: curErr.message }, { status: 500 })
    
    const currentLightUrl = (current?.whitelabel_logo_light_url as string | undefined) ?? null
    const currentDarkUrl = (current?.whitelabel_logo_dark_url as string | undefined) ?? null

    const deleteLight = mode === "light" || mode === null
    const deleteDark = mode === "dark" || mode === null

    // Delete from storage
    if (deleteLight && currentLightUrl) {
      const objectPath = getObjectPathFromPublicUrl(currentLightUrl)
      if (objectPath) {
        try {
          await supabaseAdmin.storage.from("org-assets").remove([objectPath])
        } catch {
          // swallow storage delete error
        }
      }
    }
    if (deleteDark && currentDarkUrl) {
      const objectPath = getObjectPathFromPublicUrl(currentDarkUrl)
      if (objectPath) {
        try {
          await supabaseAdmin.storage.from("org-assets").remove([objectPath])
        } catch {
          // swallow storage delete error
        }
      }
    }

    // Clear URLs in database
    const updateObj: Record<string, null> = {}
    if (deleteLight) updateObj.whitelabel_logo_light_url = null
    if (deleteDark) updateObj.whitelabel_logo_dark_url = null

    const { error: upd } = await supabaseAdmin
      .from("organizations")
      .update(updateObj)
      .eq("id", orgUuid)
    
    if (upd) return NextResponse.json({ error: upd.message }, { status: 500 })
    
    return NextResponse.json({ 
      ok: true,
      light_url: deleteLight ? null : currentLightUrl,
      dark_url: deleteDark ? null : currentDarkUrl,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
