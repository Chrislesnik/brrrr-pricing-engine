"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  Button as AriaButton,
  Group,
  Input as AriaInput,
  NumberField,
} from "react-aria-components"
import { Loader2, MinusIcon, PlusIcon } from "lucide-react"
import { useLogicEngine } from "@/hooks/use-logic-engine"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/shadcn/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select"
import { DatePickerField } from "@/components/date-picker-field"
import { CalcInput } from "@/components/calc-input"
import { LinkedAutocompleteInput } from "@/components/linked-autocomplete-input"
import { useLinkedRules } from "@/hooks/use-linked-rules"
import { useAutofillFromLinkedRecord } from "@/hooks/use-autofill-from-linked-record"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface InputCategory {
  id: number
  category: string
  display_order: number
  created_at: string
  default_open?: boolean
}

interface InputField {
  id: string
  category_id: number
  category: string
  input_label: string
  input_code: string
  input_type: string
  dropdown_options: string[] | null
  config?: Record<string, unknown> | null
  starred: boolean
  display_order: number
  created_at: string
}

interface LinkedRecord {
  id: string
  label: string
}

type FormValues = Record<string, string | boolean>

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function NewDealInline({ onClose }: { onClose: () => void }) {
  const [categories, setCategories] = useState<InputCategory[]>([])
  const [inputs, setInputs] = useState<InputField[]>([])
  const [formValues, setFormValues] = useState<FormValues>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [linkedRecordsByTable, setLinkedRecordsByTable] = useState<Record<string, LinkedRecord[]>>({})
  const [loadingLinkedRecords, setLoadingLinkedRecords] = useState(false)

  const { resolvedLinks, getResolvedLink, resolvedTableColumnPairs } = useLinkedRules(inputs, formValues)

  const [recordIds, setRecordIds] = useState<Record<string, string | undefined>>({})

  const { autofillValues, lockedInputCodes } = useAutofillFromLinkedRecord(inputs, recordIds, resolvedLinks)

  useEffect(() => {
    if (Object.keys(autofillValues).length === 0) return
    setFormValues((prev) => {
      let updated = false
      const next = { ...prev }
      for (const [code, val] of Object.entries(autofillValues)) {
        const inputDef = inputs.find((i) => i.input_code === code)
        if (!inputDef) continue
        const key = inputDef.id
        if (prev[key] !== val) {
          next[key] = val
          updated = true
        }
      }
      return updated ? next : prev
    })
  }, [autofillValues, inputs])

  // Fetch categories + inputs on mount
  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      try {
        const [catsRes, inputsRes] = await Promise.all([
          fetch("/api/input-categories"),
          fetch("/api/inputs"),
        ])
        const catsJson = await catsRes.json().catch(() => [])
        const inputsJson = await inputsRes.json().catch(() => [])
        if (cancelled) return

        const cats: InputCategory[] = Array.isArray(catsJson) ? catsJson : []
        const inp: InputField[] = Array.isArray(inputsJson) ? inputsJson : []

        setCategories(cats)
        setInputs(inp)

        const defaults: FormValues = {}
        for (const input of inp) {
          if (input.input_type === "boolean") {
            defaults[input.id] = false
          } else {
            defaults[input.id] = ""
          }
        }
        setFormValues(defaults)
      } catch {
        if (!cancelled) {
          setCategories([])
          setInputs([])
          setFormValues({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  // Fetch linked records for inputs with resolved linked rules
  useEffect(() => {
    if (inputs.length === 0) return
    let cancelled = false

    const tableExprPairs = resolvedTableColumnPairs()
    if (tableExprPairs.size === 0) return

    const fetchLinkedRecords = async () => {
      setLoadingLinkedRecords(true)
      const results: Record<string, LinkedRecord[]> = {}
      await Promise.all(
        Array.from(tableExprPairs.entries()).map(async ([table, expression]) => {
          try {
            const params = new URLSearchParams({ table })
            if (expression) params.set("expression", expression)

            const res = await fetch(`/api/inputs/linked-records?${params.toString()}`)
            const data = await res.json()
            if (!cancelled && Array.isArray(data.records)) {
              results[table] = data.records
            }
          } catch {
            // silently fail
          }
        })
      )
      if (!cancelled) {
        setLinkedRecordsByTable(results)
        setLoadingLinkedRecords(false)
      }
    }

    fetchLinkedRecords()
    return () => { cancelled = true }
  }, [inputs, resolvedLinks, resolvedTableColumnPairs])

  const updateValue = useCallback((inputId: string, value: string | boolean) => {
    setFormValues((prev) => ({ ...prev, [inputId]: value }))
    userEditedRef.current.add(inputId)
  }, [])

  const userEditedRef = useRef<Set<string>>(new Set())
  const [computedFieldIds, setComputedFieldIds] = useState<Set<string>>(new Set())

  const { hiddenFields, requiredFields, computedValues } = useLogicEngine(
    formValues as Record<string, unknown>
  )

  useEffect(() => {
    const updates: Record<string, string | boolean> = {}
    const newComputed = new Set<string>()

    for (const [inputId, val] of Object.entries(computedValues)) {
      if (val === null || val === undefined) continue
      if (userEditedRef.current.has(inputId)) continue

      const strVal = typeof val === "boolean" ? val : String(val)
      if (formValues[inputId] !== strVal) {
        updates[inputId] = strVal
      }
      newComputed.add(inputId)
    }

    if (Object.keys(updates).length > 0) {
      setFormValues((prev) => ({ ...prev, ...updates }))
    }
    setComputedFieldIds(newComputed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedValues])

  const handleCreateDeal = useCallback(async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      for (const inputId of requiredFields) {
        if (hiddenFields.has(inputId)) continue
        const val = formValues[inputId]
        if (val === undefined || val === null || val === "" || val === false) {
          const label = inputs.find((i) => i.id === inputId)?.input_label ?? inputId
          setSubmitError(`"${label}" is required.`)
          setSubmitting(false)
          return
        }
      }

      const dealInputs = inputs.map((field) => {
        const raw = formValues[field.id]
        let value: string | number | boolean | null = null

        if (raw !== undefined && raw !== "") {
          switch (field.input_type) {
            case "currency":
            case "number":
            case "percentage": {
              const num = typeof raw === "string" ? Number(raw) : raw
              value = typeof num === "number" && !isNaN(num) ? num : null
              break
            }
            case "boolean":
              value = typeof raw === "boolean" ? raw : raw === "true"
              break
            case "text":
            case "dropdown":
            case "date":
            default:
              if (typeof raw === "string" && raw.trim().length > 0) {
                value = raw.trim()
              } else if (typeof raw === "boolean") {
                value = raw
              }
              break
          }
        }

        return {
          input_id: field.id,
          input_type: field.input_type,
          value,
        }
      })

      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_inputs: dealInputs }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Failed to create deal")
      }

      onClose()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("app:deals:changed"))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }, [formValues, inputs, onClose, requiredFields, hiddenFields])

  const inputsByCategory = categories.map((cat) => ({
    category: cat,
    fields: inputs
      .filter((inp) => inp.category_id === cat.id)
      .sort((a, b) => a.display_order - b.display_order),
  }))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Deal</h1>
          <p className="text-sm text-muted-foreground">
            Capture the core deal details and keep them organized.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {submitError && (
            <p className="text-sm text-destructive mr-2">{submitError}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={handleCreateDeal}
            disabled={submitting || loading}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Deal
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading form...
            </span>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No input categories configured yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set up categories and inputs in your organization settings.
            </p>
          </div>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={categories.filter((c) => c.default_open !== false).map((c) => String(c.id))}
            className="w-full space-y-4"
          >
            {inputsByCategory.map(({ category, fields }) => {
              const visibleFields = fields.filter((f) => !hiddenFields.has(f.id));
              if (visibleFields.length === 0) return null;
              return (
                <AccordionItem
                  key={category.id}
                  value={String(category.id)}
                  className="rounded-lg border bg-muted/30 shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                    <span>{category.category}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {visibleFields.map((field) => (
                        <DynamicInput
                          key={field.id}
                          field={field}
                          value={formValues[field.id] ?? (field.input_type === "boolean" ? false : "")}
                          onChange={(val) => updateValue(field.id, val)}
                          onRecordSelect={(code, recId) => {
                            setRecordIds((prev) => {
                              const key = `${code}_record_id`
                              if (prev[key] === (recId ?? undefined)) return prev
                              return { ...prev, [key]: recId ?? undefined }
                            })
                          }}
                          isRequired={requiredFields.has(field.id)}
                          isComputed={computedFieldIds.has(field.id)}
                          isLocked={lockedInputCodes.has(field.input_code)}
                          linkedRecords={(() => { const r = getResolvedLink(field.id); const t = r?.linked_table; return t ? (linkedRecordsByTable[t] ?? []) : []; })()}
                          loadingLinked={getResolvedLink(field.id) ? loadingLinkedRecords : false}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Dynamic Input Renderer                                                     */
/* -------------------------------------------------------------------------- */

function DynamicInput({
  field,
  value,
  onChange,
  onRecordSelect,
  isRequired = false,
  isComputed = false,
  isLocked = false,
  linkedRecords = [],
  loadingLinked = false,
}: {
  field: InputField
  value: string | boolean
  onChange: (value: string | boolean) => void
  onRecordSelect?: (inputCode: string, recordId: string | null) => void
  isRequired?: boolean
  isComputed?: boolean
  isLocked?: boolean
  linkedRecords?: LinkedRecord[]
  loadingLinked?: boolean
}) {
  const stringVal = typeof value === "string" ? value : ""
  const boolVal = typeof value === "boolean" ? value : false
  const computedClass = isComputed ? "ring-1 ring-blue-400/40 bg-blue-50/50 dark:bg-blue-950/20" : ""

  if (linkedRecords.length > 0 || loadingLinked) {
    return (
      <div className="space-y-2">
        <Label>
          {field.input_label}
          {isRequired && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {loadingLinked ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground py-2">
            <Loader2 className="size-3 animate-spin" />
            Loading...
          </div>
        ) : (
          <LinkedAutocompleteInput
            value={stringVal}
            onChange={(val) => onChange(val)}
            onRecordSelect={(rec) => onRecordSelect?.(field.input_code, rec?.id ?? null)}
            records={linkedRecords}
            placeholder={`Search ${field.input_label.toLowerCase()}...`}
            className={computedClass}
          />
        )}
      </div>
    )
  }

  switch (field.input_type) {
    case "text":
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.input_label}
            {isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <Input
            id={field.id}
            placeholder={field.input_label}
            value={stringVal}
            onChange={(e) => onChange(e.target.value)}
            className={computedClass}
          />
        </div>
      )

    case "dropdown": {
      return (
        <div className="space-y-2">
          <Label>
            {field.input_label}
            {isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <Select
            value={stringVal || undefined}
            onValueChange={(val) => onChange(val)}
          >
            <SelectTrigger className={computedClass}>
              <SelectValue placeholder={`Select ${field.input_label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.dropdown_options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    case "date":
      return (
        <div className="space-y-2">
          <Label>
            {field.input_label}
            {isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <div className={computedClass ? `rounded-md ${computedClass}` : ""}>
            <DatePickerField
              value={stringVal || ""}
              onChange={(val) => onChange(val)}
            />
          </div>
        </div>
      )

    case "currency":
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.input_label}
            {isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <CalcInput
              id={field.id}
              value={stringVal}
              onValueChange={(val) => onChange(val)}
              className={`pl-7 ${computedClass}`}
              placeholder="0.00"
            />
          </div>
        </div>
      )

    case "number":
      return (
        <div className="space-y-2">
          <Label>
            {field.input_label}
            {isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <NumberField
            value={stringVal ? Number(stringVal) : undefined}
            onChange={(val) => onChange(isNaN(val) ? "" : String(val))}
            minValue={0}
            className="w-full"
          >
            <Group className={`border-input data-focus-within:ring-ring relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors outline-none data-disabled:opacity-50 data-focus-within:ring-1 ${computedClass}`}>
              <AriaInput
                placeholder="0"
                className="placeholder:text-muted-foreground w-full grow bg-transparent px-3 py-1 text-base outline-none md:text-sm"
              />
              <AriaButton
                slot="decrement"
                className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
              >
                <MinusIcon className="size-4" />
                <span className="sr-only">Decrease</span>
              </AriaButton>
              <AriaButton
                slot="increment"
                className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
              >
                <PlusIcon className="size-4" />
                <span className="sr-only">Increase</span>
              </AriaButton>
            </Group>
          </NumberField>
        </div>
      )

    case "percentage":
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.input_label}
            {isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <div className="relative">
            <Input
              id={field.id}
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              min={0}
              max={100}
              step={0.01}
              value={stringVal}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === "") {
                  onChange("")
                  return
                }
                onChange(raw)
              }}
              onBlur={() => {
                if (stringVal === "") return
                const num = parseFloat(stringVal)
                if (isNaN(num)) {
                  onChange("")
                  return
                }
                const clamped = Math.min(100, Math.max(0, num))
                onChange(clamped.toFixed(2).replace(/\.?0+$/, "") || "0")
              }}
              className={`pr-8 ${computedClass}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>
      )

    case "boolean": {
      const boolDisplay = (field.config?.boolean_display as string) ?? "dropdown"

      if (boolDisplay === "switch") {
        return (
          <div className="space-y-2">
            <Label>
              {field.input_label}
              {isRequired && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={boolVal}
                onCheckedChange={(checked) => onChange(checked)}
              />
              <span className="text-sm text-muted-foreground">{boolVal ? "Yes" : "No"}</span>
            </div>
          </div>
        )
      }

      if (boolDisplay === "radio") {
        return (
          <div className="space-y-2">
            <Label>
              {field.input_label}
              {isRequired && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <RadioGroup
              value={boolVal ? "true" : "false"}
              onValueChange={(val) => onChange(val === "true")}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="true" id={`${field.id}-yes`} />
                <Label htmlFor={`${field.id}-yes`} className="text-sm">Yes</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="false" id={`${field.id}-no`} />
                <Label htmlFor={`${field.id}-no`} className="text-sm">No</Label>
              </div>
            </RadioGroup>
          </div>
        )
      }

      if (boolDisplay === "checkbox") {
        return (
          <div className="space-y-2">
            <Label>
              {field.input_label}
              {isRequired && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={boolVal}
                onCheckedChange={(checked) => onChange(!!checked)}
              />
              <Label className="text-sm">Yes</Label>
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-2">
          <Label>
            {field.input_label}
            {isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <Select
            value={boolVal ? "true" : "false"}
            onValueChange={(val) => onChange(val === "true")}
          >
            <SelectTrigger className={computedClass}>
              <SelectValue placeholder={`Select ${field.input_label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    default:
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.input_label}
            {isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <Input
            id={field.id}
            placeholder={field.input_label}
            value={stringVal}
            onChange={(e) => onChange(e.target.value)}
            className={computedClass}
          />
        </div>
      )
  }
}
