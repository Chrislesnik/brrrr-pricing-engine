import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id: dealId } = await params;

    // Get user info to check permissions
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id, is_internal_yn")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (userErr) {
      console.error("Error fetching user:", userErr);
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      );
    }

    if (!userRow) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isInternal = Boolean(userRow.is_internal_yn);
    const userNumericId = userRow.id as number;

    // Check if user has access to this deal (unless they're internal)
    if (!isInternal) {
      // Check direct deal roles
      const { data: directAccess } = await supabaseAdmin
        .from("deal_roles")
        .select("deal_id")
        .eq("users_id", userNumericId)
        .eq("deal_id", dealId)
        .maybeSingle();

      // Check organization access
      const { data: orgMemberships } = await supabaseAdmin
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId);

      const orgIds = (orgMemberships ?? [])
        .map((row) => row.organization_id)
        .filter(Boolean) as string[];

      let orgAccess = false;
      if (orgIds.length > 0) {
        const { data: orgDeals } = await supabaseAdmin
          .from("deal_clerk_orgs")
          .select("deal_id")
          .in("clerk_org_id", orgIds)
          .eq("deal_id", dealId)
          .maybeSingle();
        
        orgAccess = Boolean(orgDeals);
      }

      // If user doesn't have access, return 403
      if (!directAccess && !orgAccess) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Try fetching from "deals" table first (with relationships)
    let { data: deal, error } = await supabaseAdmin
      .from("deals")
      .select(`
        *,
        deal_guarantors(
          guarantor_id,
          is_primary,
          guarantor:guarantor_id(id, name)
        )
      `)
      .eq("id", dealId)
      .single();

    // If there's a relationship error, fall back to simpler query without relationships
    if (error && (error.message?.includes("relationship") || error.message?.includes("deal_guarantors"))) {
      console.log("Falling back to query without relationships");
      const result = await supabaseAdmin
        .from("deals")
        .select("*")
        .eq("id", dealId)
        .single();
      
      deal = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error fetching deal:", error.message, error.details, error.hint);
      return NextResponse.json(
        { error: error.message || "Failed to fetch deal" },
        { status: 500 }
      );
    }

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // If property_id exists, fetch property address
    if (deal.property_id) {
      const { data: property } = await supabaseAdmin
        .from("property")
        .select("id, address")
        .eq("id", deal.property_id)
        .single();
      
      if (property?.address) {
        deal.property_address = property.address;
      }
    }

    // Extract guarantor name if available
    if (deal.deal_guarantors && Array.isArray(deal.deal_guarantors)) {
      const primaryGuarantor = deal.deal_guarantors.find((dg: any) => dg.is_primary);
      const firstGuarantor = deal.deal_guarantors[0];
      const guarantorRecord = primaryGuarantor || firstGuarantor;
      if (guarantorRecord?.guarantor?.name) {
        deal.guarantor_name = guarantorRecord.guarantor.name;
      }
    }

    return NextResponse.json({ deal });
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id: dealId } = await params;

    // Get user info to check permissions
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id, is_internal_yn")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (userErr || !userRow) {
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      );
    }

    const isInternal = Boolean(userRow.is_internal_yn);
    const userNumericId = userRow.id as number;

    // Check if user has access to this deal (unless they're internal)
    if (!isInternal) {
      const { data: directAccess } = await supabaseAdmin
        .from("deal_roles")
        .select("deal_id")
        .eq("users_id", userNumericId)
        .eq("deal_id", dealId)
        .maybeSingle();

      const { data: orgMemberships } = await supabaseAdmin
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId);

      const orgIds = (orgMemberships ?? [])
        .map((row) => row.organization_id)
        .filter(Boolean) as string[];

      let orgAccess = false;
      if (orgIds.length > 0) {
        const { data: orgDeals } = await supabaseAdmin
          .from("deal_clerk_orgs")
          .select("deal_id")
          .in("clerk_org_id", orgIds)
          .eq("deal_id", dealId)
          .maybeSingle();
        
        orgAccess = Boolean(orgDeals);
      }

      if (!directAccess && !orgAccess) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Get the updated data from request body
    const body = await request.json();

    // Clean the data - remove null/undefined/empty strings
    const cleanText = (value: any) =>
      value && String(value).trim().length > 0 ? String(value).trim() : null;

    const cleanNumber = (value: any) => {
      const num = Number(value);
      return !isNaN(num) && value !== "" && value !== null ? num : null;
    };

    const updateData: Record<string, any> = {};

    // Only include fields that were provided in the request
    const allowedFields = [
      "deal_name",
      "vesting_type",
      "guarantor_count",
      "lead_source_type",
      "property_id",
      "property_type",
      "warrantability",
      "company_id",
      "note_date",
      "mid_fico",
      "pricing_is_locked",
      "lead_source_name",
      "loan_number",
      "title_file_number",
      "declaration_1_lawsuits",
      "declaration_2_bankruptcy",
      "declaration_3_felony",
      "declaration_5_license",
      "declaration_1_lawsuits_explanation",
      "declaration_2_bankruptcy_explanation",
      "declaration_3_felony_explanation",
      "recourse_type",
      "transaction_type",
      "payoff_mtg1_amount",
      "loan_structure_dscr",
      "guarantor_fico_score",
      "title_company_id",
      "insurance_carrier_company_id",
      "cash_out_purpose",
      "target_closing_date",
      "date_of_purchase",
      "loan_amount_total",
      "construction_holdback",
      "loan_amount_initial",
      "loan_term",
      "deal_type",
      "project_type",
      "deal_stage_1",
      "deal_stage_2",
      "deal_disposition_1",
      "loan_type_rtl",
      "renovation_cost",
      "renovation_completed",
      "recently_renovated",
      "purchase_price",
      "funding_date",
      "loan_sale_date",
      "pricing_file_path",
      "pricing_file_url",
      "loan_buyer_company_id",
      "note_rate",
      "cost_of_capital",
      "broker_company_id",
      "escrow_company_id",
      "ltv_asis",
      "ltv_after_repair",
      "io_period",
      "ppp_term",
      "ppp_structure_1",
    ];

    const numberFields = [
      "guarantor_count",
      "property_id",
      "mid_fico",
      "payoff_mtg1_amount",
      "guarantor_fico_score",
      "loan_amount_total",
      "construction_holdback",
      "loan_amount_initial",
      "renovation_cost",
      "purchase_price",
      "note_rate",
      "cost_of_capital",
      "ltv_asis",
      "ltv_after_repair",
      "io_period",
    ];

    const booleanFields = [
      "pricing_is_locked",
      "declaration_1_lawsuits",
      "declaration_2_bankruptcy",
      "declaration_3_felony",
      "declaration_5_license",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        if (booleanFields.includes(field)) {
          updateData[field] = Boolean(body[field]);
        } else if (numberFields.includes(field)) {
          updateData[field] = cleanNumber(body[field]);
        } else {
          updateData[field] = cleanText(body[field]);
        }
      }
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
