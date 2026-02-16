import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId: clerkOrgId, orgRole } = await auth()

    if (!clerkOrgId) {
      return NextResponse.json({ members: [] })
    }

    if (orgRole === "org:broker" || orgRole === "broker") {
      return NextResponse.json({ members: [], error: "Forbidden" }, { status: 403 })
    }

    const { orgId } = await params

    const { data: members, error } = await supabaseAdmin
      .from("organization_members")
      .select(
        "id, first_name, last_name, clerk_org_role, clerk_member_role, created_at"
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Fetch org members error:", error.message)
      return NextResponse.json({ members: [] })
    }

    return NextResponse.json({
      members: (members ?? []).map((m) => ({
        id: m.id,
        first_name: m.first_name ?? null,
        last_name: m.last_name ?? null,
        clerk_org_role: m.clerk_org_role ?? "member",
        clerk_member_role: m.clerk_member_role ?? null,
        created_at: m.created_at,
      })),
    })
  } catch (error) {
    console.error("Org members API error:", error)
    return NextResponse.json(
      { members: [], error: "Failed to fetch members" },
      { status: 500 }
    )
  }
}
