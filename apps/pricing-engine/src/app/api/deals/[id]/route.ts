import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type DealInputRow = {
  deal_id: string;
  input_id: string;
  input_type: string;
  value_text: string | null;
  value_numeric: number | null;
  value_date: string | null;
  value_bool: boolean | null;
  value_array: unknown | null;
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function readDealInputValue(row: DealInputRow): unknown {
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
      return (
        row.value_text ??
        row.value_numeric ??
        row.value_date ??
        row.value_bool ??
        row.value_array ??
        null
      );
  }
}

function buildTypedValueColumns(
  inputType: string,
  value: unknown
): {
  value_text: string | null;
  value_numeric: number | null;
  value_date: string | null;
  value_bool: boolean | null;
  value_array: unknown | null;
} {
  const cols = {
    value_text: null as string | null,
    value_numeric: null as number | null,
    value_date: null as string | null,
    value_bool: null as boolean | null,
    value_array: null as unknown | null,
  };

  if (value === null || value === undefined || value === "") return cols;

  switch (inputType) {
    case "text":
    case "dropdown": {
      const str = typeof value === "string" ? value.trim() : String(value);
      cols.value_text = str.length > 0 ? str : null;
      break;
    }
    case "currency":
    case "number":
    case "percentage": {
      const num = typeof value === "number" ? value : Number(value);
      cols.value_numeric = isNaN(num) ? null : num;
      break;
    }
    case "date": {
      const str = typeof value === "string" ? value.trim() : String(value);
      cols.value_date = str.length > 0 ? str : null;
      break;
    }
    case "boolean": {
      if (typeof value === "boolean") {
        cols.value_bool = value;
      } else if (typeof value === "string") {
        cols.value_bool = value === "true";
      } else {
        cols.value_bool = Boolean(value);
      }
      break;
    }
    default: {
      const str = typeof value === "string" ? value.trim() : String(value);
      cols.value_text = str.length > 0 ? str : null;
      break;
    }
  }

  return cols;
}

/** Check access for the current user to a given deal */
async function checkDealAccess(
  deal: { organization_id: string; assigned_to_user_id: unknown; primary_user_id: string | null },
  userId: string,
  orgId: string | null | undefined
): Promise<boolean> {
  const userOrgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null;
  const hasOrgAccess = userOrgUuid && deal.organization_id === userOrgUuid;

  const assignedUsers = Array.isArray(deal.assigned_to_user_id)
    ? deal.assigned_to_user_id
    : [];
  const isAssigned = assignedUsers.includes(userId);
  const isPrimaryUser = deal.primary_user_id === userId;

  let isInternal = false;
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id, is_internal_yn")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (userRow) {
    isInternal = Boolean(userRow.is_internal_yn);
  }

  return Boolean(hasOrgAccess || isAssigned || isPrimaryUser || isInternal);
}

/* -------------------------------------------------------------------------- */
/*  GET /api/deals/[id]                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Fetch the deal row
    const { data: deal, error } = await supabaseAdmin
      .from("deals")
      .select("id, organization_id, assigned_to_user_id, primary_user_id, created_at, updated_at")
      .eq("id", dealId)
      .single();

    if (error || !deal) {
      console.error("Error fetching deal:", error?.message);
      return NextResponse.json(
        { error: error?.message || "Deal not found" },
        { status: error ? 500 : 404 }
      );
    }

    // Check access
    const hasAccess = await checkDealAccess(deal, userId, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch deal_inputs for this deal
    const { data: diRows, error: diErr } = await supabaseAdmin
      .from("deal_inputs")
      .select("deal_id, input_id, input_type, value_text, value_numeric, value_date, value_bool, value_array")
      .eq("deal_id", dealId);

    const inputs: Record<string, unknown> = {};
    if (!diErr && diRows) {
      for (const row of diRows as DealInputRow[]) {
        inputs[row.input_id] = readDealInputValue(row);
      }
    }

    return NextResponse.json({
      deal: {
        id: deal.id,
        organization_id: deal.organization_id,
        created_at: deal.created_at,
        updated_at: deal.updated_at,
        inputs,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/deals/[id]                                                      */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Fetch deal to check access
    const { data: existingDeal, error: fetchError } = await supabaseAdmin
      .from("deals")
      .select("organization_id, assigned_to_user_id, primary_user_id")
      .eq("id", dealId)
      .single();

    if (fetchError || !existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const hasAccess = await checkDealAccess(existingDeal, userId, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse the body: { [input_id]: value, ... }
    const body = (await request.json()) as Record<string, unknown>;
    const entries = Object.entries(body);

    if (entries.length === 0) {
      return NextResponse.json({ ok: true });
    }

    // Fetch input metadata to know the type for each input_id
    const inputIds = entries.map(([key]) => key);
    const { data: inputMeta } = await supabaseAdmin
      .from("inputs")
      .select("id, input_type")
      .in("id", inputIds);

    const typeMap: Record<string, string> = {};
    if (inputMeta) {
      for (const row of inputMeta) {
        typeMap[row.id] = row.input_type;
      }
    }

    // Fetch existing deal_inputs for this deal to decide insert vs update
    const { data: existingInputs } = await supabaseAdmin
      .from("deal_inputs")
      .select("input_id")
      .eq("deal_id", dealId)
      .in("input_id", inputIds);

    const existingSet = new Set(
      (existingInputs ?? []).map((r) => r.input_id)
    );

    const toUpdate: Array<{
      input_id: string;
      input_type: string;
      value_text: string | null;
      value_numeric: number | null;
      value_date: string | null;
      value_bool: boolean | null;
      value_array: unknown | null;
    }> = [];
    const toInsert: Array<{
      deal_id: string;
      input_id: string;
      input_type: string;
      value_text: string | null;
      value_numeric: number | null;
      value_date: string | null;
      value_bool: boolean | null;
      value_array: unknown | null;
    }> = [];

    for (const [inputId, value] of entries) {
      const inputType = typeMap[inputId] || "text";
      const valueCols = buildTypedValueColumns(inputType, value);

      if (existingSet.has(inputId)) {
        toUpdate.push({ input_id: inputId, input_type: inputType, ...valueCols });
      } else {
        toInsert.push({
          deal_id: dealId,
          input_id: inputId,
          input_type: inputType,
          ...valueCols,
        });
      }
    }

    // Batch update existing rows
    const updatePromises = toUpdate.map((row) =>
      supabaseAdmin
        .from("deal_inputs")
        .update({
          input_type: row.input_type,
          value_text: row.value_text,
          value_numeric: row.value_numeric,
          value_date: row.value_date,
          value_bool: row.value_bool,
          value_array: row.value_array,
        })
        .eq("deal_id", dealId)
        .eq("input_id", row.input_id)
    );

    // Batch insert new rows
    const insertPromise =
      toInsert.length > 0
        ? supabaseAdmin.from("deal_inputs").insert(toInsert)
        : Promise.resolve({ error: null });

    const results = await Promise.all([...updatePromises, insertPromise]);
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error("[PATCH /api/deals] Errors:", errors.map((e) => e.error));
    }

    // Update the deals.updated_at timestamp
    await supabaseAdmin
      .from("deals")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", dealId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
