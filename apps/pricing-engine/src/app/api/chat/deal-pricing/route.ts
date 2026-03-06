export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

/**
 * POST /api/chat/deal-pricing
 *
 * Returns deal inputs, pricing engine fields, mapped fields, and missing required fields
 * for the GET LOAN PRICING flow.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { dealId } = body as { dealId: string };

    if (!dealId) {
      return NextResponse.json(
        { error: "dealId is required" },
        { status: 400 }
      );
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Fetch deal inputs
    const { data: dealInputs, error: inputsError } = await supabaseAdmin
      .from("deal_inputs")
      .select(
        "id, input_code, value_text, value_numeric, value_date, value_bool, value_array"
      )
      .eq("deal_id", dealId);

    if (inputsError) {
      return NextResponse.json(
        { error: `Failed to fetch deal inputs: ${inputsError.message}` },
        { status: 500 }
      );
    }

    // Fetch pricing engine input configuration
    const { data: pricingFields, error: fieldsError } = await supabaseAdmin
      .from("pricing_engine_inputs")
      .select("id, input_code, display_name, data_type, is_required, options")
      .eq("organization_id", orgUuid)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (fieldsError) {
      return NextResponse.json(
        { error: `Failed to fetch pricing fields: ${fieldsError.message}` },
        { status: 500 }
      );
    }

    // Map deal inputs to pricing fields
    const dealInputMap = new Map(
      (dealInputs ?? []).map((di) => [di.input_code, di])
    );

    const mappedFields: Array<{
      input_code: string;
      display_name: string;
      value: unknown;
      source: "deal_input" | "missing";
      is_required: boolean;
    }> = [];

    const missingRequired: Array<{
      input_code: string;
      display_name: string;
      data_type: string;
      options?: unknown;
    }> = [];

    for (const field of pricingFields ?? []) {
      const dealInput = dealInputMap.get(field.input_code);

      if (dealInput) {
        // Extract the appropriate value based on data type
        const value =
          dealInput.value_text ??
          dealInput.value_numeric ??
          dealInput.value_date ??
          dealInput.value_bool ??
          dealInput.value_array;

        mappedFields.push({
          input_code: field.input_code,
          display_name: field.display_name,
          value,
          source: "deal_input",
          is_required: field.is_required ?? false,
        });
      } else if (field.is_required) {
        missingRequired.push({
          input_code: field.input_code,
          display_name: field.display_name,
          data_type: field.data_type,
          options: field.options,
        });

        mappedFields.push({
          input_code: field.input_code,
          display_name: field.display_name,
          value: null,
          source: "missing",
          is_required: true,
        });
      }
    }

    return NextResponse.json({
      dealId,
      dealInputs: dealInputs ?? [],
      pricingFields: pricingFields ?? [],
      mappedFields,
      missingRequired,
      allRequiredFilled: missingRequired.length === 0,
    });
  } catch (e) {
    console.error("[POST /api/chat/deal-pricing]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
