import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getDealAccess } from "@/lib/deal-access"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ comments: [] }, { status: 401 })
    }

    const { id: dealId } = await params
    const { isInternal, allowedDealIds } = await getDealAccess(userId)
    if (!isInternal && !allowedDealIds.has(dealId)) {
      return NextResponse.json({ comments: [] }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const markRead = searchParams.get("markRead") === "1"

    const { data: comments, error } = await supabaseAdmin
      .from("deal_comments")
      .select(
        "id, author_name, author_avatar_url, content, created_at, author_clerk_user_id"
      )
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (markRead) {
      await supabaseAdmin.from("deal_comment_reads").upsert(
        {
          deal_id: dealId,
          clerk_user_id: userId,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "deal_id,clerk_user_id" }
      )
    }

    return NextResponse.json({ comments: comments ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: dealId } = await params
    const { isInternal, allowedDealIds } = await getDealAccess(userId)
    if (!isInternal && !allowedDealIds.has(dealId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const json = await req.json().catch(() => ({}))
    const content = typeof json?.content === "string" ? json.content.trim() : ""
    if (!content) {
      return NextResponse.json({ error: "Content required" }, { status: 400 })
    }

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("users")
      .select("full_name, first_name, last_name, image_url")
      .eq("clerk_user_id", userId)
      .maybeSingle()

    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 500 })
    }

    const authorName =
      userRow?.full_name ||
      [userRow?.first_name, userRow?.last_name].filter(Boolean).join(" ") ||
      "You"
    const authorAvatar = userRow?.image_url ?? ""

    const { data: comment, error } = await supabaseAdmin
      .from("deal_comments")
      .insert({
        deal_id: dealId,
        author_clerk_user_id: userId,
        author_name: authorName,
        author_avatar_url: authorAvatar,
        content,
      })
      .select(
        "id, author_name, author_avatar_url, content, created_at, author_clerk_user_id"
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin.from("deal_comment_reads").upsert(
      {
        deal_id: dealId,
        clerk_user_id: userId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "deal_id,clerk_user_id" }
    )

    return NextResponse.json({ comment })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
