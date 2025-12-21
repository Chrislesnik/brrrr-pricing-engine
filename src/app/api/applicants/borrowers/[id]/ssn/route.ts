import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { decryptFromAny } from "@/lib/crypto"

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })
    const { id } = await ctx.params

    const { data, error } = await supabaseAdmin
      .from("borrowers")
      .select("ssn_encrypted, organization_id")
      .eq("id", id)
      .eq("organization_id", orgUuid)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.ssn_encrypted) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const ssn = decryptFromAny(data.ssn_encrypted as unknown as string)
    if (!/^[0-9]{9}$/.test(ssn)) {
      return NextResponse.json({ error: "Corrupt data" }, { status: 500 })
    }
    return NextResponse.json({ ssn })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


