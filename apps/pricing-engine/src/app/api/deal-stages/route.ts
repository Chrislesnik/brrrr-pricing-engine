import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { syncDealStages } from "@/lib/sync-deal-stages";

/**
 * GET /api/deal-stages
 * List all active deal stages ordered by display_order.
 * Auto-syncs deal_stages with the current stepper step_order when they diverge.
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if deal_stages are in sync with the current stepper
    await ensureStagesInSync();

    const { data, error } = await supabaseAdmin
      .from("deal_stages")
      .select("id, uuid, code, name, color, display_order, is_active, created_at, updated_at")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[GET /api/deal-stages]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stages: data ?? [] });
  } catch (err) {
    console.error("[GET /api/deal-stages]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Compares active deal_stages names against the current input_stepper step_order.
 * If they diverge, runs syncDealStages to reconcile.
 */
async function ensureStagesInSync(): Promise<void> {
  try {
    const { data: steppers } = await supabaseAdmin
      .from("input_stepper")
      .select("step_order")
      .order("created_at", { ascending: true })
      .limit(1);

    const stepOrder: string[] | null = steppers?.[0]?.step_order ?? null;
    if (!stepOrder || stepOrder.length === 0) return;

    const { data: activeStages } = await supabaseAdmin
      .from("deal_stages")
      .select("name")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    const currentNames = (activeStages ?? []).map((s) => s.name);

    const inSync =
      currentNames.length === stepOrder.length &&
      currentNames.every((name, i) => name === stepOrder[i]);

    if (!inSync) {
      await syncDealStages(stepOrder);
    }
  } catch (err) {
    console.error("[ensureStagesInSync] Error:", err);
  }
}
