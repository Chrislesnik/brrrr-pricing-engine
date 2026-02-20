import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { resolveMergeValues } from "@/lib/email-template/merge-resolver"
import { renderTemplate } from "@/lib/email-template/template-renderer"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { loanId, editorJson, styles } = body as {
    loanId?: string
    editorJson: Record<string, unknown>
    styles?: Record<string, unknown>
  }

  if (!editorJson) {
    return NextResponse.json({ error: "editorJson is required" }, { status: 400 })
  }

  // Resolve merge tag values (empty if no loanId provided)
  const values = loanId ? await resolveMergeValues(loanId) : {}

  const html = renderTemplate(editorJson, values, {
    fontFamily: (styles?.fontFamily as string | undefined) ?? undefined,
    fontSize: (styles?.fontSize as number | undefined) ?? undefined,
    lineHeight: (styles?.lineHeight as number | undefined) ?? undefined,
    containerWidth: (styles?.containerWidth as number | undefined) ?? undefined,
    bodyBackground: (styles?.bodyBackground as string | undefined) ?? undefined,
    linkColor: (styles?.linkColor as string | undefined) ?? undefined,
    buttonBackground: (styles?.buttonBackground as string | undefined) ?? undefined,
    buttonTextColor: (styles?.buttonTextColor as string | undefined) ?? undefined,
    buttonRadius: (styles?.buttonRadius as number | undefined) ?? undefined,
  })

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
