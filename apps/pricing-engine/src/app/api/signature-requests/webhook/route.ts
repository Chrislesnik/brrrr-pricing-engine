import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * POST /api/signature-requests/webhook
 * Handle Documenso webhooks for signature status updates
 *
 * Actual Documenso webhook payload shape:
 * {
 *   "event": "DOCUMENT_SIGNED" | "DOCUMENT_COMPLETED" | "DOCUMENT_REJECTED" | ...,
 *   "payload": { id: number, recipients: [...], status: "PENDING" | "COMPLETED", ... },
 *   "createdAt": "...",
 *   "webhookEndpoint": "..."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log("Documenso webhook received:", JSON.stringify(body, null, 2))

    const event: string | undefined = body.event
    const payload = body.payload ?? body.data

    if (!event || !payload) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    const documentId = payload.id ?? payload.document?.id ?? payload.documentId
    if (!documentId) {
      console.warn("Webhook missing documentId:", body)
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 })
    }

    const { data: request, error: fetchError } = await supabaseAdmin
      .from("deal_signature_requests")
      .select("*")
      .eq("documenso_document_id", String(documentId))
      .single()

    if (fetchError || !request) {
      console.warn("Signature request not found for document:", documentId)
      return NextResponse.json({ received: true, found: false })
    }

    const recipientsList: any[] = payload.recipients ?? []

    const normalizedEvent = event.toUpperCase().replace(/\./g, "_")

    switch (normalizedEvent) {
      case "DOCUMENT_COMPLETED": {
        const mapped = recipientsList.map((r: any) => ({
          email: r.email,
          name: r.name,
          status: "signed",
        }))

        await supabaseAdmin
          .from("deal_signature_requests")
          .update({
            status: "signed",
            recipients: mapped.length > 0 ? mapped : request.recipients,
          })
          .eq("id", request.id)

        console.log(`Document ${documentId} completed – all signatures received`)
        break
      }

      case "DOCUMENT_SIGNED":
      case "RECIPIENT_SIGNED": {
        const signerEmail =
          payload.Recipient?.[0]?.email ??
          payload.recipient?.email ??
          recipientsList.find((r: any) => r.signingStatus === "SIGNED")?.email

        if (signerEmail && Array.isArray(request.recipients)) {
          const updatedRecipients = request.recipients.map((r: any) => {
            if (r.email === signerEmail) return { ...r, status: "signed" }
            return r
          })

          const allSigned = updatedRecipients.every(
            (r: any) => r.status === "signed"
          )

          await supabaseAdmin
            .from("deal_signature_requests")
            .update({
              recipients: updatedRecipients,
              ...(allSigned ? { status: "signed" } : {}),
            })
            .eq("id", request.id)
        }

        console.log(`Recipient ${signerEmail} signed document ${documentId}`)
        break
      }

      case "DOCUMENT_REJECTED":
      case "DOCUMENT_DECLINED": {
        const declinedEmail =
          payload.Recipient?.[0]?.email ?? payload.recipient?.email

        const updatedRecipients = Array.isArray(request.recipients)
          ? request.recipients.map((r: any) => {
              if (r.email === declinedEmail) return { ...r, status: "declined" }
              return r
            })
          : request.recipients

        await supabaseAdmin
          .from("deal_signature_requests")
          .update({ status: "declined", recipients: updatedRecipients })
          .eq("id", request.id)

        console.log(`Document ${documentId} declined by ${declinedEmail}`)
        break
      }

      case "DOCUMENT_EXPIRED": {
        await supabaseAdmin
          .from("deal_signature_requests")
          .update({ status: "expired" })
          .eq("id", request.id)

        console.log(`Document ${documentId} expired`)
        break
      }

      default:
        console.log(`Unhandled webhook event: ${event} (normalized: ${normalizedEvent})`)
    }

    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ received: true, error: "Processing error" })
  }
}

export async function GET() {
  return NextResponse.json({ status: "Documenso webhook endpoint active" })
}
