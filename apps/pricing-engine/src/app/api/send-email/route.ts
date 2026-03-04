import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { resolveDealMergeValues, resolveMergeValues } from "@/lib/email-template/merge-resolver"

const RESEND_API_URL = "https://api.resend.com/emails"

function resolveTags(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, name: string) => {
    return values[name.trim()] ?? match
  })
}

/**
 * POST /api/send-email
 *
 * Sends a single transactional email via Resend.
 * When dealId is provided, resolves {{merge_tags}} in all fields before sending.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured" },
      { status: 500 }
    )
  }

  const body = (await req.json()) as {
    to: string
    from: string
    cc?: string
    bcc?: string
    subject: string
    html: string
    replyTo?: string
    dealId?: string
  }

  if (!body.to?.trim()) {
    return NextResponse.json({ error: "Recipient (to) is required" }, { status: 400 })
  }
  if (!body.from?.trim()) {
    return NextResponse.json({ error: "Sender (from) is required" }, { status: 400 })
  }
  if (!body.subject?.trim()) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 })
  }

  let values: Record<string, string> = {}
  if (body.dealId) {
    const [dealValues, loanValues] = await Promise.all([
      resolveDealMergeValues(body.dealId).catch(() => ({})),
      resolveMergeValues(body.dealId).catch(() => ({})),
    ])
    values = { ...loanValues, ...dealValues }
  }

  console.log("[send-email] dealId:", body.dealId, "| resolved keys:", Object.keys(values).filter(k => values[k]).length)

  const resolvedTo = resolveTags(body.to, values)
  const resolvedFrom = resolveTags(body.from, values)
  const resolvedSubject = resolveTags(body.subject, values)
  const resolvedHtml = resolveTags(body.html, values)
  const resolvedCc = body.cc ? resolveTags(body.cc, values) : undefined
  const resolvedBcc = body.bcc ? resolveTags(body.bcc, values) : undefined
  const resolvedReplyTo = body.replyTo ? resolveTags(body.replyTo, values) : undefined

  const toAddresses = resolvedTo.split(",").map((s) => s.trim()).filter(Boolean)
  const ccAddresses = resolvedCc ? resolvedCc.split(",").map((s) => s.trim()).filter(Boolean) : undefined
  const bccAddresses = resolvedBcc ? resolvedBcc.split(",").map((s) => s.trim()).filter(Boolean) : undefined
  const replyTo = resolvedReplyTo ? resolvedReplyTo.split(",").map((s) => s.trim()).filter(Boolean) : undefined

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `compose/${userId}/${Date.now()}`,
      },
      body: JSON.stringify({
        from: resolvedFrom,
        to: toAddresses,
        subject: resolvedSubject,
        html: resolvedHtml,
        ...(ccAddresses && { cc: ccAddresses }),
        ...(bccAddresses && { bcc: bccAddresses }),
        ...(replyTo && { reply_to: replyTo }),
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
      return NextResponse.json(
        { error: err.message || `Resend error: HTTP ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json({
      id: data.id,
      _debug: {
        dealId: body.dealId,
        mergeValueKeys: Object.keys(values),
        mergeValueCount: Object.keys(values).length,
        sampleValues: Object.fromEntries(Object.entries(values).slice(0, 5)),
        subjectBefore: body.subject,
        subjectAfter: resolvedSubject,
      },
    })
  } catch (err) {
    console.error("[send-email] failed:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    )
  }
}
