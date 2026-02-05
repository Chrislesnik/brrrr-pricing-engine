import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ canAccess: false }, { status: 200 });
    }

    // Check if user has "admin" or "owner" role in an internal organization
    const { data, error } = await supabaseAdmin
      .from("organization_members")
      .select(`
        clerk_org_role,
        organizations!inner (
          is_internal_yn,
          clerk_organization_id
        )
      `)
      .eq("user_id", userId)
      .eq("organizations.clerk_organization_id", orgId)
      .in("clerk_org_role", ["admin", "owner"])
      .eq("organizations.is_internal_yn", true)
      .limit(1);

    if (error) {
      console.error("Error checking programs access:", error);
      return NextResponse.json({ canAccess: false }, { status: 200 });
    }

    const canAccess = data && data.length > 0;

    return NextResponse.json({ canAccess }, { status: 200 });
  } catch (error) {
    console.error("Error in programs-access:", error);
    return NextResponse.json({ canAccess: false }, { status: 200 });
  }
}
