import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Syncs the deal_stages table with the given step_order array.
 *
 * Algorithm:
 * 1. Fetch current active deal_stages
 * 2. For each step in step_order:
 *    - If a matching stage exists (by name), update its display_order
 *    - If no match, create a new deal_stage
 * 3. Any active stages NOT in step_order get is_active=false
 * 4. Task templates referencing deactivated stages get deal_stage_id set to NULL
 */
export async function syncDealStages(stepOrder: string[]): Promise<void> {
  if (!stepOrder || stepOrder.length === 0) return;

  try {
    // 1. Fetch all deal_stages (including inactive, for matching)
    const { data: existingStages, error: fetchErr } = await supabaseAdmin
      .from("deal_stages")
      .select("id, code, name, display_order, is_active")
      .order("display_order", { ascending: true });

    if (fetchErr) {
      console.error("[syncDealStages] Failed to fetch stages:", fetchErr);
      return;
    }

    const stages = existingStages ?? [];
    const stagesByName = new Map(stages.map((s) => [s.name, s]));
    const matchedStageIds = new Set<number>();

    // 2. Process each step in the new order
    for (let i = 0; i < stepOrder.length; i++) {
      const stepName = stepOrder[i];
      const existing = stagesByName.get(stepName);

      if (existing) {
        // Stage exists — update display_order and ensure it's active
        matchedStageIds.add(existing.id);
        if (
          existing.display_order !== i ||
          existing.is_active !== true
        ) {
          await supabaseAdmin
            .from("deal_stages")
            .update({ display_order: i, is_active: true })
            .eq("id", existing.id);
        }
      } else {
        // New stage — insert
        const code = stepName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "");

        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from("deal_stages")
          .insert({
            code,
            name: stepName,
            display_order: i,
            is_active: true,
          })
          .select("id")
          .single();

        if (insertErr) {
          // Code conflict — try with suffix
          if (insertErr.code === "23505") {
            const suffixedCode = `${code}_${Date.now()}`;
            const { data: retryInsert } = await supabaseAdmin
              .from("deal_stages")
              .insert({
                code: suffixedCode,
                name: stepName,
                display_order: i,
                is_active: true,
              })
              .select("id")
              .single();
            if (retryInsert) {
              matchedStageIds.add(retryInsert.id);
            }
          } else {
            console.error(
              "[syncDealStages] Failed to insert stage:",
              insertErr
            );
          }
        } else if (inserted) {
          matchedStageIds.add(inserted.id);
        }
      }
    }

    // 3. Deactivate stages not in the new step_order
    const stagesToDeactivate = stages.filter(
      (s) => s.is_active && !matchedStageIds.has(s.id)
    );

    for (const stage of stagesToDeactivate) {
      await supabaseAdmin
        .from("deal_stages")
        .update({ is_active: false })
        .eq("id", stage.id);

      // 4. Unassign task templates from deactivated stages
      await supabaseAdmin
        .from("task_templates")
        .update({ deal_stage_id: null })
        .eq("deal_stage_id", stage.id);
    }
  } catch (err) {
    console.error("[syncDealStages] Unexpected error:", err);
  }
}
