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
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { resolveNumberConstraints } from "@/lib/resolve-number-constraints"
import type { NumberConstraintsConfig } from "@/types/number-constraints"
import { NUMERIC_INPUT_TYPES } from "@/types/number-constraints"
import { AddressAutocomplete } from "@/components/address-autocomplete"

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

export interface AddressFields {
  street?: string
  apt?: string
  city?: string
  state?: string
  zip?: string
  county?: string
}

interface DynamicPEInputProps {
  field: PEInputField
  value: unknown
  onChange: (val: unknown) => void
  onAddressSelect?: (fields: AddressFields) => void
  isRequired?: boolean
  isComputed?: boolean
  isExpressionDefault?: boolean
  expressionLabel?: string
  touched?: boolean
  formValues?: Record<string, unknown>
  signalColor?: string | null
}

export function DynamicPEInput({
  field,
  value,
  onChange,
  onAddressSelect,
  isRequired,
  isComputed,
  isExpressionDefault,
  expressionLabel,
  touched,
  formValues,
  signalColor,
}: DynamicPEInputProps) {
  const id = `pe-${field.input_code}`
  const placeholder = field.placeholder ?? ""
  const isDefault = (!touched && value === field.default_value) || !!isExpressionDefault

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
        {isExpressionDefault && (
          <TooltipProvider>
            <Tooltip delayDuration={50}>
              <TooltipTrigger>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded cursor-default">
                  f(x)
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs font-mono text-xs">
                {expressionLabel || field.default_value}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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
          onAddressSelect={onAddressSelect}
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
  onAddressSelect,
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
  onAddressSelect?: (fields: AddressFields) => void
  placeholder: string
  isDefault: boolean
  isComputed?: boolean
  minValue?: number | null
  maxValue?: number | null
  stepValue?: number | null
}) {
  switch (field.input_type) {
    case "text":
      if (field.config?.address_role === "street") {
        return (
          <AddressAutocomplete
            id={id}
            value={String(value ?? "")}
            displayValue="street"
            placeholder={placeholder || "Start typing an address..."}
            className={cn(isDefault && "text-muted-foreground", isComputed && "bg-blue-50 dark:bg-blue-950/30")}
            onChange={(addr) => {
              onChange(addr.address_line1 ?? addr.raw)
              onAddressSelect?.({
                street: addr.address_line1,
                apt: addr.address_line2,
                city: addr.city,
                state: addr.state,
                zip: addr.zip,
                county: addr.county,
              })
            }}
          />
        )
      }
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

    case "boolean": {
      const boolDisplay = (field.config?.boolean_display as string) ?? "dropdown"
      const boolVal = value === "Yes" || value === true || value === "true"

      if (boolDisplay === "switch") {
        return (
          <div className="flex h-9 items-center">
            <div className="relative inline-grid h-8 grid-cols-[1fr_1fr] items-center text-sm font-medium">
              <Switch
                id={id}
                checked={boolVal}
                onCheckedChange={(checked) => onChange(checked ? "Yes" : "No")}
                className="peer data-[state=unchecked]:bg-input/50 absolute inset-0 h-[inherit] w-auto rounded-md [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:rounded-sm [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-full [&_span]:data-[state=checked]:rtl:-translate-x-full"
              />
              <span className="pointer-events-none relative ml-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full peer-data-[state=unchecked]:rtl:-translate-x-full">
                <span className="text-[10px] font-medium uppercase">No</span>
              </span>
              <span className="peer-data-[state=checked]:text-background pointer-events-none relative mr-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:-translate-x-full peer-data-[state=unchecked]:invisible peer-data-[state=checked]:rtl:translate-x-full">
                <span className="text-[10px] font-medium uppercase">Yes</span>
              </span>
            </div>
          </div>
        )
      }

      if (boolDisplay === "radio") {
        return (
          <RadioGroup
            value={boolVal ? "Yes" : "No"}
            onValueChange={(v) => onChange(v)}
            className="flex items-center gap-4 py-1"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="Yes" id={`${id}-yes`} />
              <Label htmlFor={`${id}-yes`} className="text-sm">Yes</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="No" id={`${id}-no`} />
              <Label htmlFor={`${id}-no`} className="text-sm">No</Label>
            </div>
          </RadioGroup>
        )
      }

      if (boolDisplay === "checkbox") {
        return (
          <div className="flex items-center gap-2 py-1">
            <Checkbox
              id={id}
              checked={boolVal}
              onCheckedChange={(checked) => onChange(checked ? "Yes" : "No")}
            />
            <Label htmlFor={id} className="text-sm">
              Yes
            </Label>
          </div>
        )
      }

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
    }

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
