import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import {
  getTemplate,
  createDocumentFromTemplate,
  sendDocument,
} from "@/lib/documenso"

export const runtime = "nodejs"

interface SendSignatureBody {
  template_id: string
  signer_email: string
  signer_name?: string
  form_data?: Record<string, unknown>
}

export async function POST(
  req: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization mapping not found" }, { status: 400 })
    }

    const { loanId } = await context.params

    // Verify the application exists and belongs to this org
    const { data: app, error: appFetchErr } = await supabaseAdmin
      .from("applications")
      .select("loan_id, organization_id")
      .eq("loan_id", loanId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (appFetchErr || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const body = (await req.json().catch(() => null)) as SendSignatureBody | null
    if (!body?.template_id || !body?.signer_email) {
      return NextResponse.json(
        { error: "template_id and signer_email are required" },
        { status: 400 },
      )
    }

    const templateId = Number(body.template_id)
    if (isNaN(templateId)) {
      return NextResponse.json({ error: "Invalid template_id" }, { status: 400 })
    }

    // 1) Fetch the template to get its pre-configured recipients
    const template = await getTemplate(templateId)
    const templateRecipients = template.recipients ?? []

    if (templateRecipients.length === 0) {
      return NextResponse.json(
        { error: "Template has no recipients configured" },
        { status: 400 },
      )
    }

    // 2) Map template recipients — override with the signer's info
    const recipients = templateRecipients.map((r) => ({
      id: r.id,
      name: body.signer_name || body.signer_email.split("@")[0],
      email: body.signer_email,
      role: r.role,
      signingOrder: r.signingOrder,
    }))

    // 3) Create a document from the template and auto-send
    let result: Awaited<ReturnType<typeof createDocumentFromTemplate>>

    try {
      result = await createDocumentFromTemplate(templateId, {
        recipients,
        sendDocument: true,
      })
    } catch (docErr) {
      // If auto-send fails via the template endpoint, try manual send
      result = await createDocumentFromTemplate(templateId, {
        recipients,
        sendDocument: false,
      })

      try {
        await sendDocument(String(result.documentId))
      } catch (sendErr) {
        console.error("Failed to send document:", sendErr)
      }
    }

    const docId = String(result.documentId)

    // 4) Update the application with the Documenso document ID
    await supabaseAdmin
      .from("applications")
      .update({
        documenso_document_id: docId,
        status: "sent",
        form_data: body.form_data ?? {},
      })
      .eq("loan_id", loanId)

    // 5) Record the signing in application_signings
    await supabaseAdmin.from("application_signings").insert({
      loan_id: loanId,
      signer_email: body.signer_email,
      documenso_document_id: docId,
    })

    return NextResponse.json({
      success: true,
      documentId: docId,
      loanId,
    })
  } catch (err) {
    console.error("Send signature error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    )
  }
}
