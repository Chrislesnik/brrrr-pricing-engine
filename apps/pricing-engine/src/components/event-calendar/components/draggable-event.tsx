"use client";

import { useDraggable } from "@dnd-kit/core";
import type { CalendarEvent } from "./";
import { cn } from "@/lib/utils";

interface DraggableEventProps {
  event: CalendarEvent;
  children: React.ReactNode;
  className?: string;
}

export function DraggableEvent({
  event,
  children,
  className,
}: DraggableEventProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id,
      data: { event },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        className
      )}
    >
      {children}
    </div>
  );
}
