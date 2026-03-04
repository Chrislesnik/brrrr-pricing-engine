"use client";

import { addDays, format, isSameDay, startOfDay } from "date-fns";
import type { CalendarEvent } from "./";
import { AgendaDaysToShow, getAgendaEventsForDay, sortEvents } from "./";

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
}

export function AgendaView({ currentDate, events, onEventSelect }: AgendaViewProps) {
  const days = Array.from({ length: AgendaDaysToShow }, (_, i) =>
    addDays(startOfDay(currentDate), i)
  );

  return (
    <div className="flex flex-col divide-y overflow-y-auto p-4">
      {days.map((day) => {
        const dayEvents = sortEvents(getAgendaEventsForDay(events, day));
        if (dayEvents.length === 0) return null;

        return (
          <div key={day.toISOString()} className="flex gap-4 py-4">
            <div className="w-24 shrink-0">
              <div className="text-sm font-medium">
                {format(day, "EEE")}
              </div>
              <div className="text-2xl font-bold">
                {format(day, "d")}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(day, "MMM yyyy")}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {dayEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventSelect(event)}
                  className="w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.allDay
                      ? "All day"
                      : format(new Date(event.start), "h:mm a")}
                  </div>
                  
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
