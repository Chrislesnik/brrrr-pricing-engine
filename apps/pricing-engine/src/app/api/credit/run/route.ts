import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { encryptToBase64, encryptToParts } from "@/lib/crypto"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

type Inputs = {
  first_name?: string
  last_name?: string
  ssn?: string // raw digits expected or formatted
  date_of_birth?: string | null // yyyy-mm-dd preferred
  address_line1?: string
  city?: string
  state?: string
  zip?: string
  county?: string
  include_transunion?: boolean
  include_experian?: boolean
  include_equifax?: boolean
  pull_type?: "hard" | "soft"
}

const FIRST_WEBHOOK_URL = "https://n8n.axora.info/webhook/dd842cfb-d4c5-4ce7-94a9-a87e1027dd23"
const SECOND_WEBHOOK_URL = "https://n8n.axora.info/webhook/f5315945-c5a3-405f-8ef9-76ced3a9b348"

export async function POST(req: NextRequest) {
  console.warn("[credit/run] === Starting credit run ===")
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const body = (await req.json().catch(() => ({}))) as {
      borrowerId?: string | null
      inputs?: Inputs
      aggregator?: string | null
    }

    const borrowerId = (body?.borrowerId ?? null) as string | null
    const aggregator = (body?.aggregator ?? null) as string | null
    const inputs: Inputs = body?.inputs ?? {}

    // Normalize SSN -> digits then encrypt
    const ssnDigits = String(inputs?.ssn ?? "")
      .replace(/\D+/g, "")
      .slice(0, 9)
    // Support encrypting even when only last4 (>=4 digits) is present, per user request
    const shouldEncrypt = ssnDigits.length >= 4
    const ssnEncrypted = shouldEncrypt ? encryptToBase64(ssnDigits) : null
    const ssnParts = shouldEncrypt ? encryptToParts(ssnDigits) : null

    // Normalize DOB to yyyy-mm-dd if a Date-like string was sent
    let dob = inputs?.date_of_birth ?? null
    if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob) === false) {
      try {
        const d = new Date(dob)
        if (!Number.isNaN(d.getTime())) {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, "0")
          const day = String(d.getDate()).padStart(2, "0")
          dob = `${y}-${m}-${day}`
        }
      } catch {
        // ignore parse errors; leave as-is
      }
    }

    // Check if user has active xactus integration (unified workflow_integrations table)
    let xactusIntegrationId: string | null = null
    const { data: xactusRow } = await supabaseAdmin
      .from("workflow_integrations")
      .select("id, config")
      .eq("organization_id", orgUuid)
      .eq("user_id", userId)
      .eq("type", "xactus")
      .is("name", null)
      .maybeSingle()
    if (xactusRow?.id) {
      const xConfig = (xactusRow.config as Record<string, unknown>) || {}
      const isActive = xConfig.status === "true"
      const hasCredentials =
        Boolean((xConfig.account_user as string | null)?.trim()) &&
        Boolean((xConfig.account_password as string | null)?.trim())
      if (isActive && hasCredentials) {
        xactusIntegrationId = xactusRow.id as string
      }
    }

    const payload = {
      borrower_id: borrowerId,
      organization_id: orgUuid,
      aggregator,
      xactus_integration_id: xactusIntegrationId,
      first_name: inputs.first_name ?? null,
      last_name: inputs.last_name ?? null,
      ssn_encrypted: ssnEncrypted,
      // n8n structured fields
      ssn_ciphertext: ssnParts?.ciphertext_b64 ?? null,
      iv: ssnParts?.iv_b64 ?? null,
      algo: ssnParts?.algo ?? null,
      date_of_birth: dob,
      address_line1: inputs.address_line1 ?? null,
      city: inputs.city ?? null,
      state: inputs.state ?? null,
      zip: inputs.zip ?? null,
      county: inputs.county ?? null,
      include_transunion: Boolean(inputs.include_transunion),
      include_experian: Boolean(inputs.include_experian),
      include_equifax: Boolean(inputs.include_equifax),
      pull_type: inputs.pull_type ?? "soft",
      // Also include the raw flags object for flexibility on the receiver side
      inputs,
    }

    // ========== STEP 1: Call first webhook to get aggregator info ==========
    console.warn("[credit/run] Step 1: Calling first webhook...")
    const resp1 = await fetch(FIRST_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    console.warn("[credit/run] First webhook response status:", resp1.status)

    if (!resp1.ok) {
      const errText = await resp1.text().catch(() => "Unknown error")
      console.error("[credit/run] First webhook failed:", errText)
      return NextResponse.json({ ok: false, status: resp1.status, error: errText }, { status: 500 })
    }

    // Parse JSON response from first webhook
    let firstResponse: { aggregator?: string; aggregator_id?: string } = {}
    const contentType1 = resp1.headers.get("content-type") || ""
    const responseText = await resp1.text()
    console.warn("[credit/run] First webhook content-type:", contentType1)
    console.warn("[credit/run] First webhook response body:", responseText)
    
    try {
      firstResponse = JSON.parse(responseText)
    } catch {
      console.error("[credit/run] Failed to parse first webhook response as JSON")
      firstResponse = {}
    }

    const responseAggregator = firstResponse.aggregator ?? aggregator ?? null
    const aggregatorId = firstResponse.aggregator_id ?? null
    console.warn("[credit/run] Parsed aggregator:", responseAggregator, "aggregator_id:", aggregatorId)

    // ========== STEP 2: Create credit_reports row immediately (without file) ==========
    console.warn("[credit/run] Step 2: Creating credit_reports row...")
    const row = {
      bucket: "credit-reports",
      // Use a unique placeholder to satisfy unique bucket+path constraint
      storage_path: `pending/${randomUUID()}`,
      assigned_to: [userId],
      status: "pending", // File not yet received
      metadata: {} as Record<string, unknown>,
      borrower_id: borrowerId ?? null,
      organization_id: orgUuid,
      aggregator: responseAggregator,
      aggregator_id: aggregatorId ?? null, // Save aggregator_id from first webhook
    }

    const { data: created, error: insErr } = await supabaseAdmin
      .from("credit_reports")
      .insert(row as any)
      .select("id")
      .single()

    if (insErr || !created?.id) {
      console.error("[credit/run] Failed to create row:", insErr?.message)
      return NextResponse.json({ ok: false, error: insErr?.message ?? "Failed to create report row" }, { status: 500 })
    }

    const reportId = created.id as string
    console.warn("[credit/run] Created report row with ID:", reportId)

    // Seed viewer record so the executing user can view the report
    try {
      await supabaseAdmin.from("credit_report_viewers").insert({
        report_id: reportId,
        user_id: userId,
        added_by: userId,
      } as any)
    } catch {
      // non-fatal
    }

    // Ensure chat mapping for (report, user)
    let chatIdForUser: string | undefined
    const { data: existingMap } = await supabaseAdmin
      .from("credit_report_user_chats")
      .select("chat_id")
      .eq("report_id", reportId)
      .eq("user_id", userId)
      .maybeSingle()

    chatIdForUser = existingMap?.chat_id as string | undefined
    if (!chatIdForUser) {
      const { data: chat } = await supabaseAdmin
        .from("credit_report_chats")
        .insert({
          user_id: userId,
          organization_id: orgUuid,
          name: "Credit report chat",
        })
        .select("id")
        .single()
      if (chat?.id) {
        chatIdForUser = chat.id as string
        await supabaseAdmin.from("credit_report_user_chats").insert({
          report_id: reportId,
          user_id: userId,
          chat_id: chatIdForUser,
        })
      }
    }

    // ========== STEP 3: Call second webhook with report_id to get the binary file ==========
    console.warn("[credit/run] Step 3: Calling second webhook with report_id:", reportId)
    console.warn("[credit/run] Second webhook URL:", SECOND_WEBHOOK_URL)
    const resp2 = await fetch(SECOND_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: reportId }),
    })
    console.warn("[credit/run] Second webhook response status:", resp2.status)

    if (!resp2.ok) {
      // File fetch failed, but row is created with status="pending"
      const errText = await resp2.text().catch(() => "Unknown error")
      return NextResponse.json({
        ok: false,
        status: resp2.status,
        error: `File webhook failed: ${errText}`,
        report_id: reportId,
        aggregator: responseAggregator,
        chat_id: chatIdForUser ?? null,
      }, { status: 500 })
    }

    // ========== STEP 4: Handle binary response and upload to storage ==========
    const contentType2 = resp2.headers.get("content-type") || ""
    const cd = resp2.headers.get("content-disposition") || ""
    const filenameMatch = /filename="([^"]+)"/i.exec(cd)
    const filename = filenameMatch?.[1] || "report.pdf"
    const safeName = filename.replace(/[^\w.\-]+/g, "_")
    const uniqueSlug = randomUUID()

    const buf = Buffer.from(await resp2.arrayBuffer())
    const storagePath = `${orgUuid}/${borrowerId ?? "noborrower"}/${reportId}-${uniqueSlug}-${safeName}`

    const { error: upErr } = await supabaseAdmin.storage
      .from("credit-reports")
      .upload(storagePath, buf, {
        contentType: contentType2 || "application/pdf",
        upsert: false,
      })

    if (upErr) {
      return NextResponse.json({
        ok: false,
        error: `Storage upload failed: ${upErr.message}`,
        report_id: reportId,
        aggregator: responseAggregator,
        chat_id: chatIdForUser ?? null,
      }, { status: 500 })
    }

    // ========== STEP 5: Update the row with storage_path, metadata, status="stored" ==========
    const { error: updateErr } = await supabaseAdmin
      .from("credit_reports")
      .update({
        storage_path: storagePath,
        status: "stored",
        metadata: {
          contentType: contentType2 || "application/pdf",
          size: buf.length,
          originalName: filename,
        },
      })
      .eq("id", reportId)

    if (updateErr) {
      return NextResponse.json({
        ok: false,
        error: `Failed to update report row: ${updateErr.message}`,
        report_id: reportId,
        storage_path: storagePath,
        aggregator: responseAggregator,
        chat_id: chatIdForUser ?? null,
      }, { status: 500 })
    }

    // ========== STEP 6: Broadcast realtime event so clients refresh dropdown ==========
    try {
      const channel = supabaseAdmin.channel("credit-reports")
      await channel.send({
        type: "broadcast",
        event: "credit_report_stored",
        payload: {
          reportId,
          borrowerId,
          storage_path: storagePath,
          filename,
          organization_id: orgUuid,
        },
      })
      await channel.unsubscribe()
    } catch (e) {
      console.error("[credit/run] Failed to broadcast credit_report_stored", e)
    }

    // ========== Success ==========
    return NextResponse.json({
      ok: true,
      status: 200,
      report_id: reportId,
      aggregator: responseAggregator,
      aggregator_id: aggregatorId,
      storage_path: storagePath,
      chat_id: chatIdForUser ?? null,
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    console.error("[credit/run] Unhandled error:", e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
