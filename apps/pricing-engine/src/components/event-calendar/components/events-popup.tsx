"use client";

import { format } from "date-fns";
import type { CalendarEvent } from "./";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EventItem } from "./event-item";

interface EventsPopupProps {
  date: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  trigger: React.ReactNode;
}

export function EventsPopup({
  date,
  events,
  onEventSelect,
  trigger,
}: EventsPopupProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="border-b px-3 py-2">
          <div className="font-medium">{format(date, "EEEE, MMMM d")}</div>
          <div className="text-sm text-muted-foreground">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {events.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onClick={() => onEventSelect(event)}
              view="month"
              currentDay={date}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
