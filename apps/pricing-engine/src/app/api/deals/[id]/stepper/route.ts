import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { notifyDealStatusChange } from "@/lib/notifications";

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

    // Sync current_step from the deal's actual input value
    try {
      // Get the input_id attached to the stepper config
      const { data: stepperConfig } = await supabaseAdmin
        .from("input_stepper")
        .select("input_id")
        .eq("id", data.input_stepper_id)
        .single();

      if (stepperConfig) {
        // Get the deal's actual value for this input
        const { data: dealInput } = await supabaseAdmin
          .from("deal_inputs")
          .select("value_text")
          .eq("deal_id", dealId)
          .eq("input_id", stepperConfig.input_id)
          .maybeSingle();

        const actualValue = dealInput?.value_text;

        // If the deal input has a value and it differs from current_step, sync it
        if (actualValue && actualValue !== data.current_step && data.step_order.includes(actualValue)) {
          const prevStep = data.current_step;

          await supabaseAdmin
            .from("deal_stepper")
            .update({ current_step: actualValue })
            .eq("id", data.id);

          await supabaseAdmin.from("deal_stepper_history").insert({
            deal_id: dealId,
            deal_stepper_id: data.id,
            previous_step: prevStep,
            new_step: actualValue,
            changed_by: null,
            change_source: "sync",
          });

          data.current_step = actualValue;
        }
      }
    } catch {
      // Sync is non-critical — return the existing data
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

    // Capture previous step before updating
    const { data: prevStepper } = await supabaseAdmin
      .from("deal_stepper")
      .select("current_step")
      .eq("deal_id", dealId)
      .maybeSingle();
    const previousStage = prevStepper?.current_step as string | undefined;

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

    // Log step change to history
    if (previousStage !== current_step) {
      await supabaseAdmin.from("deal_stepper_history").insert({
        deal_id: dealId,
        deal_stepper_id: data.id,
        previous_step: previousStage ?? null,
        new_step: current_step,
        changed_by: userId,
        change_source: "manual",
      });
    }

    // Notify assigned users about the stage change
    if (previousStage !== current_step) {
      try {
        const { data: deal } = await supabaseAdmin
          .from("deals")
          .select("deal_name, assigned_to_user_id")
          .eq("id", dealId)
          .maybeSingle();
        const dealName = deal?.deal_name || "a deal";
        const assignedUsers = Array.isArray(deal?.assigned_to_user_id)
          ? (deal.assigned_to_user_id as string[])
          : [];
        const usersToNotify = assignedUsers.filter((uid) => uid !== userId);
        if (usersToNotify.length > 0) {
          await Promise.allSettled(
            usersToNotify.map((uid) =>
              notifyDealStatusChange(uid, {
                dealId,
                dealName,
                newStage: current_step,
                previousStage,
              })
            )
          );
        }
      } catch {
        // Notification is non-critical
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
