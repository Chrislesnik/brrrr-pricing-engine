import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { archiveRecord, restoreRecord } from "@/lib/archive-helpers"

export const runtime = "nodejs"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reportId } = await params
    if (!reportId) {
      return NextResponse.json({ error: "Missing reportId" }, { status: 400 })
    }

    const url = new URL(req.url)
    if (url.searchParams.get("action") === "restore") {
      const { error } = await restoreRecord("credit_reports", reportId)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    const { error } = await archiveRecord("credit_reports", reportId, userId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
