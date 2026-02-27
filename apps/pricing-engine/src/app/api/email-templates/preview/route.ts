import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { resolveMergeValues } from "@/lib/email-template/merge-resolver"
import { renderTemplate, wrapEmailHtml } from "@/lib/email-template/template-renderer"

function resolveMergeTags(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, name: string) => {
    return values[name.trim()] ?? match
  })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    loanId,
    editorJson,
    bodyHtml,
    styles,
    headers,
  } = body as {
    loanId?: string
    editorJson?: Record<string, unknown>
    bodyHtml?: string
    styles?: Record<string, unknown>
    headers?: {
      to?: string
      from?: string
      subject?: string
      replyTo?: string
      cc?: string
      bcc?: string
      previewText?: string
    }
  }

  if (!editorJson && !bodyHtml) {
    return NextResponse.json({ error: "editorJson or bodyHtml is required" }, { status: 400 })
  }

  const values = loanId ? await resolveMergeValues(loanId) : {}

  const styleOpts = {
    fontFamily: (styles?.fontFamily as string | undefined) ?? undefined,
    fontSize: (styles?.fontSize as number | undefined) ?? undefined,
    lineHeight: (styles?.lineHeight as number | undefined) ?? undefined,
    containerWidth: (styles?.containerWidth as number | undefined) ?? undefined,
    bodyBackground: (styles?.bodyBackground as string | undefined) ?? undefined,
    linkColor: (styles?.linkColor as string | undefined) ?? undefined,
    buttonBackground: (styles?.buttonBackground as string | undefined) ?? undefined,
    buttonTextColor: (styles?.buttonTextColor as string | undefined) ?? undefined,
    buttonRadius: (styles?.buttonRadius as number | undefined) ?? undefined,
  }

  let html: string
  if (editorJson) {
    html = renderTemplate(editorJson, values, styleOpts)
  } else {
    let resolved = bodyHtml!
    for (const [key, val] of Object.entries(values)) {
      resolved = resolved.replaceAll(`{{${key}}}`, val)
    }
    html = wrapEmailHtml(resolved, styleOpts)
  }

  if (headers) {
    const resolvedHeaders = {
      to: headers.to ? resolveMergeTags(headers.to, values) : "",
      from: headers.from ? resolveMergeTags(headers.from, values) : "",
      subject: headers.subject ? resolveMergeTags(headers.subject, values) : "(no subject)",
      replyTo: headers.replyTo ? resolveMergeTags(headers.replyTo, values) : "",
      cc: headers.cc ? resolveMergeTags(headers.cc, values) : "",
      bcc: headers.bcc ? resolveMergeTags(headers.bcc, values) : "",
      previewText: headers.previewText ? resolveMergeTags(headers.previewText, values) : "",
    }

    return NextResponse.json({
      headers: resolvedHeaders,
      bodyHtml: html,
    })
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
