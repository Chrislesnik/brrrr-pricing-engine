"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import type { CalendarEvent } from "./";
import { EndHour, StartHour, getEventsForDay, WeekCellsHeight } from "./";
import { useCurrentTimeIndicator } from "../hooks/use-current-time-indicator";
import { DroppableCell } from "./droppable-cell";
import { EventItem } from "./event-item";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
}

export function DayView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: DayViewProps) {
  const hours = Array.from(
    { length: EndHour - StartHour },
    (_, i) => StartHour + i
  );
  const dayEvents = getEventsForDay(events, currentDate);
  const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
    currentDate,
    "day"
  );

  // Auto-scroll to current hour (or 8 AM) on mount
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const scrollToHour = Math.max(now.getHours() - 1, 7);
      scrollRef.current.scrollTop = scrollToHour * WeekCellsHeight;
    }
  }, [currentDate]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b bg-background px-4 py-2">
        <div className="text-center">
          <div className="text-sm font-medium text-muted-foreground">
            {format(currentDate, "EEEE")}
          </div>
          <div className="text-2xl font-bold">
            {format(currentDate, "d")}
          </div>
        </div>
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div 
          className="relative flex"
          style={{ height: hours.length * WeekCellsHeight }}
        >
          {/* Time labels column */}
          <div className="sticky left-0 z-10 w-16 shrink-0 bg-background">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b pr-2 text-right"
                style={{ height: WeekCellsHeight }}
              >
                <span className="absolute -top-2.5 right-2 text-xs text-muted-foreground">
                  {format(new Date().setHours(hour, 0), "h a")}
                </span>
              </div>
            ))}
          </div>

          {/* Day column with events */}
          <div className="relative flex-1 border-l">
            {/* Hour cells */}
            {hours.map((hour) => {
              const cellTime = new Date(currentDate);
              cellTime.setHours(hour, 0, 0, 0);
              return (
                <DroppableCell
                  key={hour}
                  id={`day-${hour}`}
                  date={cellTime}
                  className="border-b"
                  style={{ height: WeekCellsHeight }}
                  onClick={() => onEventCreate(cellTime)}
                />
              );
            })}

            {/* Events overlay */}
            {dayEvents.map((event) => {
              const startHour = new Date(event.start).getHours();
              const startMinute = new Date(event.start).getMinutes();
              const endHour = new Date(event.end).getHours();
              const endMinute = new Date(event.end).getMinutes();
              const top = (startHour - StartHour + startMinute / 60) * WeekCellsHeight;
              const height =
                (endHour - startHour + (endMinute - startMinute) / 60) *
                WeekCellsHeight;

              return (
                <div
                  key={event.id}
                  className="absolute left-1 right-1 z-10"
                  style={{ top, height: Math.max(height, 24) }}
                >
                  <EventItem
                    event={event}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventSelect(event);
                    }}
                    view="day"
                  />
                </div>
              );
            })}

            {/* Current time indicator */}
            {currentTimeVisible && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-20"
                style={{ top: `${currentTimePosition}%` }}
              >
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-0.5 flex-1 bg-red-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
