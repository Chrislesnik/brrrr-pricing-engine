export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;       // computed for rendering from event_date + event_time
  end: Date;         // computed for rendering (start + 1hr, or end-of-day if allDay)
  allDay?: boolean;
  color?: EventColor;
  dealInputId?: string;  // if set, date/title are read-only (linked to deal_inputs)
}

export type EventColor = "sky" | "amber" | "violet" | "rose" | "emerald" | "orange";
