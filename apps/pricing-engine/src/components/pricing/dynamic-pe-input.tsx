"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import type { DateConfig } from "@/types/date-config"
import { resolveDateBound } from "@/types/date-config"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { LinkedAutocompleteInput, type LinkedRecord } from "@/components/linked-autocomplete-input"

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
  linked_table?: string | null
  linked_column?: string | null
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
  onLinkedRecordSelect?: (inputCode: string, recordId: string | null) => void
  isRequired?: boolean
  isComputed?: boolean
  isExpressionDefault?: boolean
  expressionLabel?: string
  touched?: boolean
  formValues?: Record<string, unknown>
  signalColor?: string | null
  linkedRecords?: LinkedRecord[]
}

export function DynamicPEInput({
  field,
  value,
  onChange,
  onAddressSelect,
  onLinkedRecordSelect,
  isRequired,
  isComputed,
  isExpressionDefault,
  expressionLabel,
  touched,
  formValues,
  signalColor,
  linkedRecords,
}: DynamicPEInputProps) {
  const id = `pe-${field.input_code}`
  const placeholder = field.placeholder ?? ""
  const isDefault = (!touched && (
    value === field.default_value ||
    (field.input_type === "boolean" && typeof value === "boolean" && value === (field.default_value === "true" || field.default_value === "yes" || field.default_value === "Yes"))
  )) || !!isExpressionDefault

  const constraints = NUMERIC_INPUT_TYPES.has(field.input_type) && field.config
    ? resolveNumberConstraints(field.config as unknown as NumberConstraintsConfig, formValues ?? {})
    : null

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const prevClampedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!constraints) return
    const isEmpty = value === undefined || value === null || value === ""
    const num = isEmpty ? NaN : Number(value)

    if (isEmpty && constraints.min != null) {
      const target = String(constraints.min)
      if (prevClampedRef.current !== target) {
        prevClampedRef.current = target
        onChangeRef.current(target)
      }
      return
    }

    if (Number.isNaN(num)) return

    let clamped = num
    if (constraints.min != null && clamped < constraints.min) clamped = constraints.min
    if (constraints.max != null && clamped > constraints.max) clamped = constraints.max
    if (clamped !== num) {
      const target = String(clamped)
      if (prevClampedRef.current !== target) {
        prevClampedRef.current = target
        onChangeRef.current(target)
      }
    } else {
      prevClampedRef.current = null
    }
  }, [constraints?.min, constraints?.max, value])

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
          onLinkedRecordSelect={onLinkedRecordSelect}
          placeholder={placeholder}
          isDefault={isDefault}
          isComputed={isComputed}
          minValue={constraints?.min}
          maxValue={constraints?.max}
          stepValue={constraints?.step}
          linkedRecords={linkedRecords}
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
  onLinkedRecordSelect,
  placeholder,
  isDefault,
  isComputed,
  minValue,
  maxValue,
  stepValue,
  linkedRecords,
}: {
  field: PEInputField
  id: string
  value: unknown
  onChange: (val: unknown) => void
  onAddressSelect?: (fields: AddressFields) => void
  onLinkedRecordSelect?: (inputCode: string, recordId: string | null) => void
  placeholder: string
  isDefault: boolean
  isComputed?: boolean
  minValue?: number | null
  maxValue?: number | null
  stepValue?: number | null
  linkedRecords?: LinkedRecord[]
}) {
  const hasLinkedRecords = field.linked_table && linkedRecords && linkedRecords.length > 0

  // When showing a default, render the value as a placeholder so the user can just start typing
  const rawVal = String(value ?? "")
  const effectiveValue = isDefault ? "" : rawVal
  const effectivePlaceholder = isDefault ? rawVal || placeholder : placeholder
  const computedClass = isComputed ? "bg-blue-50 dark:bg-blue-950/30" : undefined

  switch (field.input_type) {
    case "text":
      if (field.config?.address_role === "street") {
        return (
          <AddressAutocomplete
            id={id}
            value={effectiveValue}
            displayValue="street"
            placeholder={effectivePlaceholder}
            className={cn(computedClass)}
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
      if (hasLinkedRecords) {
        return (
          <LinkedAutocompleteInput
            id={id}
            value={effectiveValue}
            onChange={(v) => onChange(v)}
            onRecordSelect={(rec) => onLinkedRecordSelect?.(field.input_code, rec?.id ?? null)}
            records={linkedRecords!}
            placeholder={effectivePlaceholder}
            className={cn(computedClass)}
          />
        )
      }
      return (
        <Input
          id={id}
          value={effectiveValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={effectivePlaceholder}
          className={cn(computedClass)}
        />
      )

    case "dropdown":
      if (hasLinkedRecords) {
        return (
          <LinkedAutocompleteInput
            id={id}
            value={effectiveValue}
            onChange={(v) => onChange(v)}
            onRecordSelect={(rec) => onLinkedRecordSelect?.(field.input_code, rec?.id ?? null)}
            records={linkedRecords!}
            placeholder={effectivePlaceholder}
            className={cn(computedClass)}
          />
        )
      }
      return (
        <Select
          value={isDefault ? "" : String(value ?? "")}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={id} className={cn(computedClass)}>
            <SelectValue placeholder={effectivePlaceholder || field.input_label} />
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
      return <NumberInput id={id} value={isDefault ? undefined : value} onChange={onChange} placeholder={effectivePlaceholder} isDefault={isDefault} isComputed={isComputed} minValue={minValue} maxValue={maxValue} stepValue={stepValue} />

    case "currency":
    case "calc_currency":
      return (
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 text-sm text-muted-foreground z-10">$</span>
          <CalcInput
            id={id}
            placeholder={effectivePlaceholder}
            value={effectiveValue}
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
            className={cn("pl-6 w-full", computedClass)}
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
            value={effectiveValue}
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
            placeholder={effectivePlaceholder}
            className={cn("pr-8", computedClass)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            %
          </span>
        </div>
      )

    case "date":
      return <DatePickerControl id={id} value={value} onChange={onChange} isDefault={isDefault} isComputed={isComputed} dateConfig={field.config as unknown as DateConfig | undefined} />

    case "boolean": {
      const boolDisplay = (field.config?.boolean_display as string) ?? "dropdown"
      const boolVal = value === true || value === "true" || value === "Yes"

      if (boolDisplay === "switch") {
        return (
          <div className="flex h-9 items-center">
            <div className="relative inline-grid h-8 grid-cols-[1fr_1fr] items-center text-sm font-medium">
              <Switch
                id={id}
                checked={boolVal}
                onCheckedChange={(checked) => onChange(!!checked)}
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
            value={boolVal ? "true" : "false"}
            onValueChange={(v) => onChange(v === "true")}
            className="flex items-center gap-4 py-1"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="true" id={`${id}-yes`} />
              <Label htmlFor={`${id}-yes`} className="text-sm">Yes</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="false" id={`${id}-no`} />
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
              onCheckedChange={(checked) => onChange(!!checked)}
            />
            <Label htmlFor={id} className="text-sm">
              Yes
            </Label>
          </div>
        )
      }

      return (
        <Select
          value={boolVal ? "true" : (value === "false" || value === "No" || value === false ? "false" : "")}
          onValueChange={(v) => onChange(v === "true")}
        >
          <SelectTrigger id={id} className={cn(computedClass)}>
            <SelectValue placeholder={effectivePlaceholder || field.input_label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    case "tags":
      return <TagsControl id={id} value={isDefault ? [] : value} onChange={onChange} onLinkedRecordSelect={(recId) => onLinkedRecordSelect?.(field.input_code, recId)} placeholder={effectivePlaceholder || placeholder} linkedRecords={hasLinkedRecords ? linkedRecords : undefined} />

    case "table":
      return (
        <div className="text-xs text-muted-foreground italic py-2">
          Table rendered by pricing page
        </div>
      )

    default:
      if (hasLinkedRecords) {
        return (
          <LinkedAutocompleteInput
            id={id}
            value={effectiveValue}
            onChange={(v) => onChange(v)}
            onRecordSelect={(rec) => onLinkedRecordSelect?.(field.input_code, rec?.id ?? null)}
            records={linkedRecords!}
            placeholder={effectivePlaceholder}
          />
        )
      }
      return (
        <Input
          id={id}
          value={effectiveValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={effectivePlaceholder}
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
          className="w-full grow px-3 py-1 text-base md:text-sm outline-none bg-transparent placeholder:text-muted-foreground"
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
  dateConfig,
}: {
  id: string
  value: unknown
  onChange: (val: unknown) => void
  isDefault: boolean
  isComputed?: boolean
  dateConfig?: DateConfig
}) {
  const dateValue = value instanceof Date ? value : typeof value === "string" && value ? new Date(value) : undefined
  const validDate = dateValue && !isNaN(dateValue.getTime()) ? dateValue : undefined
  const [calMonth, setCalMonth] = useState<Date>(validDate ?? new Date())

  const captionLayout = dateConfig?.calendar_style === "dropdown" ? "dropdown" : "label"

  const configKey = JSON.stringify({
    min: dateConfig?.min_date ?? null,
    max: dateConfig?.max_date ?? null,
  })

  const { disableBefore, disableAfter } = useMemo(() => {
    return {
      disableBefore: resolveDateBound(dateConfig?.min_date),
      disableAfter: resolveDateBound(dateConfig?.max_date),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey])

  const disabledMatcher = useMemo(() => {
    if (!disableBefore && !disableAfter) return undefined
    return (date: Date) => {
      if (disableBefore && date < disableBefore) return true
      if (disableAfter && date > disableAfter) return true
      return false
    }
  }, [disableBefore, disableAfter])

  const startMonth = disableBefore ?? (captionLayout === "dropdown" ? new Date(2020, 0) : undefined)
  const endMonth = disableAfter ?? (captionLayout === "dropdown" ? new Date(2035, 11) : undefined)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <DateInput
          value={validDate}
          onChange={(d) => onChange(d)}
          className={cn(isComputed && "bg-blue-50 dark:bg-blue-950/30")}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={validDate}
          month={calMonth}
          onMonthChange={setCalMonth}
          onSelect={(d) => d && onChange(d)}
          captionLayout={captionLayout}
          disabled={disabledMatcher}
          startMonth={startMonth}
          endMonth={endMonth}
          className="rounded-md border min-w-[264px]"
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

function TagsControl({
  id,
  value,
  onChange,
  onLinkedRecordSelect,
  placeholder,
  linkedRecords,
}: {
  id: string
  value: unknown
  onChange: (val: unknown) => void
  onLinkedRecordSelect?: (recordId: string | null) => void
  placeholder: string
  linkedRecords?: LinkedRecord[]
}) {
  const [inputVal, setInputVal] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const pointerInMenuRef = useRef(false)
  const tags: string[] = Array.isArray(value) ? value.map(String) : typeof value === "string" && value ? [value] : []

  const suggestions = useMemo(() => {
    if (!linkedRecords || linkedRecords.length === 0) return []
    const q = inputVal.trim().toLowerCase()
    const tagSet = new Set(tags.map((t) => t.toLowerCase()))
    return linkedRecords.filter(
      (r) => !tagSet.has(r.label.toLowerCase()) && (!q || r.label.toLowerCase().includes(q)),
    )
  }, [linkedRecords, inputVal, tags])

  const addTag = (label: string, recordId?: string) => {
    onChange([...tags, label])
    if (recordId) onLinkedRecordSelect?.(recordId)
    setInputVal("")
    setShowSuggestions(false)
    setActiveIdx(-1)
  }

  const hasLinked = linkedRecords && linkedRecords.length > 0
  const linkedLabelSet = useMemo(() => {
    if (!hasLinked) return new Set<string>()
    return new Set(linkedRecords!.map((r) => r.label.toLowerCase()))
  }, [hasLinked, linkedRecords])

  return (
    <div className="relative">
      <TagsInput
        value={tags}
        onValueChange={(newValues) => onChange(newValues)}
        className="w-full"
      >
        <TagsInputList className="min-h-9 px-3 py-1 overflow-x-auto overflow-y-hidden flex-nowrap">
          <SearchIcon className="size-4 mr-1 shrink-0 text-muted-foreground" />
          {tags.map((tag, idx) => {
            const isLinked = linkedLabelSet.has(tag.toLowerCase())
            return (
              <TagsInputItem
                key={`${tag}-${idx}`}
                value={tag}
                className={cn(
                  "text-xs px-1.5 py-0.5 shrink-0",
                  isLinked && "ring-2 ring-blue-500",
                )}
              >
                {tag}
              </TagsInputItem>
            )
          })}
          <TagsInputInput
            id={id}
            placeholder={tags.length === 0 ? (placeholder || "Type and press Enter") : ""}
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value)
              if (linkedRecords && linkedRecords.length > 0) {
                setShowSuggestions(true)
                setActiveIdx(-1)
              }
            }}
            onFocus={() => {
              if (linkedRecords && linkedRecords.length > 0) setShowSuggestions(true)
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!pointerInMenuRef.current) setShowSuggestions(false)
              }, 0)
            }}
            onKeyDown={(e) => {
              if (showSuggestions && suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setActiveIdx((idx) => Math.min(idx + 1, suggestions.length - 1))
                  return
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setActiveIdx((idx) => Math.max(idx - 1, 0))
                  return
                }
                if (e.key === "Enter" && activeIdx >= 0) {
                  e.preventDefault()
                  addTag(suggestions[activeIdx].label, suggestions[activeIdx].id)
                  return
                }
                if (e.key === "Escape") {
                  setShowSuggestions(false)
                  return
                }
              }
              if (e.key === "Enter" && inputVal.trim()) {
                e.preventDefault()
                addTag(inputVal.trim())
              }
            }}
            autoComplete="off"
          />
        </TagsInputList>
      </TagsInput>
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-background shadow max-h-48 overflow-y-auto"
          role="listbox"
          onMouseDown={() => (pointerInMenuRef.current = true)}
          onMouseUp={() => (pointerInMenuRef.current = false)}
        >
          {suggestions.map((rec, idx) => (
            <button
              key={rec.id}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent",
                idx === activeIdx && "bg-accent",
              )}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => addTag(rec.label, rec.id)}
            >
              <span className="truncate">{rec.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
