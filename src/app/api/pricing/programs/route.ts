import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return new NextResponse("Unauthorized", { status: 401 })
    if (!orgId) return new NextResponse("No active organization", { status: 400 })

    const { searchParams } = new URL(req.url)
    const loanType = (searchParams.get("loanType") || "").toLowerCase()
    if (!loanType) return new NextResponse("Missing loanType", { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return new NextResponse("Organization not found", { status: 400 })

    const { data, error } = await supabaseAdmin
      .from("programs")
      .select("internal_name,external_name")
      .eq("organization_id", orgUuid)
      .eq("loan_type", loanType)
      .eq("status", "active")
      .order("internal_name", { ascending: true })

    if (error) return new NextResponse(error.message, { status: 500 })

    return NextResponse.json({ programs: data ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}


