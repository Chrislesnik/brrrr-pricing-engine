"use client";

import { useMemo, useState } from "react";
import { parse } from "date-fns";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  EventCalendar,
  type CalendarEvent,
  type EventColor,
} from "@/components/event-calendar";

interface DealCalendarTabProps {
  dealId: string;
}

// Internal event type for deal-specific data
interface DealEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  type: "meeting" | "deadline" | "inspection" | "closing";
  description?: string;
}

// Map deal event types to calendar event colors
const typeToColor: Record<DealEvent["type"], EventColor> = {
  meeting: "sky",
  deadline: "rose",
  inspection: "amber",
  closing: "emerald",
};

// Transform a DealEvent to CalendarEvent
function transformToCalendarEvent(event: DealEvent): CalendarEvent {
  // Parse date and time into a Date object
  const dateTimeString = `${event.date} ${event.time}`;
  const start = parse(dateTimeString, "yyyy-MM-dd h:mm a", new Date());
  
  // Default to 1 hour duration
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    start,
    end,
    color: typeToColor[event.type],
    location: event.location,
  };
}

export function DealCalendarTab({ dealId }: DealCalendarTabProps) {
  // Placeholder data - replace with actual API call
  const [events, setEvents] = useState<DealEvent[]>([
    {
      id: "1",
      title: "Property Inspection",
      date: "2024-02-14",
      time: "10:00 AM",
      location: "123 Main St",
      type: "inspection",
      description: "Initial property walkthrough with inspector",
    },
    {
      id: "2",
      title: "Closing Date",
      date: "2024-02-29",
      time: "2:00 PM",
      location: "Title Company Office",
      type: "closing",
      description: "Final closing and transfer of ownership",
    },
    {
      id: "3",
      title: "Loan Application Deadline",
      date: "2024-02-19",
      time: "5:00 PM",
      type: "deadline",
      description: "Submit all required loan documentation",
    },
  ]);

  // Transform events for the EventCalendar component
  const calendarEvents = useMemo(
    () => events.map(transformToCalendarEvent),
    [events]
  );

  // Calculate stats
  const upcomingCount = events.filter(
    (event) => new Date(event.date) >= new Date()
  ).length;

  const pastCount = events.filter(
    (event) => new Date(event.date) < new Date()
  ).length;

  // Event handlers
  const handleEventAdd = (event: CalendarEvent) => {
    // TODO: Integrate with API to save event
    console.log("Add event:", event);
  };

  const handleEventUpdate = (event: CalendarEvent) => {
    // TODO: Integrate with API to update event
    console.log("Update event:", event);
  };

  const handleEventDelete = (eventId: string) => {
    // TODO: Integrate with API to delete event
    console.log("Delete event:", eventId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Calendar & Events</h2>
        <p className="text-sm text-muted-foreground">
          Important dates and scheduled events for this deal
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
            <div className="mt-2 text-2xl font-bold">{events.length}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming
            </CardTitle>
            <div className="mt-2 text-2xl font-bold text-blue-600">
              {upcomingCount}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Past
            </CardTitle>
            <div className="mt-2 text-2xl font-bold text-muted-foreground">
              {pastCount}
            </div>
          </div>
        </Card>
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
