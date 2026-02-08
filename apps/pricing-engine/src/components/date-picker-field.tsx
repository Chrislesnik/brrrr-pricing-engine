"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@repo/ui/shadcn/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover"
import { DateInput } from "@/components/date-input"
import { cn } from "@repo/lib/cn"

interface DatePickerFieldProps {
  /** Value as ISO date string (YYYY-MM-DD) or Date object */
  value?: string | Date | null
  /** Called with ISO date string (YYYY-MM-DD) or empty string */
  onChange: (value: string) => void
  /** Additional class name for the wrapper */
  className?: string
  /** Disable date selection */
  disabled?: boolean
  /** Disable dates before this date */
  disableBefore?: Date
  /** Disable dates after this date */
  disableAfter?: Date
  /** Start with empty inputs (no default to today) */
  emptyOnMount?: boolean
}

/**
 * A reusable date picker component that combines DateInput with a Calendar popover.
 * Handles string/Date conversion internally for form compatibility.
 */
export function DatePickerField({
  value,
  onChange,
  className,
  disabled,
  disableBefore,
  disableAfter,
  emptyOnMount = true,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(() => {
    if (value) {
      const d = typeof value === "string" ? new Date(value + "T00:00:00") : value
      return isNaN(d.getTime()) ? new Date() : d
    }
    return new Date()
  })

  // Parse value to Date
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    // Parse ISO date string, treating it as local time
    const d = new Date(value + "T00:00:00")
    return isNaN(d.getTime()) ? undefined : d
  }, [value])

  // Keep calendar month in sync with selected date
  useEffect(() => {
    if (dateValue) {
      setCalendarMonth(dateValue)
    }
  }, [dateValue])

  // Format Date to ISO string (YYYY-MM-DD)
  const formatToISODate = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const handleDateInputChange = (date: Date) => {
    onChange(formatToISODate(date))
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(formatToISODate(date))
      setOpen(false)
    }
  }

  const disabledMatcher = React.useMemo(() => {
    if (!disableBefore && !disableAfter) return undefined
    return (date: Date) => {
      if (disableBefore && date < disableBefore) return true
      if (disableAfter && date > disableAfter) return true
      return false
    }
  }, [disableBefore, disableAfter])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <div className={cn("relative", className)}>
          <DateInput
            emptyOnMount={emptyOnMount}
            value={dateValue}
            onChange={handleDateInputChange}
            className={cn(disabled && "opacity-50 cursor-not-allowed")}
          />
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
            <CalendarIcon className="h-4 w-4" />
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={dateValue}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          onSelect={handleCalendarSelect}
          disabled={disabledMatcher}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
