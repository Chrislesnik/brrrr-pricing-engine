import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export const runtime = "nodejs"

export async function GET(_req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 })

    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const borrowerId = searchParams.get("borrowerId")
    if (!borrowerId) {
      return NextResponse.json({ documents: [] })
    }

    // Fetch credit reports matching filters
    const { data: rows, error } = await supabaseAdmin
      .from("credit_reports")
      .select("id, bucket, storage_path, status, created_at, metadata")
      .eq("organization_id", orgUuid)
      .eq("borrower_id", borrowerId)
      .contains("assigned_to", [userId])
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const documents: Array<{ id: string; name: string; created_at: string; status: string | null; url: string }> = []

    // Sign URLs (5 minutes)
    for (const row of rows ?? []) {
      const bucket = String((row as any).bucket)
      const path = String((row as any).storage_path)
      const meta = (row as any).metadata || {}
      const originalName = (meta?.originalName as string) || null
      const name = originalName || path.split("/").pop() || path
      const { data: signed, error: signErr } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 5)
      if (signErr || !signed?.signedUrl) {
        continue
      }
      documents.push({
        id: row.id as string,
        name,
        created_at: (row.created_at as string) ?? "",
        status: ((row.status as string | null) ?? null) as string | null,
        url: signed.signedUrl,
      })
    }

    return NextResponse.json({ documents })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

