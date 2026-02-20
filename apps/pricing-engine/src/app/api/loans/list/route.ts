import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * GET /api/loans/list
 * Returns a lightweight list of loans for the caller's org,
 * suitable for populating a deal selector (e.g. email preview).
 *
 * Resolves org via organization_members (userId-based) so this works
 * regardless of whether Clerk's orgId is set in the session.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Resolve org UUID from the caller's membership — more reliable than orgId from Clerk session
  const { data: membership, error: memberErr } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()

  if (memberErr || !membership?.organization_id) {
    return NextResponse.json([], { status: 200 })
  }

  const orgUuid = membership.organization_id as string

  const { data, error } = await supabaseAdmin
    .from("loans")
    .select("id, display_id, inputs")
    .eq("organization_id", orgUuid)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[/api/loans/list] Supabase error:", error.message)
    return NextResponse.json([], { status: 200 })
  }

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
