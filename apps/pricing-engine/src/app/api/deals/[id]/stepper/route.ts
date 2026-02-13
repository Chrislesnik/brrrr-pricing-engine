import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/* -------------------------------------------------------------------------- */
/*  GET /api/deals/[id]/stepper                                                */
/*  Returns the deal's stepper state                                           */
/* -------------------------------------------------------------------------- */

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    const { data, error } = await supabaseAdmin
      .from("deal_stepper")
      .select("id, deal_id, input_stepper_id, current_step, step_order, created_at")
      .eq("deal_id", dealId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/deals/[id]/stepper]", error);
      return NextResponse.json(
        { error: "Failed to fetch stepper" },
        { status: 500 }
      );
    }

    // No stepper configured for this deal
    if (!data) {
      return NextResponse.json({ stepper: null });
    }

    return NextResponse.json({ stepper: data });
  } catch (err) {
    console.error("[GET /api/deals/[id]/stepper]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/deals/[id]/stepper                                              */
/*  Update the current step                                                    */
/*  Body: { current_step: string }                                             */
/* -------------------------------------------------------------------------- */

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;
    const body = await request.json();
    const { current_step } = body;

    if (!current_step || typeof current_step !== "string") {
      return NextResponse.json(
        { error: "current_step is required" },
        { status: 400 }
      );
    }

    // Update the deal_stepper row
    const { data, error } = await supabaseAdmin
      .from("deal_stepper")
      .update({ current_step })
      .eq("deal_id", dealId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/deals/[id]/stepper] update error:", error);
      return NextResponse.json(
        { error: "Failed to update stepper" },
        { status: 500 }
      );
    }

    // Also update the deal's stage input to keep in sync
    // Find the stepper config to get the input_id (the dropdown that drives the stepper)
    const { data: stepperConfig } = await supabaseAdmin
      .from("input_stepper")
      .select("input_id")
      .eq("id", data.input_stepper_id)
      .single();

    if (stepperConfig) {
      // Get the input type to know how to store the value
      const { data: input } = await supabaseAdmin
        .from("inputs")
        .select("id, input_type")
        .eq("id", stepperConfig.input_id)
        .single();

      if (input) {
        // Upsert into deal_inputs to update the deal's stage value
        await supabaseAdmin
          .from("deal_inputs")
          .upsert(
            {
              deal_id: dealId,
              input_id: input.id,
              input_type: input.input_type,
              value_text: current_step,
            },
            { onConflict: "deal_id,input_id" }
          );
      }
    }

    return NextResponse.json({ stepper: data });
  } catch (err) {
    console.error("[PATCH /api/deals/[id]/stepper]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
