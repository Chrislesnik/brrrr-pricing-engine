import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

/**
 * GET /api/loans/list
 * Returns a lightweight list of loans for the caller's org,
 * suitable for populating a deal selector (e.g. email preview).
 */
export async function GET() {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) return NextResponse.json([], { status: 200 })

  const { data, error } = await supabaseAdmin
    .from("loans")
    .select("id, display_id, inputs")
    .eq("organization_id", orgUuid)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json([], { status: 200 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loans = (data ?? []).map((l: any) => {
    const inputs = (l.inputs ?? {}) as Record<string, unknown>
    const addr = (inputs["address"] ?? {}) as { street?: string; city?: string }
    const addrLabel = [addr.street, addr.city].filter(Boolean).join(", ")
    const borrower = (inputs["borrower_name"] as string | undefined) ?? ""
    const label = [borrower, addrLabel].filter(Boolean).join(" — ")
    return {
      id: l.id as string,
      displayId: (l.display_id as string) ?? l.id,
      label,
    }
  })

  return NextResponse.json(loans)
}
