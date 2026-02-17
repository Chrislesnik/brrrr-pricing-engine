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
  ssn?: string
  date_of_birth?: string | null
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

type WebhookResponse = {
  data?: {
    transunion_score?: number | null
    experian_score?: number | null
    equifax_score?: number | null
    mid_score?: number | null
    pull_type?: string | null
    report_id?: string | null
    report_date?: string | null
    aggregator?: string | null
    tradelines?: unknown[]
    liabilities?: Record<string, unknown>
    public_records?: unknown[]
    inquiries?: unknown[]
    cleaned_data?: Record<string, unknown> | null
  }
}

const WEBHOOK_URL =
  "https://n8n.axora.info/webhook/0a006038-2921-4c67-bdb2-879f89d289c8"
const FILE_WEBHOOK_URL =
  "https://n8n.axora.info/webhook/0b13fc8d-6028-4953-9df5-6aab90c9b729"

export async function POST(req: NextRequest) {
  console.warn("[credit/run] === Starting credit run ===")
  try {
    const { userId, orgId } = await auth()
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId)
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      )
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid)
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )

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
    const shouldEncrypt = ssnDigits.length >= 4
    const ssnEncrypted = shouldEncrypt ? encryptToBase64(ssnDigits) : null
    const ssnParts = shouldEncrypt ? encryptToParts(ssnDigits) : null

    // Normalize DOB to yyyy-mm-dd
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
        // ignore
      }
    }

    // Check for active Xactus integration
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

    // ========== STEP 1: Call n8n webhook ==========
    const payload = {
      borrower_id: borrowerId,
      organization_id: orgUuid,
      aggregator,
      xactus_integration_id: xactusIntegrationId,
      first_name: inputs.first_name ?? null,
      last_name: inputs.last_name ?? null,
      ssn_encrypted: ssnEncrypted,
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
      inputs,
    }

    console.warn("[credit/run] Step 1: Calling n8n webhook...")
    const resp = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    console.warn("[credit/run] Webhook response status:", resp.status)

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "Unknown error")
      console.error("[credit/run] Webhook failed:", errText)
      return NextResponse.json(
        { ok: false, status: resp.status, error: errText },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let webhookData: WebhookResponse["data"] = {}
    try {
      const json = (await resp.json()) as WebhookResponse
      webhookData = json?.data ?? json ?? {}
    } catch {
      console.error("[credit/run] Failed to parse webhook response as JSON")
      webhookData = {}
    }

    const resolvedAggregator =
      (webhookData.aggregator as string) ?? aggregator ?? null

    // ========== STEP 2: Create credit_reports row ==========
    console.warn("[credit/run] Step 2: Creating credit_reports row...")
    const { data: created, error: insErr } = await supabaseAdmin
      .from("credit_reports")
      .insert({
        assigned_to: [userId],
        status: "completed",
        metadata: {},
        borrower_id: borrowerId ?? null,
        organization_id: orgUuid,
        aggregator: resolvedAggregator,
      } as any)
      .select("id")
      .single()

    if (insErr || !created?.id) {
      console.error("[credit/run] Failed to create row:", insErr?.message)
      return NextResponse.json(
        {
          ok: false,
          error: insErr?.message ?? "Failed to create report row",
        },
        { status: 500 }
      )
    }

    const reportId = created.id as string
    console.warn("[credit/run] Created credit_reports row:", reportId)

    // ========== STEP 3: Insert credit data into credit_report_data_xactus ==========
    console.warn("[credit/run] Step 3: Inserting credit data...")
    const { error: dataErr } = await supabaseAdmin
      .from("credit_report_data_xactus")
      .insert({
        credit_report_id: reportId,
        borrower_id: borrowerId ?? null,
        organization_id: orgUuid,
        uploaded_by: userId,
        pull_type: (webhookData.pull_type as string) ?? inputs.pull_type ?? "soft",
        report_id: (webhookData.report_id as string) ?? null,
        report_date: (webhookData.report_date as string) ?? null,
        date_ordered: new Date().toISOString().slice(0, 10),
        aggregator: resolvedAggregator,
        transunion_score: webhookData.transunion_score ?? null,
        experian_score: webhookData.experian_score ?? null,
        equifax_score: webhookData.equifax_score ?? null,
        mid_score: webhookData.mid_score ?? null,
        tradelines: webhookData.tradelines ?? [],
        liabilities: webhookData.liabilities ?? {},
        public_records: webhookData.public_records ?? [],
        inquiries: webhookData.inquiries ?? [],
        cleaned_data: webhookData.cleaned_data ?? null,
      } as any)

    if (dataErr) {
      console.error(
        "[credit/run] Failed to insert credit data:",
        dataErr.message
      )
    }

    // ========== STEP 4: Create viewer + chat records ==========
    console.warn("[credit/run] Step 4: Creating viewer + chat records...")
    try {
      await supabaseAdmin.from("credit_report_viewers").insert({
        report_id: reportId,
        user_id: userId,
        added_by: userId,
      } as any)
    } catch {
      // non-fatal
    }

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

    // ========== STEP 5: Broadcast realtime event ==========
    try {
      const channel = supabaseAdmin.channel("credit-reports")
      await channel.send({
        type: "broadcast",
        event: "credit_report_stored",
        payload: {
          reportId,
          borrowerId,
          organization_id: orgUuid,
        },
      })
      await channel.unsubscribe()
    } catch (e) {
      console.error(
        "[credit/run] Failed to broadcast credit_report_stored",
        e
      )
    }

    // ========== STEP 6: Fetch PDF from n8n and store in persons bucket ==========
    let documentFileId: number | null = null
    let documentStoragePath: string | null = null

    try {
      console.warn("[credit/run] Step 6: Fetching PDF from file webhook...")
      const fileResp = await fetch(FILE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credit_report_id: reportId }),
      })
      console.warn("[credit/run] File webhook status:", fileResp.status)

      if (fileResp.ok) {
        const contentType = fileResp.headers.get("content-type") || "application/pdf"
        const cd = fileResp.headers.get("content-disposition") || ""
        const filenameMatch = /filename="([^"]+)"/i.exec(cd)
        const rawFilename = filenameMatch?.[1] || `credit-report-${reportId}.pdf`
        const safeName = rawFilename.replace(/[^\w.\-]+/g, "_")
        const uniqueSlug = randomUUID()

        const buf = Buffer.from(await fileResp.arrayBuffer())
        console.warn("[credit/run] Received file:", buf.length, "bytes, type:", contentType)

        if (buf.length > 0) {
          const borrowerFolder = borrowerId ?? "no-borrower"
          const storagePath = `${borrowerFolder}/credit/${reportId}-${uniqueSlug}-${safeName}`

          const { error: upErr } = await supabaseAdmin.storage
            .from("persons")
            .upload(storagePath, buf, {
              contentType: contentType || "application/pdf",
              upsert: false,
            })

          if (upErr) {
            console.error("[credit/run] Storage upload failed:", upErr.message)
          } else {
            documentStoragePath = storagePath
            console.warn("[credit/run] Uploaded to persons/", storagePath)

            // Look up "Credit & Background" document category
            const { data: creditCat } = await supabaseAdmin
              .from("document_categories")
              .select("id")
              .eq("code", "credit_and_background")
              .maybeSingle()

            // Create document_files row
            const { data: docFile, error: docErr } = await supabaseAdmin
              .from("document_files")
              .insert({
                document_name: rawFilename,
                file_type: contentType || "application/pdf",
                file_size: buf.length,
                storage_bucket: "persons",
                storage_path: storagePath,
                uploaded_by: userId,
                uploaded_at: new Date().toISOString(),
                document_category_id: creditCat?.id ?? null,
              })
              .select("id")
              .single()

            if (docErr || !docFile?.id) {
              console.error("[credit/run] Failed to create document_files row:", docErr?.message)
            } else {
              documentFileId = docFile.id as number
              console.warn("[credit/run] Created document_files row:", documentFileId)

              // Link document to credit report
              await supabaseAdmin
                .from("document_files_credit_reports")
                .insert({
                  document_file_id: documentFileId,
                  credit_report_id: reportId,
                  created_by: userId,
                })
                .then(({ error: e }) => {
                  if (e) console.error("[credit/run] Failed to link doc to credit report:", e.message)
                })

              // Link document to org
              await supabaseAdmin
                .from("document_files_clerk_orgs")
                .insert({
                  document_file_id: documentFileId,
                  clerk_org_id: orgUuid,
                  created_by: userId,
                })
                .then(({ error: e }) => {
                  if (e) console.error("[credit/run] Failed to link doc to org:", e.message)
                })

              // Link document to borrower
              if (borrowerId) {
                await supabaseAdmin
                  .from("document_files_borrowers")
                  .insert({
                    document_file_id: documentFileId,
                    borrower_id: borrowerId,
                    created_by: userId,
                  })
                  .then(({ error: e }) => {
                    if (e) console.error("[credit/run] Failed to link doc to borrower:", e.message)
                  })
              }
            }
          }
        } else {
          console.warn("[credit/run] File webhook returned empty body")
        }
      } else {
        const errText = await fileResp.text().catch(() => "Unknown error")
        console.error("[credit/run] File webhook failed:", fileResp.status, errText)
      }
    } catch (fileErr) {
      console.error("[credit/run] File fetch/store error (non-fatal):", fileErr)
    }

    // ========== Success ==========
    console.warn("[credit/run] === Credit run completed successfully ===")
    return NextResponse.json({
      ok: true,
      status: 200,
      report_id: reportId,
      aggregator: resolvedAggregator,
      chat_id: chatIdForUser ?? null,
      document_file_id: documentFileId,
      document_storage_path: documentStoragePath,
      scores: {
        transunion: webhookData.transunion_score ?? null,
        experian: webhookData.experian_score ?? null,
        equifax: webhookData.equifax_score ?? null,
        mid: webhookData.mid_score ?? null,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    console.error("[credit/run] Unhandled error:", e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
