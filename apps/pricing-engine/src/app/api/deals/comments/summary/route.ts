import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getDealAccess } from "@/lib/deal-access"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ summary: {} }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const idsParam = searchParams.get("ids") ?? ""
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json({ summary: {} })
    }

    const { isInternal, allowedDealIds } = await getDealAccess(userId)
    const visibleIds = isInternal
      ? ids
      : ids.filter((id) => allowedDealIds.has(id))

    if (visibleIds.length === 0) {
      return NextResponse.json({ summary: {} })
    }

    const { data: comments, error: commentsErr } = await supabaseAdmin
      .from("deal_comments")
      .select("deal_id, created_at")
      .in("deal_id", visibleIds)

    if (commentsErr) {
      return NextResponse.json({ error: commentsErr.message }, { status: 500 })
    }

    const { data: reads, error: readsErr } = await supabaseAdmin
      .from("deal_comment_reads")
      .select("deal_id, last_read_at")
      .eq("clerk_user_id", userId)
      .in("deal_id", visibleIds)

    if (readsErr) {
      return NextResponse.json({ error: readsErr.message }, { status: 500 })
    }

    const readMap = new Map<string, string>()
    ;(reads ?? []).forEach((row) => {
      if (row.deal_id && row.last_read_at) {
        readMap.set(row.deal_id, row.last_read_at)
      }
    })

    const summary: Record<
      string,
      { count: number; hasUnread: boolean }
    > = {}

    for (const id of visibleIds) {
      summary[id] = { count: 0, hasUnread: false }
    }

    const counts: Record<string, number> = {}
    const latestByDeal: Record<string, string> = {}

    ;(comments ?? []).forEach((row) => {
      if (!row.deal_id || !row.created_at) return
      counts[row.deal_id] = (counts[row.deal_id] ?? 0) + 1
      const prev = latestByDeal[row.deal_id]
      if (!prev || row.created_at > prev) {
        latestByDeal[row.deal_id] = row.created_at
      }
    })

    for (const id of visibleIds) {
      const count = counts[id] ?? 0
      const lastRead = readMap.get(id)
      const latest = latestByDeal[id]
      const hasUnread = !!latest && (!lastRead || latest > lastRead)
      summary[id] = { count, hasUnread }
    }

    return NextResponse.json({ summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
