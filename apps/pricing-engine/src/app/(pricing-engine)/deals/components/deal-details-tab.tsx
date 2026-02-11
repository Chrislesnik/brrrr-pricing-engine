"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button as AriaButton,
  Group,
  Input as AriaInput,
  NumberField,
} from "react-aria-components";
import { Loader2, MinusIcon, PlusIcon, Pencil, Save, X } from "lucide-react";
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
  organization_id: string;
  display_order: number;
  created_at: string;
}

interface InputField {
  id: string;
  category_id: number;
  category: string;
  input_label: string;
  input_type: string;
  dropdown_options: string[] | null;
  starred: boolean;
  organization_id: string;
  display_order: number;
  created_at: string;
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
  return new Date(date).toLocaleDateString();
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

  // Interleave categories into two columns: odd indices → left, even indices → right
  // This reads left-to-right (1→left, 2→right, 3→left…) while each column stacks independently
  const leftCategories = inputsByCategory.filter((_, i) => i % 2 === 0);
  const rightCategories = inputsByCategory.filter((_, i) => i % 2 === 1);

  const updateValue = useCallback((inputId: string, value: unknown) => {
    setEditedValues((prev) => ({ ...prev, [inputId]: value }));
  }, []);

  // Build the changed values diff for save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Build a payload of { [input_id]: value } for changed values
      const payload: Record<string, unknown> = {};
      for (const [inputId, value] of Object.entries(editedValues)) {
        const original = deal.inputs?.[inputId];
        // Include if changed (simple equality check, or always send all for safety)
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
  }, [deal, editedValues]);

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
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b last:border-0">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="col-span-2 text-sm">{value}</div>
    </div>
  );

  /** Render a value for read mode based on input_type */
  const renderReadValue = (field: InputField, rawValue: unknown): React.ReactNode => {
    if (rawValue === null || rawValue === undefined || rawValue === "") return "—";

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

      case "boolean":
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

  const allCategoryIds = inputsByCategory.map(({ category }) =>
    String(category.id)
  );

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

      {/* Two independent columns so items stack tightly without row-height gaps */}
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

            {leftCategories.map(({ category, fields }) => (
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
                    {fields.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No inputs in this category.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {fields.map((field) => {
                          const rawValue = editedValues[field.id] ?? null;
                          if (!isEditing) {
                            return (
                              <DetailRow
                                key={field.id}
                                label={field.input_label}
                                value={renderReadValue(field, rawValue)}
                              />
                            );
                          }
                          return (
                            <div
                              key={field.id}
                              className="grid grid-cols-3 gap-4 py-2 border-b last:border-0"
                            >
                              <div className="text-sm font-medium text-muted-foreground">
                                {field.input_label}
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
            ))}
          </div>

          {/* Right column: even-indexed categories */}
          <div className="flex flex-col gap-4">
            {rightCategories.map(({ category, fields }) => (
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
                    {fields.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No inputs in this category.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {fields.map((field) => {
                          const rawValue = editedValues[field.id] ?? null;
                          if (!isEditing) {
                            return (
                              <DetailRow
                                key={field.id}
                                label={field.input_label}
                                value={renderReadValue(field, rawValue)}
                              />
                            );
                          }
                          return (
                            <div
                              key={field.id}
                              className="grid grid-cols-3 gap-4 py-2 border-b last:border-0"
                            >
                              <div className="text-sm font-medium text-muted-foreground">
                                {field.input_label}
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
