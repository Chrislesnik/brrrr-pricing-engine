"use client"

import { useEffect, useState } from "react"
import { IconInfoCircle } from "@tabler/icons-react"
import { MinusIcon, PlusIcon, SearchIcon } from "lucide-react"
import { Button as AriaButton, Group, Input as AriaInput, NumberField } from "react-aria-components"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/date-input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CalcInput } from "@/components/calc-input"
import { TagsInput, TagsInputList, TagsInputInput, TagsInputItem } from "@/components/ui/tags-input"
import { cn } from "@/lib/utils"
import { resolveNumberConstraints } from "@/lib/resolve-number-constraints"
import type { NumberConstraintsConfig } from "@/types/number-constraints"
import { NUMERIC_INPUT_TYPES } from "@/types/number-constraints"

export interface PEInputField {
  id: string | number
  input_code: string
  input_label: string
  input_type: string
  dropdown_options?: string[] | null
  tooltip?: string | null
  placeholder?: string | null
  default_value?: string | null
  config?: Record<string, unknown> | null
  layout_row: number
  layout_width: string
}

interface DynamicPEInputProps {
  field: PEInputField
  value: unknown
  onChange: (val: unknown) => void
  isRequired?: boolean
  isComputed?: boolean
  touched?: boolean
  formValues?: Record<string, unknown>
  signalColor?: string | null
}

export function DynamicPEInput({
  field,
  value,
  onChange,
  isRequired,
  isComputed,
  touched,
  formValues,
  signalColor,
}: DynamicPEInputProps) {
  const id = `pe-${field.input_code}`
  const placeholder = field.placeholder ?? ""
  const isDefault = !touched && value === field.default_value

  const constraints = NUMERIC_INPUT_TYPES.has(field.input_type) && field.config
    ? resolveNumberConstraints(field.config as unknown as NumberConstraintsConfig, formValues ?? {})
    : null

  useEffect(() => {
    if (!constraints) return
    const isEmpty = value === undefined || value === null || value === ""
    const num = isEmpty ? NaN : Number(value)

    if (isEmpty && constraints.min != null) {
      onChange(String(constraints.min))
      return
    }

    if (Number.isNaN(num)) return

    let clamped = num
    if (constraints.min != null && clamped < constraints.min) clamped = constraints.min
    if (constraints.max != null && clamped > constraints.max) clamped = constraints.max
    if (clamped !== num) onChange(String(clamped))
  }, [constraints?.min, constraints?.max, value, onChange])

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {field.input_label}
        </Label>
        {isRequired && <span className="text-red-500 text-xs">*</span>}
        {field.tooltip && (
          <TooltipProvider>
            <Tooltip delayDuration={50}>
              <TooltipTrigger>
                <IconInfoCircle size={12} className="text-muted-foreground stroke-[1.25]" />
                <span className="sr-only">More Info</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{field.tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div
        className={signalColor ? "rounded-md ring-2" : undefined}
        style={signalColor ? { "--tw-ring-color": signalColor } as React.CSSProperties : undefined}
      >
        <InputControl
          field={field}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isDefault={isDefault}
          isComputed={isComputed}
          minValue={constraints?.min}
          maxValue={constraints?.max}
          stepValue={constraints?.step}
        />
      </div>
    </div>
  )
}

function InputControl({
  field,
  id,
  value,
  onChange,
  placeholder,
  isDefault,
  isComputed,
  minValue,
  maxValue,
  stepValue,
}: {
  field: PEInputField
  id: string
  value: unknown
  onChange: (val: unknown) => void
  placeholder: string
  isDefault: boolean
  isComputed?: boolean
  minValue?: number | null
  maxValue?: number | null
  stepValue?: number | null
}) {
  switch (field.input_type) {
    case "text":
      return (
        <Input
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(isDefault && "text-muted-foreground", isComputed && "bg-blue-50 dark:bg-blue-950/30")}
        />
      )

    case "dropdown":
      return (
        <Select
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={id} className={cn(isDefault && "text-muted-foreground", isComputed && "bg-blue-50 dark:bg-blue-950/30")}>
            <SelectValue placeholder={placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {(field.dropdown_options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case "number":
      return <NumberInput id={id} value={value} onChange={onChange} placeholder={placeholder} isDefault={isDefault} isComputed={isComputed} minValue={minValue} maxValue={maxValue} stepValue={stepValue} />

    case "currency":
    case "calc_currency":
      return (
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 text-sm text-muted-foreground z-10">$</span>
          <CalcInput
            id={id}
            placeholder={placeholder || "0.00"}
            value={String(value ?? "")}
            onValueChange={(v) => {
              const n = Number(v)
              if (v !== "" && Number.isFinite(n)) {
                let clamped = n
                if (minValue != null && clamped < minValue) clamped = minValue
                if (maxValue != null && clamped > maxValue) clamped = maxValue
                if (clamped !== n) { onChange(String(clamped)); return }
              }
              onChange(v)
            }}
            className={cn("pl-6 w-full", isDefault && "text-muted-foreground", isComputed && "bg-blue-50 dark:bg-blue-950/30")}
          />
        </div>
      )

    case "percentage":
      return (
        <div className="relative">
          <Input
            id={id}
            type="number"
            step={stepValue ?? 0.01}
            min={minValue ?? 0}
            max={maxValue ?? 100}
            value={String(value ?? "")}
            onChange={(e) => {
              const v = e.target.value
              const n = Number(v)
              if (v !== "" && Number.isFinite(n)) {
                const lo = minValue ?? 0
                const hi = maxValue ?? 100
                if (n < lo) { onChange(String(lo)); return }
                if (n > hi) { onChange(String(hi)); return }
              }
              onChange(v)
            }}
            placeholder={placeholder || "0.00"}
            className={cn("pr-8", isDefault && "text-muted-foreground", isComputed && "bg-blue-50 dark:bg-blue-950/30")}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            %
          </span>
        </div>
      )

    case "date":
      return <DatePickerControl id={id} value={value} onChange={onChange} isDefault={isDefault} isComputed={isComputed} />

    case "boolean":
      return (
        <Select
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={id} className={cn(isDefault && "text-muted-foreground", isComputed && "bg-blue-50 dark:bg-blue-950/30")}>
            <SelectValue placeholder={placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      )

    case "tags":
      return <TagsControl id={id} value={value} onChange={onChange} placeholder={placeholder} />

    case "table":
      return (
        <div className="text-xs text-muted-foreground italic py-2">
          Table rendered by pricing page
        </div>
      )

    default:
      return (
        <Input
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(isDefault && "text-muted-foreground")}
        />
      )
  }
}

function NumberInput({
  id,
  value,
  onChange,
  placeholder,
  isDefault,
  isComputed,
  minValue,
  maxValue,
  stepValue,
}: {
  id: string
  value: unknown
  onChange: (val: unknown) => void
  placeholder: string
  isDefault: boolean
  isComputed?: boolean
  minValue?: number | null
  maxValue?: number | null
  stepValue?: number | null
}) {
  const numVal = value !== undefined && value !== null && value !== "" ? Number(value) : undefined

  return (
    <NumberField
      value={numVal}
      onChange={(val) => onChange(val != null ? String(val) : "")}
      minValue={minValue ?? undefined}
      maxValue={maxValue ?? undefined}
      step={stepValue ?? undefined}
      className="w-full"
    >
      <Group className={cn(
        "border-input data-focus-within:ring-1 data-focus-within:ring-ring relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors outline-none data-disabled:opacity-50",
        isComputed && "bg-blue-50 dark:bg-blue-950/30"
      )}>
        <AriaInput
          id={id}
          placeholder={placeholder}
          className={cn(
            "w-full grow px-3 py-1 text-base md:text-sm outline-none bg-transparent placeholder:text-muted-foreground",
            isDefault && "text-muted-foreground"
          )}
        />
        <AriaButton
          slot="decrement"
          className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
        >
          <MinusIcon className="size-4" />
        </AriaButton>
        <AriaButton
          slot="increment"
          className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
        >
          <PlusIcon className="size-4" />
        </AriaButton>
      </Group>
    </NumberField>
  )
}

function DatePickerControl({
  id,
  value,
  onChange,
  isDefault,
  isComputed,
}: {
  id: string
  value: unknown
  onChange: (val: unknown) => void
  isDefault: boolean
  isComputed?: boolean
}) {
  const dateValue = value instanceof Date ? value : typeof value === "string" && value ? new Date(value) : undefined
  const validDate = dateValue && !isNaN(dateValue.getTime()) ? dateValue : undefined
  const [calMonth, setCalMonth] = useState<Date>(validDate ?? new Date())

  return (
    <Popover>
      <PopoverTrigger asChild>
        <DateInput
          value={validDate}
          onChange={(d) => onChange(d)}
          className={cn(isDefault && "text-muted-foreground", isComputed && "bg-blue-50 dark:bg-blue-950/30")}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={validDate}
          month={calMonth}
          onMonthChange={setCalMonth}
          onSelect={(d) => d && onChange(d)}
          captionLayout="label"
          className="rounded-md border min-w-[264px]"
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

function TagsControl({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: unknown
  onChange: (val: unknown) => void
  placeholder: string
}) {
  const [inputVal, setInputVal] = useState("")
  const tags: string[] = Array.isArray(value) ? value.map(String) : typeof value === "string" && value ? [value] : []

  return (
    <TagsInput
      value={tags}
      onValueChange={(newValues) => onChange(newValues)}
      className="w-full"
    >
      <TagsInputList className="min-h-9 px-3 py-1 overflow-x-auto overflow-y-hidden flex-nowrap">
        <SearchIcon className="size-4 text-muted-foreground mr-1 shrink-0" />
        {tags.map((tag, idx) => (
          <TagsInputItem
            key={`${tag}-${idx}`}
            value={tag}
            className="text-xs px-1.5 py-0.5 shrink-0"
          >
            {tag}
          </TagsInputItem>
        ))}
        <TagsInputInput
          id={id}
          placeholder={tags.length === 0 ? (placeholder || "Type and press Enter") : ""}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputVal.trim()) {
              e.preventDefault()
              onChange([...tags, inputVal.trim()])
              setInputVal("")
            }
          }}
          autoComplete="off"
        />
      </TagsInputList>
    </TagsInput>
  )
}
