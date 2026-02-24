import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrgUuidFromClerkId } from "@/lib/orgs";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface CalendarEventRow {
  id: number;
  deal_id: string;
  event_title: string | null;
  event_description: string | null;
  event_date: string; // "YYYY-MM-DD"
  event_time: string | null; // "HH:MM:SS+TZ" or null
  all_day: boolean | null;
  deal_input_id: number | null;
  etiquette: string | null;
  created_at: string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function checkDealAccess(
  dealId: string,
  userId: string,
  orgId: string | null | undefined
): Promise<{ hasAccess: boolean; deal: { organization_id: string } | null }> {
  const [{ data: deal }, { data: userRow }, userOrgUuid] = await Promise.all([
    supabaseAdmin
      .from("deals")
      .select("organization_id, assigned_to_user_id, primary_user_id")
      .eq("id", dealId)
      .single(),
    supabaseAdmin
      .from("users")
      .select("id, is_internal_yn")
      .eq("clerk_user_id", userId)
      .maybeSingle(),
    orgId ? getOrgUuidFromClerkId(orgId) : Promise.resolve(null),
  ]);

  if (!deal) return { hasAccess: false, deal: null };

  const hasOrgAccess = userOrgUuid && deal.organization_id === userOrgUuid;
  const assignedUsers = Array.isArray(deal.assigned_to_user_id)
    ? deal.assigned_to_user_id
    : [];
  const isAssigned = assignedUsers.includes(userId);
  const isPrimaryUser = deal.primary_user_id === userId;
  const isInternal = Boolean(userRow?.is_internal_yn);

  return {
    hasAccess: Boolean(hasOrgAccess || isAssigned || isPrimaryUser || isInternal),
    deal: { organization_id: deal.organization_id },
  };
}

/* -------------------------------------------------------------------------- */
/*  GET /api/deals/[id]/calendar-events                                        */
/*  Fetches all calendar events for a deal. Auto-upserts events from          */
/*  date-type deal_inputs that don't already have a calendar event row.        */
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

    const { hasAccess } = await checkDealAccess(dealId, userId, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch date inputs (with labels) and existing calendar events in parallel
    const [{ data: dateInputs }, { data: existingEvents, error: fetchErr }] =
      await Promise.all([
        supabaseAdmin
          .from("deal_inputs")
          .select("input_id, value_date, input_type, inputs:input_id(id, input_label)")
          .eq("deal_id", dealId)
          .eq("input_type", "date")
          .not("value_date", "is", null),
        supabaseAdmin
          .from("deal_calendar_events")
          .select("*")
          .eq("deal_id", dealId)
          .order("event_date", { ascending: true }),
      ]);

    if (fetchErr) {
      console.error("Error fetching calendar events:", fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const inputLabels: Record<string, string> = {};
    for (const r of dateInputs ?? []) {
      const inp = r.inputs as any;
      if (inp?.input_label) inputLabels[r.input_id] = inp.input_label;
    }

    const events = (existingEvents ?? []) as CalendarEventRow[];

    // 4. Auto-upsert calendar events for date-type deal_inputs
    const existingInputIds = new Set(
      events.filter((e) => e.deal_input_id).map((e) => e.deal_input_id)
    );

    const toInsert: Array<{
      deal_id: string;
      event_title: string;
      event_date: string;
      event_time: null;
      all_day: boolean;
      deal_input_id: number;
      etiquette: string;
    }> = [];

    for (const di of dateInputs ?? []) {
      if (!existingInputIds.has(di.input_id) && di.value_date) {
        toInsert.push({
          deal_id: dealId,
          event_title: inputLabels[di.input_id] || "Date Event",
          event_date: di.value_date,
          event_time: null,
          all_day: true,
          deal_input_id: di.input_id,
          etiquette: "sky",
        });
      }
    }

    if (toInsert.length > 0) {
      const { data: newRows, error: insertErr } = await supabaseAdmin
        .from("deal_calendar_events")
        .insert(toInsert)
        .select("*");

      if (insertErr) {
        console.error("Error auto-creating calendar events:", insertErr.message);
      } else if (newRows) {
        events.push(...(newRows as CalendarEventRow[]));
      }
    }

    // 5. For deal-input-linked events, override the date from deal_inputs (source of truth)
    const dateInputMap = new Map(
      (dateInputs ?? []).map((r) => [r.input_id, r.value_date])
    );

    const result = events.map((e) => {
      const eventDate =
        e.deal_input_id && dateInputMap.has(e.deal_input_id)
          ? dateInputMap.get(e.deal_input_id)!
          : e.event_date;

      const eventTitle =
        e.deal_input_id && inputLabels[e.deal_input_id]
          ? inputLabels[e.deal_input_id]
          : e.event_title;

      return {
        id: e.id,
        deal_id: e.deal_id,
        event_title: eventTitle,
        event_description: e.event_description,
        event_date: eventDate,
        event_time: e.event_time,
        all_day: e.all_day ?? true,
        deal_input_id: e.deal_input_id != null ? String(e.deal_input_id) : null,
        etiquette: e.etiquette,
        created_at: e.created_at,
      };
    });

    return NextResponse.json({ events: result });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/deals/[id]/calendar-events                                       */
/*  Create a new manual calendar event (no deal_input_id).                     */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    const { hasAccess } = await checkDealAccess(dealId, userId, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { event_title, event_description, event_date, event_time, all_day, etiquette } = body;

    if (!event_date) {
      return NextResponse.json({ error: "event_date is required" }, { status: 400 });
    }

    const { data: newEvent, error: insertErr } = await supabaseAdmin
      .from("deal_calendar_events")
      .insert({
        deal_id: dealId,
        event_title: event_title || "(no title)",
        event_description: event_description || null,
        event_date,
        event_time: all_day ? null : (event_time || null),
        all_day: all_day ?? true,
        deal_input_id: null,
        etiquette: etiquette || "sky",
      })
      .select("*")
      .single();

    if (insertErr) {
      console.error("Error creating calendar event:", insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ event: newEvent }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  PUT /api/deals/[id]/calendar-events                                        */
/*  Update an existing calendar event.                                         */
/*  If deal_input_id is set, only event_time, all_day, description,           */
/*  and etiquette can be updated (date/title are read-only).                  */
/* -------------------------------------------------------------------------- */

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    const { hasAccess } = await checkDealAccess(dealId, userId, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { event_id, event_title, event_description, event_date, event_time, all_day, etiquette } = body;

    if (!event_id) {
      return NextResponse.json({ error: "event_id is required" }, { status: 400 });
    }

    // Fetch the existing event to check if it's linked
    const { data: existing } = await supabaseAdmin
      .from("deal_calendar_events")
      .select("deal_input_id")
      .eq("id", event_id)
      .eq("deal_id", dealId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isLinked = !!existing.deal_input_id;

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      event_description: event_description ?? null,
      event_time: all_day ? null : (event_time ?? null),
      all_day: all_day ?? true,
      etiquette: etiquette ?? "sky",
    };

    // Only allow date/title changes on manual events
    if (!isLinked) {
      if (event_title !== undefined) updatePayload.event_title = event_title;
      if (event_date !== undefined) updatePayload.event_date = event_date;
    }

    const { data: updatedEvent, error: updateErr } = await supabaseAdmin
      .from("deal_calendar_events")
      .update(updatePayload)
      .eq("id", event_id)
      .eq("deal_id", dealId)
      .select("*")
      .single();

    if (updateErr) {
      console.error("Error updating calendar event:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/deals/[id]/calendar-events                                     */
/*  Delete a manual calendar event. Linked events cannot be deleted.           */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    const { hasAccess } = await checkDealAccess(dealId, userId, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("event_id");

    if (!eventId) {
      return NextResponse.json({ error: "event_id query param is required" }, { status: 400 });
    }

    // Check if event is linked to a deal input
    const { data: existing } = await supabaseAdmin
      .from("deal_calendar_events")
      .select("deal_input_id")
      .eq("id", eventId)
      .eq("deal_id", dealId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existing.deal_input_id) {
      return NextResponse.json(
        { error: "Cannot delete a system-managed event linked to a deal input" },
        { status: 403 }
      );
    }

    const { error: deleteErr } = await supabaseAdmin
      .from("deal_calendar_events")
      .delete()
      .eq("id", eventId)
      .eq("deal_id", dealId);

    if (deleteErr) {
      console.error("Error deleting calendar event:", deleteErr.message);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
