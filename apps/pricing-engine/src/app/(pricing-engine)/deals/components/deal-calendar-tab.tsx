"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import {
  EventCalendar,
  type CalendarEvent,
} from "@/components/event-calendar";
import { useLogicEngine } from "@/hooks/use-logic-engine";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DealCalendarTabProps {
  dealId: string;
  dealInputs: Record<string, unknown>;
}

/** Shape of rows returned by GET /api/deals/[id]/calendar-events */
interface CalendarEventRow {
  id: number;
  deal_id: string;
  event_title: string | null;
  event_description: string | null;
  event_date: string; // "YYYY-MM-DD"
  event_time: string | null;
  all_day: boolean;
  deal_input_id: string | null;
  etiquette: string | null;
  created_at: string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Transform a DB row into a CalendarEvent for the calendar component.
 * Computes `start`/`end` from event_date + event_time.
 */
function rowToCalendarEvent(row: CalendarEventRow): CalendarEvent {
  // Parse the date (YYYY-MM-DD)
  const [year = 2026, month = 1, day = 1] = row.event_date
    .split("-")
    .map(Number);

  const start = new Date(year, month - 1, day);

  if (!row.all_day && row.event_time) {
    // event_time is "HH:MM:SS" (time without time zone)
    const timeParts = row.event_time.split(":");
    const hours = parseInt(timeParts[0] ?? "0", 10);
    const minutes = parseInt(timeParts[1] ?? "0", 10);
    start.setHours(hours, minutes, 0, 0);
  } else {
    start.setHours(0, 0, 0, 0);
  }

  // Compute end
  const end = new Date(start);
  if (row.all_day) {
    end.setHours(23, 59, 59, 999);
  } else {
    end.setHours(end.getHours() + 1);
  }

  return {
    id: String(row.id),
    title: row.event_title || "(no title)",
    description: row.event_description || undefined,
    start,
    end,
    allDay: row.all_day,
    color: (row.etiquette as CalendarEvent["color"]) || "sky",
    dealInputId: row.deal_input_id || undefined,
  };
}

/**
 * Extract event_date ("YYYY-MM-DD") and event_time ("HH:MM") from a
 * CalendarEvent's `start` field.
 */
function calendarEventToRow(event: CalendarEvent) {
  const d = new Date(event.start);
  const eventDate = format(d, "yyyy-MM-dd");
  let eventTime: string | null = null;

  if (!event.allDay) {
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    eventTime = `${hours}:${minutes}:00`;
  }

  return { eventDate, eventTime };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function DealCalendarTab({ dealId, dealInputs }: DealCalendarTabProps) {
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Conditional visibility: filter out events linked to hidden inputs
  const { hiddenFields } = useLogicEngine(dealInputs);

  /* ---- Fetch events ---------------------------------------------------- */

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${dealId}/calendar-events`);
      if (!res.ok) throw new Error("Failed to fetch calendar events");
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ---- Transform + filter for calendar component ----------------------- */

  const calendarEvents = useMemo(() => {
    return events
      .filter((e) => {
        // Hide events linked to conditionally-hidden inputs
        if (e.deal_input_id && hiddenFields.has(e.deal_input_id)) {
          return false;
        }
        return true;
      })
      .map(rowToCalendarEvent);
  }, [events, hiddenFields]);

  /* ---- Event handlers -------------------------------------------------- */

  const handleEventAdd = useCallback(
    async (event: CalendarEvent) => {
      try {
        const { eventDate, eventTime } = calendarEventToRow(event);

        const res = await fetch(`/api/deals/${dealId}/calendar-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_title: event.title,
            event_description: event.description || null,
            event_date: eventDate,
            event_time: eventTime,
            all_day: event.allDay ?? true,
            etiquette: event.color || "sky",
          }),
        });

        if (!res.ok) throw new Error("Failed to create event");

        await fetchEvents();
      } catch (err) {
        console.error("Error creating event:", err);
      }
    },
    [dealId, fetchEvents]
  );

  const handleEventUpdate = useCallback(
    async (event: CalendarEvent) => {
      try {
        const { eventDate, eventTime } = calendarEventToRow(event);

        const res = await fetch(`/api/deals/${dealId}/calendar-events`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: Number(event.id),
            event_title: event.title,
            event_description: event.description || null,
            event_date: eventDate,
            event_time: eventTime,
            all_day: event.allDay ?? true,
            etiquette: event.color || "sky",
          }),
        });

        if (!res.ok) throw new Error("Failed to update event");

        await fetchEvents();
      } catch (err) {
        console.error("Error updating event:", err);
      }
    },
    [dealId, fetchEvents]
  );

  const handleEventDelete = useCallback(
    async (eventId: string) => {
      try {
        const res = await fetch(
          `/api/deals/${dealId}/calendar-events?event_id=${eventId}`,
          { method: "DELETE" }
        );

        if (!res.ok) {
          throw new Error("Failed to delete event");
        }

        await fetchEvents();
      } catch (err) {
        console.error("Error deleting event:", err);
      }
    },
    [dealId, fetchEvents]
  );

  /* ---- Render ---------------------------------------------------------- */

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Calendar & Events</h2>
        <p className="text-sm text-muted-foreground">
          Important dates and scheduled events for this deal
        </p>
      </div>

      <EventCalendar
        events={calendarEvents}
        onEventAdd={handleEventAdd}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
      />
    </div>
  );
}
