import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId)
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      )

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid)
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )

    // Await params in Next.js 16+
    const { id: borrowerId } = await params
    if (!borrowerId)
      return NextResponse.json({ error: "Missing id" }, { status: 400 })

    // Fetch within the active organization. We intentionally do NOT require
    // the signed-in user to be in assigned_to here so carousel selections
    // can load regardless of assignment. Authorization is handled at the org level.
    const { data, error } = await supabaseAdmin
      .from("borrowers")
      .select(
        "id, first_name, last_name, date_of_birth, email, primary_phone, address_line1, address_line2, city, state, zip, county, ssn_last4"
      )
      .eq("id", borrowerId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ borrower: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
