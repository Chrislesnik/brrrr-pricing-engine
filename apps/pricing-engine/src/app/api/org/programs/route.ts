import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("programs")
      .select("id, loan_type, internal_name, external_name, status")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
    if (error) {
      return NextResponse.json({ items: [], error: error.message }, { status: 200 })
    }
    const items = Array.isArray(data)
      ? data.map((p) => ({
          id: p.id as string,
          loan_type: (p.loan_type as string) ?? "",
          internal_name: (p.internal_name as string) ?? "",
          external_name: (p.external_name as string) ?? "",
          status: (p.status as string) ?? "",
        }))
      : []
    return NextResponse.json({ items })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch programs"
    return NextResponse.json({ items: [], error: msg }, { status: 200 })
  }
}
