"use client";

// Main component export
export { EventCalendar } from "./components/event-calendar";
export type { EventCalendarProps } from "./components/event-calendar";

// Sub-component exports
export { AgendaView } from "./components/agenda-view";
export { DayView } from "./components/day-view";
export { DraggableEvent } from "./components/draggable-event";
export { DroppableCell } from "./components/droppable-cell";
export { EventDialog } from "./components/event-dialog";
export { EventItem } from "./components/event-item";
export { EventsPopup } from "./components/events-popup";
export { MonthView } from "./components/month-view";
export { WeekView } from "./components/week-view";
export { CalendarDndProvider, useCalendarDnd } from "./components/calendar-dnd-context";

// Constants
export * from "./constants";

// Utilities
export * from "./utils";

// Hooks
export * from "./hooks/use-current-time-indicator";
export * from "./hooks/use-event-visibility";

// Types
export type { CalendarEvent, CalendarView, EventColor } from "./types";
