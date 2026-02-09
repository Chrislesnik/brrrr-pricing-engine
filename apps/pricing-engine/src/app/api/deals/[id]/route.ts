import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id: dealId } = await params;

    // Get user's organization UUID
    const userOrgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null;

    // First, fetch the deal to check organization access
    const { data: deal, error } = await supabaseAdmin
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();

    if (error) {
      console.error("Error fetching deal:", error.message);
      return NextResponse.json(
        { error: error.message || "Failed to fetch deal" },
        { status: 500 }
      );
    }

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Check if user has access to this deal via organization
    const dealOrgId = deal.organization_id;
    const hasOrgAccess = userOrgUuid && dealOrgId === userOrgUuid;

    // Also check if user is assigned to this deal
    const assignedUsers = Array.isArray(deal.assigned_to_user_id) ? deal.assigned_to_user_id : [];
    const isAssigned = assignedUsers.includes(userId);
    const isPrimaryUser = deal.primary_user_id === userId;

    // Check for internal user status (fallback)
    let isInternal = false;
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("id, is_internal_yn")
      .eq("clerk_user_id", userId)
      .maybeSingle();
      
    if (userRow) {
      isInternal = Boolean(userRow.is_internal_yn);
    }

    // If user doesn't have access, return 403
    if (!hasOrgAccess && !isAssigned && !isPrimaryUser && !isInternal) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Transform the deal data to include useful fields from inputs
    const inputs = (deal.inputs as Record<string, unknown>) || {};
    
    // Add computed/extracted fields for the UI
    const transformedDeal = {
      ...deal,
      // Extract commonly needed fields from inputs for convenience
      loan_number: (inputs.loan_number as string) || deal.id,
      deal_name: (inputs.deal_name as string) || null,
      deal_stage_1: (inputs.deal_stage_1 as string) || null,
      deal_stage_2: (inputs.deal_stage_2 as string) || deal.status || null,
      loan_amount_total: deal.loan_amount || (inputs.loan_amount_total as number) || null,
      funding_date: (inputs.funding_date as string) || null,
      project_type: (inputs.project_type as string) || deal.transaction_type || null,
      guarantor_name: (inputs.guarantor_name as string) || null,
      note_rate: deal.rate || (inputs.note_rate as number) || null,
      // Include borrower info
      borrower_name: [deal.borrower_first_name, deal.borrower_last_name].filter(Boolean).join(" ") || (inputs.borrower_name as string) || null,
    };

    return NextResponse.json({ deal: transformedDeal });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id: dealId } = await params;

    // Get user's organization UUID
    const userOrgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null;

    // First, fetch the deal to check organization access
    const { data: existingDeal, error: fetchError } = await supabaseAdmin
      .from("deals")
      .select("organization_id, assigned_to_user_id, primary_user_id, inputs")
      .eq("id", dealId)
      .single();

    if (fetchError || !existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Check if user has access to this deal via organization
    const dealOrgId = existingDeal.organization_id;
    const hasOrgAccess = userOrgUuid && dealOrgId === userOrgUuid;

    // Also check if user is assigned to this deal
    const assignedUsers = Array.isArray(existingDeal.assigned_to_user_id) ? existingDeal.assigned_to_user_id : [];
    const isAssigned = assignedUsers.includes(userId);
    const isPrimaryUser = existingDeal.primary_user_id === userId;

    // Check for internal user status (fallback)
    let isInternal = false;
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("id, is_internal_yn")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (userRow) {
      isInternal = Boolean(userRow.is_internal_yn);
    }

    // If user doesn't have access, return 403
    if (!hasOrgAccess && !isAssigned && !isPrimaryUser && !isInternal) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
    }

    // Get the updated data from request body
    const body = await request.json();

    // Fields that map to top-level columns in deals table
    const topLevelFields = [
      "property_address",
      "loan_amount",
      "rate",
      "status",
      "loan_type",
      "transaction_type",
      "borrower_first_name",
      "borrower_last_name",
    ];

    // Build update payload
    const updateData: Record<string, unknown> = {};
    const inputsUpdate: Record<string, unknown> = { ...(existingDeal.inputs as Record<string, unknown> || {}) };

    for (const [key, value] of Object.entries(body)) {
      if (topLevelFields.includes(key)) {
        // Update top-level column
        updateData[key] = value;
        } else {
        // Update in inputs JSONB
        inputsUpdate[key] = value;
      }
    }

    // Always update inputs if we have changes
    if (Object.keys(inputsUpdate).length > 0) {
      updateData.inputs = inputsUpdate;
    }

    // Update the deal
    const { data: updatedDeal, error } = await supabaseAdmin
      .from("deals")
      .update(updateData)
      .eq("id", dealId)
      .select()
      .single();

    if (error) {
      console.error("Error updating deal:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update deal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deal: updatedDeal });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
