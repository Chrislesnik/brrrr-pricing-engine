import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await auth()

    const { searchParams } = new URL(req.url)
    const loanType = (searchParams.get("loanType") || "").toLowerCase()
    if (!loanType) return new NextResponse("Missing loanType", { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)

    const query = supabaseAdmin
      .from("programs")
      .select("id,internal_name,external_name")
      .eq("loan_type", loanType)
      .eq("status", "active")
      .order("internal_name", { ascending: true })
    const { data, error } = orgUuid
      ? await query.eq("organization_id", orgUuid)
      : await query

    if (error) return new NextResponse(error.message, { status: 500 })

    return NextResponse.json({ programs: data ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}


