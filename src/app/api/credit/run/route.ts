import { NextRequest, NextResponse } from "next/server"
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

export async function POST(req: NextRequest) {
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

    const payload = {
      borrower_id: borrowerId,
      organization_id: orgUuid,
      aggregator,
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

    const webhookUrl = "https://n8n.axora.info/webhook-test/dd842cfb-d4c5-4ce7-94a9-a87e1027dd23"
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const contentType = resp.headers.get("content-type") || ""
    // Helper to build storage path
    const buildStoragePath = (reportId?: string | null, filename?: string | null) => {
      const safeName = (filename || "report.pdf").replace(/[^\w.\-]+/g, "_")
      const idPart = reportId && reportId.length > 0 ? reportId : "noid"
      return `${orgUuid}/${borrowerId ?? "noborrower"}/${idPart}-${Date.now()}-${safeName}`
    }

    if (contentType.includes("multipart/")) {
      // Manual multipart parsing by boundary
      const boundaryMatch = /boundary=([^;]+)/i.exec(contentType)
      if (!boundaryMatch) {
        return NextResponse.json(
          {
            ok: false,
            status: resp.status,
            error:
              "Multipart boundary missing. In n8n Respond node, do not hardcode Content-Type; allow n8n to set it (so boundary is present).",
          },
          { status: 500 }
        )
      }
      const boundary = boundaryMatch[1]
      const raw = Buffer.from(await resp.arrayBuffer())
      const dashBoundary = Buffer.from(`--${boundary}`)
      const endBoundary = Buffer.from(`--${boundary}--`)

      let idx = 0
      // Seek first boundary
      idx = raw.indexOf(dashBoundary, idx)
      if (idx === -1) {
        return NextResponse.json({ ok: false, status: resp.status, error: "Boundary not found in body." }, { status: 500 })
      }
      idx += dashBoundary.length + 2 // skip CRLF after boundary

      const parts: Array<{ headers: Record<string, string>; body: Buffer }> = []
      const crlf2 = Buffer.from("\r\n\r\n")
      while (idx < raw.length) {
        // Check for end boundary
        if (raw.slice(idx - 4, idx + endBoundary.length - 2).includes(endBoundary)) break
        const headerEnd = raw.indexOf(crlf2, idx)
        if (headerEnd === -1) break
        const headerBuf = raw.slice(idx, headerEnd)
        const headerText = headerBuf.toString("utf8")
        const headers: Record<string, string> = {}
        headerText.split("\r\n").forEach((line) => {
          const pos = line.indexOf(":")
          if (pos > -1) {
            const key = line.slice(0, pos).trim().toLowerCase()
            const val = line.slice(pos + 1).trim()
            headers[key] = val
          }
        })
        const bodyStart = headerEnd + crlf2.length
        // find next boundary marker
        let nextMarker = raw.indexOf(Buffer.from(`\r\n--${boundary}`), bodyStart)
        if (nextMarker === -1) {
          nextMarker = raw.indexOf(endBoundary, bodyStart)
          if (nextMarker === -1) nextMarker = raw.length
        }
        // Body is up to nextMarker
        const body = raw.slice(bodyStart, nextMarker)
        parts.push({ headers, body })
        // Move idx to after the next boundary marker + CRLF if any
        const after = raw.indexOf(dashBoundary, nextMarker) // could be end boundary as well
        if (after === -1) break
        idx = after + dashBoundary.length + 2
        // If it was end boundary "--", stop
        if (raw.slice(after, after + endBoundary.length).equals(endBoundary)) break
      }

      // Identify JSON and file parts
      let meta: any = {}
      let filePart: { filename: string; contentType: string; data: Buffer } | null = null
      for (const p of parts) {
        const cd = p.headers["content-disposition"] || ""
        const ct = (p.headers["content-type"] || "").toLowerCase()
        const filenameMatch = /filename="([^"]+)"/i.exec(cd)
        if (ct.includes("application/json")) {
          try {
            meta = JSON.parse(p.body.toString("utf8"))
          } catch {
            meta = {}
          }
        } else if (filenameMatch) {
          filePart = {
            filename: filenameMatch[1],
            contentType: ct || "application/octet-stream",
            data: p.body,
          }
        }
      }

      // Upload file if present
      let storagePath: string | null = null
      if (filePart) {
        const path = buildStoragePath(meta?.report_id, filePart.filename)
        const { error: upErr } = await supabaseAdmin.storage
          .from("credit-reports")
          .upload(path, filePart.data, {
            contentType: filePart.contentType || "application/pdf",
            upsert: false,
          })
        if (upErr) {
          return NextResponse.json({ ok: false, status: resp.status, error: upErr.message }, { status: 500 })
        }
        storagePath = path
      }

      // Insert DB row
      const row = {
        bucket: "credit-reports",
        storage_path: storagePath ?? "",
        assigned_to: [userId],
        status: "stored",
        metadata: {
          contentType: filePart?.contentType ?? null,
          size: filePart?.data?.length ?? null,
          originalName: filePart?.filename ?? null,
        } as any,
        borrower_id: borrowerId ?? null,
        organization_id: orgUuid,
        aggregator: meta?.aggregator ?? null,
      }
      const { data: created, error: insErr } = await supabaseAdmin
        .from("credit_reports")
        .insert(row as any)
        .select("id")
        .single()
      if (insErr || !created?.id) {
        return NextResponse.json({ ok: false, status: resp.status, error: insErr.message }, { status: 500 })
      }

      // Seed viewer record so the executing user can view the report
      try {
        await supabaseAdmin.from("credit_report_viewers").insert({
          report_id: created.id as string,
          user_id: userId,
          added_by: userId,
        } as any)
      } catch {
        // non-fatal
      }

      // Ensure chat mapping for (report,user)
      const { data: existingMap } = await supabaseAdmin
        .from("credit_report_user_chats")
        .select("chat_id")
        .eq("report_id", created.id as string)
        .eq("user_id", userId)
        .maybeSingle()
      let chatIdForUser = existingMap?.chat_id as string | undefined
      if (!chatIdForUser) {
        const { data: chat, error: chatErr } = await supabaseAdmin
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
            report_id: created.id as string,
            user_id: userId,
            chat_id: chatIdForUser,
          })
        }
      }

      return NextResponse.json({
        ok: resp.ok,
        status: resp.status,
        report_id: meta?.report_id ?? null,
        aggregator: meta?.aggregator ?? null,
        storage_path: storagePath,
        chat_id: chatIdForUser ?? null,
      })
    }

    // Fallbacks: raw binary (PDF) or JSON-only
    if (
      contentType.includes("application/pdf") ||
      (contentType.startsWith("application/") && !contentType.includes("json") && !contentType.includes("xml"))
    ) {
      // Raw binary body (e.g., application/pdf or application/octet-stream)
      const buf = Buffer.from(await resp.arrayBuffer())
      const cd = resp.headers.get("content-disposition") || ""
      const fn = /filename="([^"]+)"/i.exec(cd)?.[1] || "report.pdf"
      const ctype = contentType || "application/octet-stream"

      const storagePath = buildStoragePath(null, fn)
      const { error: upErr } = await supabaseAdmin.storage
        .from("credit-reports")
        .upload(storagePath, buf, { contentType: ctype, upsert: false })
      if (upErr) {
        return NextResponse.json({ ok: false, status: resp.status, error: upErr.message }, { status: 500 })
      }

      const row = {
        bucket: "credit-reports",
        storage_path: storagePath,
        assigned_to: [userId],
        status: "stored",
        metadata: { contentType: ctype, size: buf.length, originalName: fn } as any,
        borrower_id: borrowerId ?? null,
        organization_id: orgUuid,
        aggregator: null,
      }
      const { data: createdRaw, error: insErrRaw } = await supabaseAdmin
        .from("credit_reports")
        .insert(row as any)
        .select("id")
        .single()
      if (insErrRaw || !createdRaw?.id) {
        return NextResponse.json({ ok: false, status: resp.status, error: insErrRaw?.message ?? "insert failed" }, { status: 500 })
      }
      try {
        await supabaseAdmin.from("credit_report_viewers").insert({
          report_id: createdRaw.id as string,
          user_id: userId,
          added_by: userId,
        } as any)
      } catch {
        // ignore
      }

      // Ensure chat mapping for (report,user)
      const { data: existingMap2 } = await supabaseAdmin
        .from("credit_report_user_chats")
        .select("chat_id")
        .eq("report_id", createdRaw.id as string)
        .eq("user_id", userId)
        .maybeSingle()
      let chatId2 = existingMap2?.chat_id as string | undefined
      if (!chatId2) {
        const { data: chat2 } = await supabaseAdmin
          .from("credit_report_chats")
          .insert({
            user_id: userId,
            organization_id: orgUuid,
            name: "Credit report chat",
          })
          .select("id")
          .single()
        if (chat2?.id) {
          chatId2 = chat2.id as string
          await supabaseAdmin.from("credit_report_user_chats").insert({
            report_id: createdRaw.id as string,
            user_id: userId,
            chat_id: chatId2,
          })
        }
      }

      return NextResponse.json({
        ok: resp.ok,
        status: resp.status,
        report_id: null,
        aggregator: null,
        storage_path: storagePath,
        chat_id: chatId2 ?? null,
      })
    } else {
      // JSON-only
      const text = await resp.text()
      let json: any = null
      if ((contentType || "").includes("application/json")) {
        try {
          json = JSON.parse(text)
        } catch {
          json = { message: text }
        }
      } else {
        json = { message: text }
      }
      return NextResponse.json({ ok: resp.ok, status: resp.status, data: json })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

