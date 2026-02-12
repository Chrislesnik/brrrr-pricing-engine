import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * POST /api/signature-requests/webhook
 * Handle Documenso webhooks for signature status updates
 * 
 * Documenso webhook events:
 * - document.completed: All recipients have signed
 * - recipient.signed: Individual recipient signed
 * - document.declined: Recipient declined to sign
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Log webhook for debugging
    console.log("Documenso webhook received:", JSON.stringify(body, null, 2))

    const { event, data } = body

    if (!event || !data) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    const documentId = data.document?.id || data.documentId
    
    if (!documentId) {
      console.warn("Webhook missing documentId:", body)
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 })
    }

    // Find the signature request by Documenso document ID
    const { data: request, error: fetchError } = await supabaseAdmin
      .from("deal_signature_requests")
      .select("*")
      .eq("documenso_document_id", String(documentId))
      .single()

    if (fetchError || !request) {
      console.warn("Signature request not found for document:", documentId)
      // Return 200 to acknowledge receipt even if we don't have the document
      return NextResponse.json({ received: true, found: false })
    }

    // Handle different event types
    switch (event) {
      case "document.completed": {
        // All recipients have signed
        await supabaseAdmin
          .from("deal_signature_requests")
          .update({
            status: "signed",
            recipients: data.recipients?.map((r: any) => ({
              email: r.email,
              name: r.name,
              status: "signed",
            })) || request.recipients,
          })
          .eq("id", request.id)
        
        console.log(`Document ${documentId} completed - all signatures received`)
        break
      }

      case "recipient.signed": {
        // Individual recipient signed - update their status in recipients array
        const recipientEmail = data.recipient?.email
        
        if (recipientEmail && Array.isArray(request.recipients)) {
          const updatedRecipients = request.recipients.map((r: any) => {
            if (r.email === recipientEmail) {
              return { ...r, status: "signed" }
            }
            return r
          })

          await supabaseAdmin
            .from("deal_signature_requests")
            .update({ recipients: updatedRecipients })
            .eq("id", request.id)
        }
        
        console.log(`Recipient ${recipientEmail} signed document ${documentId}`)
        break
      }

      case "document.declined": {
        // A recipient declined to sign
        const declinedEmail = data.recipient?.email
        
        const updatedRecipients = Array.isArray(request.recipients)
          ? request.recipients.map((r: any) => {
              if (r.email === declinedEmail) {
                return { ...r, status: "declined" }
              }
              return r
            })
          : request.recipients

        await supabaseAdmin
          .from("deal_signature_requests")
          .update({
            status: "declined",
            recipients: updatedRecipients,
          })
          .eq("id", request.id)
        
        console.log(`Document ${documentId} declined by ${declinedEmail}`)
        break
      }

      case "document.expired": {
        await supabaseAdmin
          .from("deal_signature_requests")
          .update({ status: "expired" })
          .eq("id", request.id)
        
        console.log(`Document ${documentId} expired`)
        break
      }

      default:
        console.log(`Unhandled webhook event: ${event}`)
    }

    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error("Webhook processing error:", error)
    // Return 200 to prevent Documenso from retrying
    return NextResponse.json({ received: true, error: "Processing error" })
  }
}

// Allow GET for webhook verification (some services require this)
export async function GET() {
  return NextResponse.json({ status: "Documenso webhook endpoint active" })
}
