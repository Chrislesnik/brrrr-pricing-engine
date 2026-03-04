"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";

import {
  type CalendarEvent,
  type EventColor,
  DefaultStartHour,
  EndHour,
  StartHour
} from "./";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

export function EventDialog({ event, isOpen, onClose, onSave, onDelete }: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState(`${DefaultStartHour}:00`);
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState<EventColor>("sky");
  const [error, setError] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(false);

  // Whether this event is linked to a deal input (date/title are read-only)
  const isLinkedEvent = !!event?.dealInputId;

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");

      const start = new Date(event.start);
      setDate(start);
      setTime(formatTimeForInput(start));
      setAllDay(event.allDay || false);
      setColor((event.color as EventColor) || "sky");
      setError(null);
    } else {
      resetForm();
    }
  }, [event]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(new Date());
    setTime(`${DefaultStartHour}:00`);
    setAllDay(false);
    setColor("sky");
    setError(null);
  };

  const formatTimeForInput = (d: Date) => {
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(d.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  // Memoize time options so they're only calculated once
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        const d = new Date(2000, 0, 1, hour, minute);
        const label = format(d, "h:mm a");
        options.push({ value, label });
      }
    }
    return options;
  }, []);

  const handleSave = () => {
    const start = new Date(date);

    if (!allDay) {
      const [hours = 0, minutes = 0] = time.split(":").map(Number);

      if (hours < StartHour || hours > EndHour) {
        setError(`Selected time must be between ${StartHour}:00 and ${EndHour}:00`);
        return;
      }

      start.setHours(hours, minutes, 0, 0);
    } else {
      start.setHours(0, 0, 0, 0);
    }

    // Compute end from single date/time
    const end = new Date(start);
    if (allDay) {
      end.setHours(23, 59, 59, 999);
    } else {
      end.setHours(end.getHours() + 1);
    }

    // Use generic title if empty
    const eventTitle = title.trim() ? title : "(no title)";

    onSave({
      id: event?.id || "",
      title: eventTitle,
      description,
      start,
      end,
      allDay,
      color,
      dealInputId: event?.dealInputId
    });
  };

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id);
    }
  };

  // Color options
  const colorOptions: Array<{
    value: EventColor;
    label: string;
    bgClass: string;
    borderClass: string;
  }> = [
    {
      value: "sky",
      label: "Sky",
      bgClass: "bg-sky-400 data-[state=checked]:bg-sky-400",
      borderClass: "border-sky-400 data-[state=checked]:border-sky-400"
    },
    {
      value: "amber",
      label: "Amber",
      bgClass: "bg-amber-400 data-[state=checked]:bg-amber-400",
      borderClass: "border-amber-400 data-[state=checked]:border-amber-400"
    },
    {
      value: "violet",
      label: "Violet",
      bgClass: "bg-violet-400 data-[state=checked]:bg-violet-400",
      borderClass: "border-violet-400 data-[state=checked]:border-violet-400"
    },
    {
      value: "rose",
      label: "Rose",
      bgClass: "bg-rose-400 data-[state=checked]:bg-rose-400",
      borderClass: "border-rose-400 data-[state=checked]:border-rose-400"
    },
    {
      value: "emerald",
      label: "Emerald",
      bgClass: "bg-emerald-400 data-[state=checked]:bg-emerald-400",
      borderClass: "border-emerald-400 data-[state=checked]:border-emerald-400"
    },
    {
      value: "orange",
      label: "Orange",
      bgClass: "bg-orange-400 data-[state=checked]:bg-orange-400",
      borderClass: "border-orange-400 data-[state=checked]:border-orange-400"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event?.id ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription className="sr-only">
            {event?.id ? "Edit the details of this event" : "Add a new event to your calendar"}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLinkedEvent}
            />
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="event-date">Date</Label>
              <Popover open={isLinkedEvent ? false : dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="event-date"
                    variant={"outline"}
                    disabled={isLinkedEvent}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !date && "text-muted-foreground"
                    )}>
                    <span className={cn("truncate", !date && "text-muted-foreground")}>
                      {date ? format(date, "PPP") : "Pick a date"}
                    </span>
                    <CalendarIcon
                      className="text-muted-foreground/80 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    defaultMonth={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d);
                        setError(null);
                        setDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="event-time">Time</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger id="event-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day">All day</Label>
          </div>

          <fieldset className="space-y-4">
            <legend className="text-foreground text-sm leading-none font-medium">Etiquette</legend>
            <RadioGroup
              className="flex gap-1.5"
              defaultValue={colorOptions[0]?.value}
              value={color}
              onValueChange={(value: EventColor) => setColor(value)}>
              {colorOptions.map((colorOption) => (
                <RadioGroupItem
                  key={colorOption.value}
                  id={`color-${colorOption.value}`}
                  value={colorOption.value}
                  aria-label={colorOption.label}
                  className={cn("size-6 shadow-none", colorOption.bgClass, colorOption.borderClass)}
                />
              ))}
            </RadioGroup>
          </fieldset>
        </div>
        <DialogFooter className="flex-row sm:justify-between">
          {event?.id && !isLinkedEvent && (
            <Button variant="outline" size="icon" onClick={handleDelete} aria-label="Delete event">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
