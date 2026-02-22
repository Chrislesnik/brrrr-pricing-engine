"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/shadcn/command";
import { cn } from "@repo/lib/cn";
import type {
  NumberConstraintsConfig,
  ConditionalConstraint,
  ConstraintCondition,
} from "@/types/number-constraints";

/* -------------------------------------------------------------------------- */
/*  Operator sets (same as pe-logic-builder-sheet)                             */
/* -------------------------------------------------------------------------- */

const COMMON_OPERATORS = [
  { value: "exists", label: "Exists" },
  { value: "does_not_exist", label: "Does Not Exist" },
  { value: "is_empty", label: "Is Empty" },
  { value: "is_not_empty", label: "Is Not Empty" },
  { value: "equals", label: "Is Equal To" },
  { value: "not_equals", label: "Is Not Equal To" },
];

const TEXT_OPERATORS = [
  ...COMMON_OPERATORS,
  { value: "contains", label: "Contains" },
  { value: "does_not_contain", label: "Does Not Contain" },
];

const NUMERIC_OPERATORS = [
  ...COMMON_OPERATORS,
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "greater_than_or_equal", label: "Greater or Equal" },
  { value: "less_than_or_equal", label: "Less or Equal" },
];

const VALUELESS_OPERATORS = new Set([
  "exists",
  "does_not_exist",
  "is_empty",
  "is_not_empty",
]);

function operatorsForType(inputType: string) {
  switch (inputType) {
    case "number":
    case "currency":
    case "percentage":
    case "calc_currency":
      return NUMERIC_OPERATORS;
    case "boolean":
      return COMMON_OPERATORS;
    default:
      return TEXT_OPERATORS;
  }
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AvailableInput {
  id: string;
  input_code: string;
  input_label: string;
  input_type: string;
  dropdown_options?: string[] | null;
}

interface NumberConstraintsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputLabel: string;
  initialConfig: NumberConstraintsConfig | null;
  availableInputs: AvailableInput[];
  onSave: (config: NumberConstraintsConfig) => void;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function emptyConfig(): NumberConstraintsConfig {
  return { min: null, max: null, step: null, conditional_constraints: [] };
}

function emptyRule(): ConditionalConstraint {
  return {
    id: crypto.randomUUID(),
    type: "AND",
    conditions: [{ field: "", operator: "", value: "" }],
    min: null,
    max: null,
  };
}

function emptyCondition(): ConstraintCondition {
  return { field: "", operator: "", value: "" };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function NumberConstraintsSheet({
  open,
  onOpenChange,
  inputLabel,
  initialConfig,
  availableInputs,
  onSave,
}: NumberConstraintsSheetProps) {
  const [config, setConfig] = useState<NumberConstraintsConfig>(
    () => initialConfig ?? emptyConfig(),
  );
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setConfig(initialConfig ?? emptyConfig());
    }
    prevOpenRef.current = open;
  }, [open, initialConfig]);

  const rules = config.conditional_constraints ?? [];

  /* ---- Mutators ---- */

  const setMin = (v: string) =>
    setConfig((p) => ({ ...p, min: v === "" ? null : Number(v) }));
  const setMax = (v: string) =>
    setConfig((p) => ({ ...p, max: v === "" ? null : Number(v) }));
  const setStep = (v: string) =>
    setConfig((p) => ({ ...p, step: v === "" ? null : Number(v) }));

  const updateRule = (idx: number, patch: Partial<ConditionalConstraint>) => {
    setConfig((p) => ({
      ...p,
      conditional_constraints: (p.conditional_constraints ?? []).map((r, i) =>
        i === idx ? { ...r, ...patch } : r,
      ),
    }));
  };

  const removeRule = (idx: number) => {
    setConfig((p) => ({
      ...p,
      conditional_constraints: (p.conditional_constraints ?? []).filter(
        (_, i) => i !== idx,
      ),
    }));
  };

  const addRule = () => {
    setConfig((p) => ({
      ...p,
      conditional_constraints: [...(p.conditional_constraints ?? []), emptyRule()],
    }));
  };

  const updateCondition = (
    ruleIdx: number,
    condIdx: number,
    patch: Partial<ConstraintCondition>,
  ) => {
    setConfig((p) => ({
      ...p,
      conditional_constraints: (p.conditional_constraints ?? []).map((r, ri) =>
        ri === ruleIdx
          ? {
              ...r,
              conditions: r.conditions.map((c, ci) =>
                ci === condIdx ? { ...c, ...patch } : c,
              ),
            }
          : r,
      ),
    }));
  };

  const addCondition = (ruleIdx: number) => {
    setConfig((p) => ({
      ...p,
      conditional_constraints: (p.conditional_constraints ?? []).map((r, ri) =>
        ri === ruleIdx
          ? { ...r, conditions: [...r.conditions, emptyCondition()] }
          : r,
      ),
    }));
  };

  const removeCondition = (ruleIdx: number, condIdx: number) => {
    setConfig((p) => ({
      ...p,
      conditional_constraints: (p.conditional_constraints ?? []).map((r, ri) =>
        ri === ruleIdx
          ? { ...r, conditions: r.conditions.filter((_, ci) => ci !== condIdx) }
          : r,
      ),
    }));
  };

  const handleSave = () => {
    const cleaned: NumberConstraintsConfig = {
      ...config,
      min: config.min != null && Number.isFinite(config.min) ? config.min : null,
      max: config.max != null && Number.isFinite(config.max) ? config.max : null,
      step: config.step != null && Number.isFinite(config.step) ? config.step : null,
      conditional_constraints: (config.conditional_constraints ?? []).filter(
        (r) => r.conditions.some((c) => c.field && c.operator),
      ),
    };
    onSave(cleaned);
    onOpenChange(false);
  };

  /* ---- Render ---- */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Configure Min / Max &mdash; {inputLabel}</SheetTitle>
          <SheetDescription>
            Set default constraints and optional conditional rules for this
            numeric input.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
          {/* Default constraints */}
          <section className="space-y-3">
            <Label className="text-sm font-semibold">Default Constraints</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Input
                  type="number"
                  value={config.min ?? ""}
                  onChange={(e) => setMin(e.target.value)}
                  placeholder="No min"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Input
                  type="number"
                  value={config.max ?? ""}
                  onChange={(e) => setMax(e.target.value)}
                  placeholder="No max"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Step</Label>
                <Input
                  type="number"
                  value={config.step ?? ""}
                  onChange={(e) => setStep(e.target.value)}
                  placeholder="1"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              These apply when no conditional rule matches. Leave blank for no
              constraint.
            </p>
          </section>

          {/* Conditional rules */}
          <section className="space-y-3">
            <Label className="text-sm font-semibold">
              Conditional Rules{" "}
              {rules.length > 0 && (
                <span className="font-normal text-muted-foreground">
                  ({rules.length})
                </span>
              )}
            </Label>
            <p className="text-[10px] text-muted-foreground">
              Rules are evaluated top-to-bottom. The first matching rule wins.
            </p>

            {rules.length === 0 && (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                No conditional rules. Add one to set min/max based on other
                inputs.
              </div>
            )}

            <div className="space-y-3">
              {rules.map((rule, ruleIdx) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  ruleIdx={ruleIdx}
                  availableInputs={availableInputs}
                  onUpdateRule={(patch) => updateRule(ruleIdx, patch)}
                  onRemoveRule={() => removeRule(ruleIdx)}
                  onUpdateCondition={(ci, patch) =>
                    updateCondition(ruleIdx, ci, patch)
                  }
                  onAddCondition={() => addCondition(ruleIdx)}
                  onRemoveCondition={(ci) => removeCondition(ruleIdx, ci)}
                />
              ))}
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={addRule}>
              <Plus className="size-3.5 mr-1.5" />
              Add Rule
            </Button>
          </section>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  Rule card                                                                  */
/* -------------------------------------------------------------------------- */

function RuleCard({
  rule,
  ruleIdx,
  availableInputs,
  onUpdateRule,
  onRemoveRule,
  onUpdateCondition,
  onAddCondition,
  onRemoveCondition,
}: {
  rule: ConditionalConstraint;
  ruleIdx: number;
  availableInputs: AvailableInput[];
  onUpdateRule: (patch: Partial<ConditionalConstraint>) => void;
  onRemoveRule: () => void;
  onUpdateCondition: (ci: number, patch: Partial<ConstraintCondition>) => void;
  onAddCondition: () => void;
  onRemoveCondition: (ci: number) => void;
}) {
  return (
    <div className="rounded-md border bg-card p-3 space-y-3">
      {/* Header with AND/OR toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Rule {ruleIdx + 1}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className={`text-[10px] px-2 py-0.5 rounded border ${
                rule.type === "AND"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-muted"
              }`}
              onClick={() => onUpdateRule({ type: "AND" })}
            >
              AND
            </button>
            <button
              type="button"
              className={`text-[10px] px-2 py-0.5 rounded border ${
                rule.type === "OR"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-muted"
              }`}
              onClick={() => onUpdateRule({ type: "OR" })}
            >
              OR
            </button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-destructive"
          onClick={onRemoveRule}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          When
        </Label>
        {rule.conditions.map((cond, ci) => (
          <div key={ci}>
            {ci > 0 && (
              <div className="py-0.5">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {rule.type}
                </span>
              </div>
            )}
            <ConditionRow
              condition={cond}
              availableInputs={availableInputs}
              onUpdate={(patch) => onUpdateCondition(ci, patch)}
              onRemove={
                rule.conditions.length > 1 ? () => onRemoveCondition(ci) : undefined
              }
            />
          </div>
        ))}
        <button
          type="button"
          className="text-[10px] text-muted-foreground hover:text-foreground"
          onClick={onAddCondition}
        >
          + Add condition
        </button>
      </div>

      {/* Then: min/max */}
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Then constrain to
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Min</Label>
            <Input
              type="number"
              value={rule.min ?? ""}
              onChange={(e) =>
                onUpdateRule({
                  min: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="No min"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Max</Label>
            <Input
              type="number"
              value={rule.max ?? ""}
              onChange={(e) =>
                onUpdateRule({
                  max: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="No max"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Condition row                                                              */
/* -------------------------------------------------------------------------- */

function ConditionRow({
  condition,
  availableInputs,
  onUpdate,
  onRemove,
}: {
  condition: ConstraintCondition;
  availableInputs: AvailableInput[];
  onUpdate: (patch: Partial<ConstraintCondition>) => void;
  onRemove?: () => void;
}) {
  const [fieldOpen, setFieldOpen] = useState(false);

  const selectedInput = availableInputs.find(
    (i) => i.id === condition.field || i.input_code === condition.field,
  );
  const operators = selectedInput
    ? operatorsForType(selectedInput.input_type)
    : COMMON_OPERATORS;
  const needsValue = condition.operator && !VALUELESS_OPERATORS.has(condition.operator);
  const isDropdownField =
    selectedInput?.input_type === "dropdown" || selectedInput?.input_type === "boolean";
  const dropdownOpts =
    selectedInput?.input_type === "boolean"
      ? ["Yes", "No"]
      : selectedInput?.dropdown_options ?? [];

  return (
    <div className="flex items-start gap-1.5">
      {/* Field (searchable combobox) */}
      <Popover open={fieldOpen} onOpenChange={setFieldOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={fieldOpen}
            className="h-8 text-xs flex-1 min-w-0 justify-between font-normal"
          >
            <span className={cn("truncate", !selectedInput && "text-muted-foreground")}>
              {selectedInput?.input_label || "Field..."}
            </span>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandInput placeholder="Search fields..." className="text-xs" />
            <CommandList className="max-h-48 overflow-y-auto">
              <CommandEmpty>No fields found.</CommandEmpty>
              <CommandGroup>
                {availableInputs.map((inp) => (
                  <CommandItem
                    key={inp.id}
                    value={inp.input_label}
                    onSelect={() => {
                      onUpdate({ field: inp.id, operator: "", value: "" });
                      setFieldOpen(false);
                    }}
                    className="text-xs"
                  >
                    {condition.field === inp.id && (
                      <Check className="mr-1.5 h-3 w-3 shrink-0" />
                    )}
                    {inp.input_label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Operator */}
      <Select
        value={condition.operator || undefined}
        onValueChange={(v) => {
          if (VALUELESS_OPERATORS.has(v)) {
            onUpdate({ operator: v, value: "" });
          } else {
            onUpdate({ operator: v });
          }
        }}
      >
        <SelectTrigger className="h-8 text-xs w-[140px] shrink-0">
          <SelectValue placeholder="Operator..." />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value */}
      {needsValue &&
        (isDropdownField ? (
          <Select
            value={condition.value || undefined}
            onValueChange={(v) => onUpdate({ value: v })}
          >
            <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
              <SelectValue placeholder="Value..." />
            </SelectTrigger>
            <SelectContent>
              {dropdownOpts.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={condition.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="Value..."
            className="h-8 text-xs flex-1 min-w-0"
          />
        ))}

      {/* Remove */}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 text-muted-foreground hover:text-destructive mt-0.5"
          onClick={onRemove}
        >
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  );
}
