"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Button as AriaButton,
  Group,
  Input as AriaInput,
  NumberField,
} from "react-aria-components";
import { Loader2, MinusIcon, PlusIcon, Pencil, Save, X, Link2 } from "lucide-react";
import { useLogicEngine } from "@/hooks/use-logic-engine";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/shadcn/accordion";
import { toast } from "@/hooks/use-toast";
import { DatePickerField } from "@/components/date-picker-field";
import { CalcInput } from "@/components/calc-input";
import { LinkedAutocompleteInput } from "@/components/linked-autocomplete-input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@repo/ui/shadcn/label";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DealData {
  id: string;
  inputs: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface InputCategory {
  id: number;
  category: string;
  display_order: number;
  created_at: string;
  default_open?: boolean;
}

interface InputField {
  id: string;
  category_id: number;
  category: string;
  input_label: string;
  input_type: string;
  dropdown_options: string[] | null;
  config?: Record<string, unknown> | null;
  starred: boolean;
  display_order: number;
  created_at: string;
  linked_table?: string | null;
  linked_column?: string | null;
}

interface LinkedRecord {
  id: string;
  label: string;
}

interface DealDetailsTabProps {
  deal: DealData;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatCurrency = (amount: unknown) => {
  if (amount === null || amount === undefined) return "—";
  const num = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
};

const formatDate = (date: unknown) => {
  if (!date || typeof date !== "string") return "—";
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Date(year, month - 1, day).toLocaleDateString();
};

const formatEnum = (value: unknown) => {
  if (!value || typeof value !== "string") return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function DealDetailsTab({ deal }: DealDetailsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<InputCategory[]>([]);
  const [inputFields, setInputFields] = useState<InputField[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  // Editable values: keyed by input_id
  const [editedValues, setEditedValues] = useState<Record<string, unknown>>({});

  // Linked records per table: { table_name: LinkedRecord[] }
  const [linkedRecordsByTable, setLinkedRecordsByTable] = useState<Record<string, LinkedRecord[]>>({});
  const [loadingLinkedRecords, setLoadingLinkedRecords] = useState(false);

  // Sync editable values from the deal prop
  useEffect(() => {
    setEditedValues(deal.inputs ?? {});
  }, [deal]);

  // Fetch input-categories + inputs metadata on mount
  useEffect(() => {
    let cancelled = false;
    const fetchMeta = async () => {
      setMetaLoading(true);
      try {
        const [catsRes, inputsRes] = await Promise.all([
          fetch("/api/input-categories"),
          fetch("/api/inputs"),
        ]);
        const catsJson = await catsRes.json().catch(() => []);
        const inputsJson = await inputsRes.json().catch(() => []);
        if (cancelled) return;

        setCategories(
          (Array.isArray(catsJson) ? catsJson : []).sort(
            (a: InputCategory, b: InputCategory) => a.display_order - b.display_order
          )
        );
        setInputFields(Array.isArray(inputsJson) ? inputsJson : []);
      } catch {
        if (!cancelled) {
          setCategories([]);
          setInputFields([]);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    };

    fetchMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch linked records for all linked tables used by inputs
  // This endpoint now applies org + role scoping server-side
  useEffect(() => {
    if (!deal.id || inputFields.length === 0) return;
    let cancelled = false;

    // Collect unique table + column combos needed
    const linkedInputs = inputFields.filter((f) => f.linked_table);
    if (linkedInputs.length === 0) return;

    const tableColumnPairs = new Map<string, string | null>();
    for (const inp of linkedInputs) {
      if (!tableColumnPairs.has(inp.linked_table!)) {
        tableColumnPairs.set(inp.linked_table!, inp.linked_column ?? null);
      }
    }

    const fetchLinkedRecords = async () => {
      setLoadingLinkedRecords(true);
      const results: Record<string, LinkedRecord[]> = {};
      await Promise.all(
        Array.from(tableColumnPairs.entries()).map(async ([table, column]) => {
          try {
            const params = new URLSearchParams({
              deal_id: deal.id,
              table,
            });
            if (column) params.set("expression", column);

            const res = await fetch(`/api/inputs/linked-records?${params.toString()}`);
            const data = await res.json();
            if (!cancelled && Array.isArray(data.records)) {
              results[table] = data.records;
            }
          } catch {
            // silently fail
          }
        })
      );
      if (!cancelled) {
        setLinkedRecordsByTable(results);
        setLoadingLinkedRecords(false);
      }
    };

    fetchLinkedRecords();
    return () => {
      cancelled = true;
    };
  }, [deal.id, inputFields]);

  // Group inputs by category_id
  const inputsByCategory = useMemo(
    () =>
      categories.map((cat) => ({
        category: cat,
        fields: inputFields
          .filter((inp) => inp.category_id === cat.id)
          .sort((a, b) => a.display_order - b.display_order),
      })),
    [categories, inputFields]
  );

  // Interleave categories into two columns
  const leftCategories = inputsByCategory.filter((_, i) => i % 2 === 0);
  const rightCategories = inputsByCategory.filter((_, i) => i % 2 === 1);

  const updateValue = useCallback((inputId: string, value: unknown) => {
    setEditedValues((prev) => ({ ...prev, [inputId]: value }));
    userEditedRef.current.add(inputId);
  }, []);

  // Track user-edited fields to avoid overwriting with computed values
  const userEditedRef = useRef<Set<string>>(new Set());
  const [computedFieldIds, setComputedFieldIds] = useState<Set<string>>(new Set());

  // Logic engine — evaluate rules against current values (including SQL conditions)
  const { hiddenFields, requiredFields, computedValues, evaluating } = useLogicEngine(
    editedValues,
    undefined,
    deal.id
  );

  // Apply computed values (unless user manually edited them)
  useEffect(() => {
    const updates: Record<string, unknown> = {};
    const newComputed = new Set<string>();

    for (const [inputId, val] of Object.entries(computedValues)) {
      if (val === null || val === undefined) continue;
      if (userEditedRef.current.has(inputId)) continue;

      if (editedValues[inputId] !== val) {
        updates[inputId] = val;
      }
      newComputed.add(inputId);
    }

    if (Object.keys(updates).length > 0) {
      setEditedValues((prev) => ({ ...prev, ...updates }));
    }
    setComputedFieldIds(newComputed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedValues]);

  // Reset user-edited tracking when editing starts/stops
  useEffect(() => {
    if (!isEditing) {
      userEditedRef.current = new Set();
    }
  }, [isEditing]);

  // Build the changed values diff for save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Validate required fields
      for (const inputId of requiredFields) {
        if (hiddenFields.has(inputId)) continue;
        const val = editedValues[inputId];
        if (val === undefined || val === null || val === "" || val === false) {
          const label = inputFields.find((f) => f.id === inputId)?.input_label ?? inputId;
          toast({
            title: "Required field",
            description: `"${label}" is required.`,
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }

      // Build a payload of { [input_id]: value } for changed values
      const payload: Record<string, unknown> = {};
      for (const [inputId, value] of Object.entries(editedValues)) {
        const original = deal.inputs?.[inputId];
        if (value !== original) {
          payload[inputId] = value;
        }
      }

      if (Object.keys(payload).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were detected.",
        });
        setIsEditing(false);
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update deal");
      }

      toast({
        title: "Deal updated",
        description: "Your changes have been saved successfully.",
      });

      setIsEditing(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("app:deals:changed"));
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update deal",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [deal, editedValues, requiredFields, hiddenFields, inputFields]);

  const handleCancel = () => {
    setEditedValues(deal.inputs ?? {});
    setIsEditing(false);
  };

  /* -------------------------------------------------------------------------- */
  /*  Display helpers                                                            */
  /* -------------------------------------------------------------------------- */

  const DetailRow = ({
    label,
    value,
    isRequired: reqd = false,
    isComputed: comp = false,
  }: {
    label: string;
    value: React.ReactNode;
    isRequired?: boolean;
    isComputed?: boolean;
  }) => (
    <div className={`grid grid-cols-3 gap-4 py-2 border-b last:border-0 ${comp ? "bg-blue-50/50 dark:bg-blue-950/20 rounded-md px-2 -mx-2" : ""}`}>
      <div className="text-sm font-medium text-muted-foreground">
        {label}
        {reqd && <span className="ml-1 text-destructive">*</span>}
      </div>
      <div className="col-span-2 text-sm">{value}</div>
    </div>
  );

  /** Render a value for read mode based on input_type */
  const renderReadValue = (field: InputField, rawValue: unknown): React.ReactNode => {
    if (rawValue === null || rawValue === undefined || rawValue === "") return "—";

    // For linked inputs, show the record label instead of the raw PK
    if (field.linked_table) {
      const records = linkedRecordsByTable[field.linked_table] ?? [];
      const match = records.find((r) => r.id === String(rawValue));
      if (match) return match.label;
      // Fall back to PK display if no match
      return String(rawValue);
    }

    switch (field.input_type) {
      case "currency":
        return formatCurrency(rawValue);
      case "percentage":
        return `${rawValue}%`;
      case "number":
        return String(rawValue);
      case "date":
        return formatDate(rawValue);
      case "boolean":
        return rawValue === true ? "Yes" : rawValue === false ? "No" : "—";
      case "dropdown":
        return formatEnum(rawValue);
      case "text":
      default:
        return String(rawValue);
    }
  };

  /** Render an edit control based on input_type */
  const renderEditControl = (field: InputField, rawValue: unknown) => {
    // For linked inputs: render a searchable text input with autocomplete from linked records
    if (field.linked_table) {
      const records = linkedRecordsByTable[field.linked_table] ?? [];
      const currentVal = rawValue !== null && rawValue !== undefined ? String(rawValue) : "";

      if (loadingLinkedRecords) {
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground py-2">
            <Loader2 className="size-3 animate-spin" />
            Loading options...
          </div>
        );
      }

      return (
        <LinkedAutocompleteInput
          value={currentVal}
          onChange={(val) => updateValue(field.id, val)}
          records={records}
          placeholder={`Search ${field.linked_table.replace(/_/g, " ")}...`}
          className="text-sm"
        />
      );
    }

    // Standard input types
    const stringVal =
      rawValue !== null && rawValue !== undefined ? String(rawValue) : "";
    const boolVal = typeof rawValue === "boolean" ? rawValue : false;

    switch (field.input_type) {
      case "text":
        return (
          <Input
            value={stringVal}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={field.input_label}
            className="text-sm"
          />
        );

      case "dropdown":
        return (
          <Select
            value={stringVal || undefined}
            onValueChange={(val) => updateValue(field.id, val)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder={`Select...`} />
            </SelectTrigger>
            <SelectContent>
              {(field.dropdown_options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <DatePickerField
            value={stringVal}
            onChange={(val) => updateValue(field.id, val)}
          />
        );

      case "currency":
        return (
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <CalcInput
              id={field.id}
              value={stringVal}
              onValueChange={(val) => updateValue(field.id, val)}
              className="pl-7 text-sm"
              placeholder="0.00"
            />
          </div>
        );

      case "number":
        return (
          <NumberField
            value={stringVal ? Number(stringVal) : undefined}
            onChange={(val) =>
              updateValue(field.id, isNaN(val) ? null : val)
            }
            minValue={0}
            className="w-full"
          >
            <Group className="border-input data-focus-within:ring-ring relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors outline-none data-disabled:opacity-50 data-focus-within:ring-1">
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
        );

      case "percentage":
        return (
          <div className="relative">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              min={0}
              max={100}
              step={0.01}
              value={stringVal}
              onChange={(e) => {
                const raw = e.target.value;
                updateValue(field.id, raw === "" ? null : raw);
              }}
              onBlur={() => {
                if (stringVal === "") return;
                const num = parseFloat(stringVal);
                if (isNaN(num)) {
                  updateValue(field.id, null);
                  return;
                }
                const clamped = Math.min(100, Math.max(0, num));
                updateValue(
                  field.id,
                  clamped.toFixed(2).replace(/\.?0+$/, "") || "0"
                );
              }}
              className="pr-8 text-sm"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        );

      case "boolean": {
        const boolDisplay = (field.config?.boolean_display as string) ?? "dropdown";

        if (boolDisplay === "switch") {
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={boolVal}
                onCheckedChange={(checked) => updateValue(field.id, checked)}
              />
              <span className="text-sm text-muted-foreground">{boolVal ? "Yes" : "No"}</span>
            </div>
          );
        }

        if (boolDisplay === "radio") {
          return (
            <RadioGroup
              value={boolVal ? "true" : "false"}
              onValueChange={(val) => updateValue(field.id, val === "true")}
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
          );
        }

        if (boolDisplay === "checkbox") {
          return (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={boolVal}
                onCheckedChange={(checked) => updateValue(field.id, !!checked)}
              />
              <Label className="text-sm">Yes</Label>
            </div>
          );
        }

        return (
          <Select
            value={boolVal ? "true" : "false"}
            onValueChange={(val) => updateValue(field.id, val === "true")}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      }

      default:
        return (
          <Input
            value={stringVal}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={field.input_label}
            className="text-sm"
          />
        );
    }
  };

  /* -------------------------------------------------------------------------- */
  /*  Render                                                                     */
  /* -------------------------------------------------------------------------- */

  if (metaLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading deal details...
        </span>
      </div>
    );
  }

  const allCategoryIds = inputsByCategory
    .filter(({ category }) => category.default_open !== false)
    .map(({ category }) => String(category.id));

  /** Render a category column */
  const renderCategory = ({ category, fields }: { category: InputCategory; fields: InputField[] }) => {
    const visibleFields = fields.filter((f) => !hiddenFields.has(f.id));
    return (
      <Accordion
        key={category.id}
        type="multiple"
        defaultValue={allCategoryIds}
        className="w-full"
      >
        <AccordionItem
          value={String(category.id)}
          className="rounded-lg border bg-muted/30 shadow-sm"
        >
          <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
            <span>{category.category}</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0">
            {visibleFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No inputs in this category.
              </p>
            ) : (
              <div className="space-y-1">
                {visibleFields.map((field) => {
                  const rawValue = editedValues[field.id] ?? null;
                  const reqd = requiredFields.has(field.id);
                  const comp = computedFieldIds.has(field.id);
                  const isLinked = Boolean(field.linked_table);
                  if (!isEditing) {
                    return (
                      <DetailRow
                        key={field.id}
                        label={field.input_label}
                        value={renderReadValue(field, rawValue)}
                        isRequired={reqd}
                        isComputed={comp}
                      />
                    );
                  }
                  return (
                    <div
                      key={field.id}
                      className={`grid grid-cols-3 gap-4 py-2 border-b last:border-0 ${comp ? "bg-blue-50/50 dark:bg-blue-950/20 rounded-md px-2 -mx-2" : ""} ${isLinked ? "bg-indigo-50/50 dark:bg-indigo-950/20 rounded-md px-2 -mx-2" : ""}`}
                    >
                      <div className="text-sm font-medium text-muted-foreground">
                        {field.input_label}
                        {reqd && <span className="ml-1 text-destructive">*</span>}
                        {isLinked && <Link2 className="inline size-3 ml-1 text-indigo-500" />}
                      </div>
                      <div className="col-span-2">
                        {renderEditControl(field, rawValue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Deal Information</h2>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Edit deal details"
              : "Complete deal details across all categories"}
          </p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Details
          </Button>
        )}
      </div>

      {/* Two independent columns */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No input categories configured yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set up categories and inputs in your organization settings.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left column: Deal ID + odd-indexed categories */}
          <div className="flex flex-col gap-4">
            {/* Deal ID */}
            <div className="rounded-lg border bg-muted/30 shadow-sm px-4 py-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">
                  Deal ID
                </div>
                <div className="col-span-2 text-sm font-mono">{deal.id}</div>
              </div>
            </div>

            {leftCategories.map(renderCategory)}
          </div>

          {/* Right column: even-indexed categories */}
          <div className="flex flex-col gap-4">
            {rightCategories.map(renderCategory)}
          </div>
        </div>
      )}
    </div>
  );
}
