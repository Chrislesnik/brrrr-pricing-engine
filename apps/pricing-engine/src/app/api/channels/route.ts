import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrgUuidFromClerkId, getUserRoleInOrg } from "@/lib/orgs";

function readDealInputValue(row: {
  input_type: string | null;
  value_text: string | null;
  value_numeric: number | null;
  value_date: string | null;
  value_bool: boolean | null;
}): unknown {
  switch (row.input_type) {
    case "text":
    case "dropdown":
      return row.value_text;
    case "currency":
    case "number":
    case "percentage":
      return row.value_numeric;
    case "date":
      return row.value_date;
    case "boolean":
      return row.value_bool;
    default:
      return row.value_text ?? row.value_numeric ?? row.value_date ?? row.value_bool ?? null;
  }
}

function resolveExpression(
  expr: string,
  codeToId: Map<string, string>,
  inputs: Record<string, unknown>,
): string {
  return expr
    .replace(/@(\w+)/g, (_, code: string) => {
      const inputId = codeToId.get(code);
      if (!inputId) return "";
      const val = inputs[inputId];
      return val !== null && val !== undefined ? String(val) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgUuid = await getOrgUuidFromClerkId(orgId);
  if (!orgUuid) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const role = await getUserRoleInOrg(orgUuid, userId);
  const normRole = (role ?? "").toLowerCase().replace(/^org:/, "");
  const isAdminOrOwner = normRole === "admin" || normRole === "owner";

  let dealQuery = supabaseAdmin
    .from("deals")
    .select("id, organization_id, created_at, updated_at, assigned_to_user_id, primary_user_id")
    .eq("organization_id", orgUuid)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (!isAdminOrOwner) {
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (!userData) {
      return NextResponse.json({ channels: [] });
    }

    const { data: roleRows } = await supabaseAdmin
      .from("deal_roles")
      .select("deal_id")
      .eq("users_id", userData.id);

    const dealIds = (roleRows ?? []).map((r) => r.deal_id).filter(Boolean);
    if (dealIds.length === 0) {
      return NextResponse.json({ channels: [] });
    }

    dealQuery = dealQuery.in("id", dealIds);
  }

  const { data: deals, error: dealsError } = await dealQuery;

  if (dealsError) {
    console.error("[channels] failed to fetch deals:", dealsError);
    return NextResponse.json(
      { error: "Failed to fetch channels", details: dealsError.message },
      { status: 500 }
    );
  }

  const dealRows = deals ?? [];
  const dealIds = dealRows.map((d) => d.id as string);

  if (dealIds.length === 0) {
    return NextResponse.json({ channels: [] });
  }

  const [settingsRes, inputDefsRes, diRes, rolesRes] = await Promise.all([
    supabaseAdmin
      .from("app_settings")
      .select("key, value")
      .in("key", ["deal_heading_expression"]),
    supabaseAdmin
      .from("inputs")
      .select("id, input_code")
      .is("archived_at", null),
    supabaseAdmin
      .from("deal_inputs")
      .select("deal_id, input_id, input_type, value_text, value_numeric, value_date, value_bool")
      .in("deal_id", dealIds),
    supabaseAdmin
      .from("deal_roles")
      .select("deal_id, users_id, users ( clerk_user_id, full_name )")
      .in("deal_id", dealIds),
  ]);

  if (settingsRes.error) {
    console.error("[channels] app_settings query failed:", settingsRes.error);
  }
  if (inputDefsRes.error) {
    console.error("[channels] inputs query failed:", inputDefsRes.error);
  }
  if (diRes.error) {
    console.error("[channels] deal_inputs query failed:", diRes.error);
  }

  const settings: Record<string, string> = {};
  for (const row of settingsRes.data ?? []) {
    settings[row.key as string] = row.value as string;
  }
  const headingExpr = settings.deal_heading_expression || "";

  const codeToId = new Map<string, string>();
  for (const inp of inputDefsRes.data ?? []) {
    codeToId.set(inp.input_code as string, String(inp.id));
  }

  const inputsByDeal: Record<string, Record<string, unknown>> = {};
  for (const row of diRes.data ?? []) {
    const did = row.deal_id as string;
    const iid = String(row.input_id);
    if (!inputsByDeal[did]) inputsByDeal[did] = {};
    inputsByDeal[did]![iid] = readDealInputValue(row as {
      input_type: string | null;
      value_text: string | null;
      value_numeric: number | null;
      value_date: string | null;
      value_bool: boolean | null;
    });
  }

  type RoleUser = { clerk_user_id: string; full_name: string | null };
  type RoleRow = { deal_id: string; users_id: number | null; users: RoleUser | RoleUser[] | null };
  const rolesByDeal: Record<string, { id: string; name: string | null }[]> = {};
  for (const row of (rolesRes.data ?? []) as RoleRow[]) {
    const did = row.deal_id;
    if (!rolesByDeal[did]) rolesByDeal[did] = [];
    if (row.users) {
      const u = Array.isArray(row.users) ? row.users[0] : row.users;
      if (u) {
        const existing = rolesByDeal[did]!;
        if (!existing.some((e) => e.id === u.clerk_user_id)) {
          existing.push({ id: u.clerk_user_id, name: u.full_name });
        }
      }
    }
  }

  const channels = dealRows.map((deal) => {
    const did = deal.id as string;
    const inputs = inputsByDeal[did] ?? {};
    let heading = headingExpr
      ? resolveExpression(headingExpr, codeToId, inputs)
      : "";

    // Strip orphaned separators left behind when fields are empty
    heading = heading
      .replace(/^[,\s]+/, "")
      .replace(/[,\s]+$/, "")
      .replace(/,\s*,/g, ",")
      .trim();

    return {
      id: did,
      roomId: `deal:${did}`,
      name: heading || `Deal ${did.slice(0, 8)}`,
      updatedAt: deal.updated_at,
      createdAt: deal.created_at,
      assignees: rolesByDeal[did] ?? [],
    };
  });

  return NextResponse.json({ channels });
}
