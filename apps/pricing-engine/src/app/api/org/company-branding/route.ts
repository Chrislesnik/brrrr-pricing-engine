import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

function getObjectPathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    // Expected: https://<project>.supabase.co/storage/v1/object/public/broker-assets/<path>
    const marker = "/storage/v1/object/public/broker-assets/"
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

    // Resolve organization_member_id for this user within org
    const { data: member, error: memErr } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .single()
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })
    const orgMemberId = (member?.id as string) ?? null
    if (!orgMemberId) return NextResponse.json({ error: "No member" }, { status: 404 })

    const { data, error } = await supabaseAdmin
      .from("brokers")
      .select("company_name, company_logo_url")
      .eq("organization_id", orgUuid)
      .eq("organization_member_id", orgMemberId)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const company_name = (data?.company_name as string | undefined) ?? ""
    const logo_url = (data?.company_logo_url as string | undefined) ?? ""
    return NextResponse.json({ company_name, logo_url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No org" }, { status: 400 })

    // Resolve organization_member_id for this user within org
    const { data: member, error: memErr } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .single()
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })
    const orgMemberId = (member?.id as string) ?? null
    if (!orgMemberId) return NextResponse.json({ error: "No member" }, { status: 404 })

    // Gate: strictly resolve the broker row for this member, then read custom_broker_settings by that broker_id.
    let allowWhiteLabeling = false
    const { data: brokerRow } = await supabaseAdmin
      .from("brokers")
      .select("id, allow_white_labeling")
      .eq("organization_id", orgUuid)
      .eq("organization_member_id", orgMemberId)
      .maybeSingle()
    const brokerId = (brokerRow?.id as string) ?? null
    if (brokerId) {
      const { data: custom } = await supabaseAdmin
        .from("custom_broker_settings")
        .select("allow_white_labeling")
        .eq("organization_id", orgUuid)
        .eq("broker_id", brokerId)
        .maybeSingle()
      allowWhiteLabeling =
        (custom as any)?.allow_white_labeling === true ||
        ((brokerRow as any)?.allow_white_labeling === true)
      if (!allowWhiteLabeling) {
        const { data: anyCustom } = await supabaseAdmin
          .from("custom_broker_settings")
          .select("allow_white_labeling")
          .eq("organization_id", orgUuid)
          .limit(1)
          .maybeSingle()
        allowWhiteLabeling = (anyCustom as any)?.allow_white_labeling === true || allowWhiteLabeling
      }
    } else {
      allowWhiteLabeling = (brokerRow as any)?.allow_white_labeling === true
      if (!allowWhiteLabeling) {
        const { data: anyCustom } = await supabaseAdmin
          .from("custom_broker_settings")
          .select("allow_white_labeling")
          .eq("organization_id", orgUuid)
          .limit(1)
          .maybeSingle()
        allowWhiteLabeling = (anyCustom as any)?.allow_white_labeling === true || allowWhiteLabeling
      }
    }

    // Fetch existing url to remove after successful replacement
    let previousLogoUrl: string | null = null
    {
      const { data: current } = await supabaseAdmin
        .from("brokers")
        .select("company_logo_url")
        .eq("organization_id", orgUuid)
        .eq("organization_member_id", orgMemberId)
        .maybeSingle()
      previousLogoUrl = (current?.company_logo_url as string | undefined) ?? null
    }

    let companyName = ""
    let logoUrl: string | null = null
    let deleteLogo = false

    const ct = req.headers.get("content-type") || ""
    if (ct.includes("multipart/form-data")) {
        if (!allowWhiteLabeling) {
          return NextResponse.json({ error: "White labeling disabled" }, { status: 403 })
        }
      const form = await req.formData()
      companyName = String(form.get("company_name") ?? "")
      const file = form.get("logo") as File | null
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const path = `company-logos/${orgUuid}/${orgMemberId}/${Date.now()}-${file.name}`
        const { data: upload, error: upErr } = await supabaseAdmin.storage
          .from("broker-assets")
          .upload(path, bytes, { contentType: file.type, upsert: true })
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
        const { data: pub } = supabaseAdmin.storage.from("broker-assets").getPublicUrl(upload.path)
        logoUrl = pub.publicUrl
      }
    } else {
      const body = (await req.json().catch(() => ({}))) as { company_name?: string; logo_url?: string; delete_logo?: boolean }
      companyName = String(body.company_name ?? "")
      logoUrl = body.logo_url ?? null
        deleteLogo = body.delete_logo === true && allowWhiteLabeling
    }

    // Try to update broker row linked to this member; insert if missing
    const { data: updated, error: updErr } = await supabaseAdmin
      .from("brokers")
      .update({
        company_name: companyName,
        company_logo_url: deleteLogo ? null : logoUrl,
      })
      .eq("organization_id", orgUuid)
      .eq("organization_member_id", orgMemberId)
      .select("id")
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    if (!updated || updated.length === 0) {
      const { error: insErr } = await supabaseAdmin.from("brokers").insert({
        organization_id: orgUuid,
        organization_member_id: orgMemberId,
        company_name: companyName,
        company_logo_url: deleteLogo ? null : logoUrl,
      })
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    // Best-effort: if we replaced a logo, delete the previous object
    if (!deleteLogo && previousLogoUrl && logoUrl && previousLogoUrl !== logoUrl) {
      const objectPath = getObjectPathFromPublicUrl(previousLogoUrl)
      if (objectPath) {
        try {
          await supabaseAdmin.storage.from("broker-assets").remove([objectPath])
        } catch {
          // ignore cleanup errors
        }
      }
    }
    // If deletion was requested, remove current object too
    if (deleteLogo && previousLogoUrl) {
      const objectPath = getObjectPathFromPublicUrl(previousLogoUrl)
      if (objectPath) {
        try {
          await supabaseAdmin.storage.from("broker-assets").remove([objectPath])
        } catch {
          // swallow cleanup errors
        }
      }
    }
    return NextResponse.json({ ok: true, company_name: companyName, logo_url: deleteLogo ? null : logoUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No org" }, { status: 400 })

    const { data: member, error: memErr } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .single()
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })
    const orgMemberId = (member?.id as string) ?? null
    if (!orgMemberId) return NextResponse.json({ error: "No member" }, { status: 404 })

    const { data: current, error: curErr } = await supabaseAdmin
      .from("brokers")
      .select("company_logo_url")
      .eq("organization_id", orgUuid)
      .eq("organization_member_id", orgMemberId)
      .maybeSingle()
    if (curErr) return NextResponse.json({ error: curErr.message }, { status: 500 })
    const currentUrl = (current?.company_logo_url as string | undefined) ?? null

    if (currentUrl) {
      const objectPath = getObjectPathFromPublicUrl(currentUrl)
      if (objectPath) {
        try {
          await supabaseAdmin.storage.from("broker-assets").remove([objectPath])
        } catch {
          // swallow storage delete error; proceed to clear db url
        }
      }
    }
    const { error: upd } = await supabaseAdmin
      .from("brokers")
      .update({ company_logo_url: null })
      .eq("organization_id", orgUuid)
      .eq("organization_member_id", orgMemberId)
    if (upd) return NextResponse.json({ error: upd.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


