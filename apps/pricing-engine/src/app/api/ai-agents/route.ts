import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

/* -------------------------------------------------------------------------- */
/*  GET /api/ai-agents -- List all agents for the org                          */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("ai_agents")
      .select("*")
      .eq("organization_id", orgUuid)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agents: data ?? [] });
  } catch (err) {
    console.error("[GET /api/ai-agents]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/ai-agents -- Create a new agent                                  */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, description, agent_type, model, system_prompt, tools, config, graph_data } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!agent_type) {
      return NextResponse.json({ error: "agent_type is required" }, { status: 400 });
    }

    const validTypes = ["extraction", "validation", "cross_reference", "decision"];
    if (!validTypes.includes(agent_type)) {
      return NextResponse.json(
        { error: `agent_type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("ai_agents")
      .insert({
        organization_id: orgUuid,
        name: name.trim(),
        description: description?.trim() || null,
        agent_type,
        model: model || "gpt-4.1-mini",
        system_prompt: system_prompt || null,
        tools: tools ?? [],
        config: config ?? {},
        graph_data: graph_data ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agent: data });
  } catch (err) {
    console.error("[POST /api/ai-agents]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/ai-agents -- Update an agent                                    */
/* -------------------------------------------------------------------------- */

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const allowed: Record<string, unknown> = {};
    if (fields.name !== undefined) allowed.name = fields.name;
    if (fields.description !== undefined) allowed.description = fields.description;
    if (fields.agent_type !== undefined) allowed.agent_type = fields.agent_type;
    if (fields.model !== undefined) allowed.model = fields.model;
    if (fields.system_prompt !== undefined) allowed.system_prompt = fields.system_prompt;
    if (fields.tools !== undefined) allowed.tools = fields.tools;
    if (fields.config !== undefined) allowed.config = fields.config;
    if (fields.graph_data !== undefined) allowed.graph_data = fields.graph_data;
    if (fields.is_active !== undefined) allowed.is_active = fields.is_active;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    allowed.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("ai_agents")
      .update(allowed)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agent: data });
  } catch (err) {
    console.error("[PATCH /api/ai-agents]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/ai-agents -- Archive an agent                                  */
/* -------------------------------------------------------------------------- */

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("ai_agents")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/ai-agents]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
