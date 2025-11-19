import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function PATCH(req: Request, context: unknown) {
  try {
    const { params } = (context as { params: { id: string } }) ?? { params: { id: "" } }
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const id = params.id
    const body = (await req.json().catch(() => null)) as { status?: "active" | "dead" } | null
    if (!id || !body?.status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 })
    }
    const { error } = await supabaseAdmin.from("loans").update({ status: body.status }).eq("id", id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request, context: unknown) {
  // Support POST for status updates, per consumer requirement
  return PATCH(req, context)
}

export async function DELETE(_req: Request, context: unknown) {
  try {
    const { params } = (context as { params: { id: string } }) ?? { params: { id: "" } }
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const id = params.id
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const { error } = await supabaseAdmin.from("loans").delete().eq("id", id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


