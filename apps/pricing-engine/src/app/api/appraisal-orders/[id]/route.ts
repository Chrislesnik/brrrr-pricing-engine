import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

/**
 * PATCH /api/appraisal-orders/[id]
 * Update deal_id and/or borrower list on an appraisal.
 * Body: { deal_id?: string | null, borrower_ids?: string[] }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "No organization" }, { status: 401 })

    const { id } = await params
    const appraisalId = parseInt(id, 10)
    if (isNaN(appraisalId)) {
      return NextResponse.json({ error: "Invalid appraisal ID" }, { status: 400 })
    }

    // Verify the appraisal belongs to the caller's org
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("appraisal")
      .select("id, organization_id")
      .eq("id", appraisalId)
      .eq("organization_id", orgUuid)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

    const { deal_id, borrower_ids } = body as {
      deal_id?: string | null
      borrower_ids?: string[]
    }

    // Update deal_id on the appraisal row
    if (deal_id !== undefined) {
      const { error: updateErr } = await supabaseAdmin
        .from("appraisal")
        .update({ deal_id: deal_id || null })
        .eq("id", appraisalId)

      if (updateErr) {
        console.error("[PATCH /api/appraisal-orders] deal_id update error:", updateErr)
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }
    }

    // Replace borrowers via the junction table
    if (borrower_ids !== undefined) {
      // Delete all existing borrower links
      await supabaseAdmin
        .from("appraisal_borrowers")
        .delete()
        .eq("appraisal_id", appraisalId)

      // Insert new set
      if (borrower_ids.length > 0) {
        const rows = borrower_ids.map((bid) => ({
          appraisal_id: appraisalId,
          borrower_id: bid,
        }))
        const { error: insertErr } = await supabaseAdmin
          .from("appraisal_borrowers")
          .insert(rows)

        if (insertErr) {
          console.error("[PATCH /api/appraisal-orders] borrower insert error:", insertErr)
          return NextResponse.json({ error: insertErr.message }, { status: 500 })
        }
      }

      // Keep legacy borrower_id in sync (first borrower or null)
      await supabaseAdmin
        .from("appraisal")
        .update({ borrower_id: borrower_ids[0] ?? null })
        .eq("id", appraisalId)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[PATCH /api/appraisal-orders] Unexpected error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
