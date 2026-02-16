import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { archiveRecord, restoreRecord } from "@/lib/archive-helpers"

export const runtime = "nodejs"

async function logStatusChange(
  loanId: string,
  userId: string,
  action: string,
  fromStatus: string | null,
  toStatus: string
) {
  try {
    const { error } = await supabaseAdmin.from("pricing_activity_log").insert({
      loan_id: loanId,
      activity_type: "status_change",
      action,
      user_id: userId,
      inputs: { from: fromStatus, to: toStatus },
    })
    if (error) {
      console.error("[logStatusChange] insert failed:", error.message, error.details)
    }
  } catch (e) {
    console.error("[logStatusChange] unexpected error:", e)
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { userId } = await auth()
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = (await req.json().catch(() => null)) as {
      status?: "active" | "inactive"
      action?: "restore"
    } | null

    // Handle restore from archive
    if (body?.action === "restore") {
      const { error } = await restoreRecord("loans", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      await logStatusChange(id, userId, "restored", "archived", "active")
      return NextResponse.json({ ok: true })
    }

    if (!id || !body?.status) {
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 }
      )
    }

    // Fetch current status before updating
    const { data: current } = await supabaseAdmin
      .from("loans")
      .select("status")
      .eq("id", id)
      .single()
    const previousStatus = (current?.status as string) ?? null

    const { error } = await supabaseAdmin
      .from("loans")
      .update({ status: body.status })
      .eq("id", id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (previousStatus !== body.status) {
      await logStatusChange(id, userId, "changed", previousStatus, body.status)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  // Support POST for status updates, per consumer requirement
  return PATCH(req, context)
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { userId } = await auth()
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    // Fetch current status before archiving
    const { data: current } = await supabaseAdmin
      .from("loans")
      .select("status")
      .eq("id", id)
      .single()
    const previousStatus = (current?.status as string) ?? "active"

    const { error } = await archiveRecord("loans", id, userId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logStatusChange(id, userId, "archived", previousStatus, "archived")

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
