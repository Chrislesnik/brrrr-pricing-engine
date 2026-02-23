import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { archiveRecord, restoreRecord } from "@/lib/archive-helpers"

export const runtime = "nodejs"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const url = new URL(req.url)
    if (url.searchParams.get("action") === "restore") {
      const { error } = await restoreRecord("background_reports", id)
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    const { error } = await archiveRecord("background_reports", id, userId)
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
