import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

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
      .from("broker_company_branding")
      .select("company_name, logo_url")
      .eq("organization_member_id", orgMemberId)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ company_name: data?.company_name ?? "", logo_url: data?.logo_url ?? "" })
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

    let companyName = ""
    let logoUrl: string | null = null

    const ct = req.headers.get("content-type") || ""
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData()
      companyName = String(form.get("company_name") ?? "")
      const file = form.get("logo") as File | null
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const path = `company-logos/${orgUuid}/${orgMemberId}/${Date.now()}-${file.name}`
        const { data: upload, error: upErr } = await supabaseAdmin.storage
          .from("public")
          .upload(path, bytes, { contentType: file.type, upsert: true })
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
        const { data: pub } = supabaseAdmin.storage.from("public").getPublicUrl(upload.path)
        logoUrl = pub.publicUrl
      }
    } else {
      const body = (await req.json().catch(() => ({}))) as { company_name?: string; logo_url?: string }
      companyName = String(body.company_name ?? "")
      logoUrl = body.logo_url ?? null
    }

    const { error } = await supabaseAdmin
      .from("broker_company_branding")
      .upsert(
        {
          organization_member_id: orgMemberId,
          company_name: companyName,
          logo_url: logoUrl,
        },
        { onConflict: "organization_member_id" }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, company_name: companyName, logo_url: logoUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


