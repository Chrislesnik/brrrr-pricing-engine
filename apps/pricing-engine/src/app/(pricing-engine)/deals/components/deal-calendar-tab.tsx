"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@repo/ui/shadcn/button";
import { Badge } from "@repo/ui/shadcn/badge";
import { Calendar, Plus, Clock, MapPin } from "lucide-react";

interface DealCalendarTabProps {
  dealId: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  type: "meeting" | "deadline" | "inspection" | "closing";
  description?: string;
}

export function DealCalendarTab({ dealId }: DealCalendarTabProps) {
  // Placeholder data - replace with actual API call
  const [events] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Property Inspection",
      date: "2024-02-15",
      time: "10:00 AM",
      location: "123 Main St",
      type: "inspection",
      description: "Initial property walkthrough with inspector",
    },
    {
      id: "2",
      title: "Closing Date",
      date: "2024-03-01",
      time: "2:00 PM",
      location: "Title Company Office",
      type: "closing",
      description: "Final closing and transfer of ownership",
    },
    {
      id: "3",
      title: "Loan Application Deadline",
      date: "2024-02-20",
      time: "5:00 PM",
      type: "deadline",
      description: "Submit all required loan documentation",
    },
  ]);

  const getEventTypeBadge = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "meeting":
        return <Badge variant="default">Meeting</Badge>;
      case "deadline":
        return <Badge variant="destructive">Deadline</Badge>;
      case "inspection":
        return <Badge variant="secondary">Inspection</Badge>;
      case "closing":
        return <Badge className="bg-green-600">Closing</Badge>;
    }
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const upcomingEvents = sortedEvents.filter(
    (event) => new Date(event.date) >= new Date()
  );

  const pastEvents = sortedEvents.filter(
    (event) => new Date(event.date) < new Date()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Calendar & Events</h2>
          <p className="text-sm text-muted-foreground">
            Important dates and scheduled events for this deal
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {upcomingEvents.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Past
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {pastEvents.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Events scheduled for this deal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{event.title}</h4>
                      {getEventTypeBadge(event.type)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {event.time}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Events</CardTitle>
            <CardDescription>
              Completed events for this deal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 border rounded-lg opacity-60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{event.title}</h4>
                      {getEventTypeBadge(event.type)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {event.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {events.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events scheduled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first event to keep track of important dates
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
