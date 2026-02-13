import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/* -------------------------------------------------------------------------- */
/*  GET /api/input-stepper                                                     */
/*  Returns the current stepper input(s)                                       */
/* -------------------------------------------------------------------------- */

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("input_stepper")
      .select("id, input_id, step_order, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GET /api/input-stepper]", error);
      return NextResponse.json(
        { error: "Failed to fetch stepper" },
        { status: 500 }
      );
    }

    return NextResponse.json({ steppers: data ?? [] });
  } catch (err) {
    console.error("[GET /api/input-stepper]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/input-stepper                                                    */
/*  Set the stepper input — replaces any existing stepper                      */
/*  Body: { input_id: string }                                                 */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { input_id, step_order } = body;

    if (!input_id) {
      return NextResponse.json(
        { error: "input_id is required" },
        { status: 400 }
      );
    }

    // Delete any existing stepper entries and insert the new one
    const { error: deleteError } = await supabaseAdmin
      .from("input_stepper")
      .delete()
      .neq("id", 0); // delete all rows

    if (deleteError) {
      console.error("[POST /api/input-stepper] delete error:", deleteError);
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("input_stepper")
      .insert({
        input_id,
        step_order: step_order ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[POST /api/input-stepper] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save stepper" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stepper: data });
  } catch (err) {
    console.error("[POST /api/input-stepper]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/input-stepper                                                  */
/*  Remove the stepper attachment                                              */
/* -------------------------------------------------------------------------- */

export async function DELETE(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("input_stepper")
      .delete()
      .neq("id", 0); // delete all rows

    if (error) {
      console.error("[DELETE /api/input-stepper]", error);
      return NextResponse.json(
        { error: "Failed to remove stepper" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/input-stepper]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
