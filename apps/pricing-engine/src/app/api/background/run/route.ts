import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { encryptToBase64, encryptToParts } from "@/lib/crypto"

export const runtime = "nodejs"

const WEBHOOK_URL =
  "https://n8n.axora.info/webhook/afbb90d1-ab64-48b7-ba7d-594a94b8188f"

type BodyShape = {
  borrower_id?: string | null
  entity_id?: string | null
  is_entity?: boolean
  // Compliance
  glb?: string
  dppa?: string
  voter?: string
  // Entity fields
  entity_name?: string
  entity_type?: string
  ein?: string
  state_of_formation?: string
  date_of_formation?: string | null
  // Individual fields
  first_name?: string
  middle_initial?: string
  last_name?: string
  date_of_birth?: string | null
  ssn?: string
  email?: string
  phone?: string
  // Address
  street?: string
  city?: string
  state?: string
  zip?: string
  county?: string
  province?: string
  country?: string
  // Report meta
  report_type?: string
  notes?: string
}

export async function POST(req: NextRequest) {
  console.warn("[background/run] === Starting background run ===")
  try {
    const { userId, orgId } = await auth()
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId)
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 },
      )
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid)
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      )

    const body: BodyShape = await req.json().catch(() => ({}))
    const isEntity = Boolean(body.is_entity)

    // --- SSN encryption (individual only) ---
    let ssnEncrypted: string | null = null
    let ssnParts: { ciphertext_b64: string; iv_b64: string; algo: string } | null = null

    if (!isEntity && body.ssn) {
      const ssnDigits = String(body.ssn).replace(/\D+/g, "").slice(0, 9)
      if (ssnDigits.length >= 4) {
        ssnEncrypted = encryptToBase64(ssnDigits)
        ssnParts = encryptToParts(ssnDigits)
      }
    }

    // --- Normalize DOB to yyyy-mm-dd ---
    let dob = body.date_of_birth ?? null
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      try {
        const d = new Date(dob)
        if (!Number.isNaN(d.getTime())) {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, "0")
          const day = String(d.getDate()).padStart(2, "0")
          dob = `${y}-${m}-${day}`
        }
      } catch {
        // leave as-is
      }
    }

    // --- Normalize Date of Formation ---
    let dateOfFormation = body.date_of_formation ?? null
    if (dateOfFormation && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfFormation)) {
      try {
        const d = new Date(dateOfFormation)
        if (!Number.isNaN(d.getTime())) {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, "0")
          const day = String(d.getDate()).padStart(2, "0")
          dateOfFormation = `${y}-${m}-${day}`
        }
      } catch {
        // leave as-is
      }
    }

    const payload: Record<string, unknown> = {
      // IDs
      user_id: userId,
      borrower_id: body.borrower_id ?? null,
      entity_id: body.entity_id ?? null,
      is_entity: isEntity,
      organization_id: orgUuid,
      // Compliance
      glb: body.glb ?? null,
      dppa: body.dppa ?? null,
      voter: body.voter ?? null,
      // Address
      street: body.street ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      zip: body.zip ?? null,
      county: body.county ?? null,
      province: body.province ?? null,
      country: body.country ?? "US",
      // Report meta
      report_type: body.report_type ?? null,
      notes: body.notes ?? null,
    }

    if (isEntity) {
      payload.entity_name = body.entity_name ?? null
      payload.entity_type = body.entity_type ?? null
      payload.ein = body.ein ?? null
      payload.state_of_formation = body.state_of_formation ?? null
      payload.date_of_formation = dateOfFormation
    } else {
      payload.first_name = body.first_name ?? null
      payload.middle_initial = body.middle_initial ?? null
      payload.last_name = body.last_name ?? null
      payload.date_of_birth = dob
      payload.email = body.email ?? null
      payload.phone = body.phone ?? null
      payload.ssn_encrypted = ssnEncrypted
      payload.ssn_ciphertext = ssnParts?.ciphertext_b64 ?? null
      payload.iv = ssnParts?.iv_b64 ?? null
      payload.algo = ssnParts?.algo ?? null
    }

    console.warn("[background/run] Calling n8n webhook...")
    const resp = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    console.warn("[background/run] Webhook response status:", resp.status)

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "Unknown error")
      console.error("[background/run] Webhook failed:", errText)
      return NextResponse.json(
        { ok: false, status: resp.status, error: errText },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    console.error("[background/run] Unexpected error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
