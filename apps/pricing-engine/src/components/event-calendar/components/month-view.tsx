"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarEvent } from "./";
import { EventGap, EventHeight, getAllEventsForDay, sortEvents } from "./";
import { cn } from "@/lib/utils";
import { DroppableCell } from "./droppable-cell";
import { EventItem } from "./event-item";
import { useEventVisibility } from "../hooks/use-event-visibility";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (date: Date) => void;
}

export function MonthView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <MonthDayCell
              key={day.toISOString()}
              day={day}
              currentDate={currentDate}
              events={events}
              onEventSelect={onEventSelect}
              onEventCreate={onEventCreate}
              isLastRow={weekIndex === weeks.length - 1}
              isLastCol={dayIndex === 6}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface MonthDayCellProps {
  day: Date;
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (date: Date) => void;
  isLastRow: boolean;
  isLastCol: boolean;
}

function MonthDayCell({
  day,
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
  isLastRow,
  isLastCol,
}: MonthDayCellProps) {
  const dayEvents = sortEvents(getAllEventsForDay(events, day));
  const { contentRef, getVisibleEventCount } = useEventVisibility({
    eventHeight: EventHeight,
    eventGap: EventGap,
  });

  const visibleCount = getVisibleEventCount(dayEvents.length);
  const visibleEvents = dayEvents.slice(0, visibleCount);
  const hiddenCount = dayEvents.length - visibleCount;

  return (
    <DroppableCell
      id={`month-${day.toISOString()}`}
      date={day}
      className={cn(
        "flex min-h-[100px] flex-col border-b border-r p-1",
        !isSameMonth(day, currentDate) && "bg-muted/30 text-muted-foreground",
        isLastRow && "border-b-0",
        isLastCol && "border-r-0"
      )}
      onClick={() => onEventCreate(day)}
    >
      <div
        className={cn(
          "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm",
          isToday(day) && "bg-primary text-primary-foreground font-bold"
        )}
      >
        {format(day, "d")}
      </div>
      <div ref={contentRef} className="flex-1 space-y-1 overflow-hidden">
        {visibleEvents.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            onClick={() => onEventSelect(event)}
            view="month"
            currentDay={day}
          />
        ))}
        {hiddenCount > 0 && (
          <button className="w-full rounded px-1 py-0.5 text-left text-xs text-muted-foreground hover:bg-muted">
            +{hiddenCount} more
          </button>
        )}
      </div>
    </DroppableCell>
  );
}
