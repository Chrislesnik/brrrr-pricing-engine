import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/task-templates/[id]/roles
 * Return the deal_role_type_ids assigned to a task template.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const templateId = Number(id);
    if (isNaN(templateId)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("task_template_roles")
      .select("deal_role_type_id")
      .eq("task_template_id", templateId);

    if (error) {
      console.error("[GET /api/task-templates/[id]/roles]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const roleIds = (data ?? []).map((r) => r.deal_role_type_id);
    return NextResponse.json({ role_ids: roleIds });
  } catch (err) {
    console.error("[GET /api/task-templates/[id]/roles]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
