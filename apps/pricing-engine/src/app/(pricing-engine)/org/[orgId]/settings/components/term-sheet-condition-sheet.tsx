"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Button as AriaButton,
  Group,
  Input as AriaInput,
  NumberField,
} from "react-aria-components";
import {
  Loader2,
  Plus,
  X,
  MoreVertical,
  Type,
  Grid2x2,
  Sigma,
  MinusIcon,
  PlusIcon,
  ChevronsUpDown,
  Trash2,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
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
import { DatePickerField } from "@/components/date-picker-field";
import { CalcInput } from "@/components/calc-input";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface InputField {
  id: string;
  input_label: string;
  input_type: string;
  category: string;
  dropdown_options?: string[] | null;
}

type ConditionValueType = "value" | "field" | "expression";

interface Condition {
  field: string;
  operator: string;
  value: string;
  value_type: ConditionValueType;
  value_field?: string;
  value_expression?: string;
}

interface RuleGroup {
  logic_type: "AND" | "OR";
  conditions: Condition[];
}

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
  { value: "greater_than", label: "Is Greater Than" },
  { value: "less_than", label: "Is Less Than" },
  { value: "greater_than_or_equal", label: "Is Greater Than or Equal To" },
  { value: "less_than_or_equal", label: "Is Less Than or Equal To" },
];

const DATE_OPERATORS = [
  ...COMMON_OPERATORS,
  { value: "is_after", label: "Is After" },
  { value: "is_before", label: "Is Before" },
];

const BOOLEAN_OPERATORS = [
  ...COMMON_OPERATORS,
  { value: "is_true", label: "Is True" },
  { value: "is_false", label: "Is False" },
];

const VALUELESS_OPERATORS = new Set([
  "exists", "does_not_exist", "is_empty", "is_not_empty", "is_true", "is_false",
]);

function getOperatorsForType(inputType?: string) {
  switch (inputType) {
    case "text":
    case "dropdown":
      return TEXT_OPERATORS;
    case "number":
    case "currency":
    case "percentage":
      return NUMERIC_OPERATORS;
    case "date":
      return DATE_OPERATORS;
    case "boolean":
      return BOOLEAN_OPERATORS;
    default:
      return COMMON_OPERATORS;
  }
}

const CONDITION_VALUE_TYPE_OPTIONS: {
  value: ConditionValueType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "value", label: "Value", icon: Type },
  { value: "field", label: "Field", icon: Grid2x2 },
  { value: "expression", label: "Expression", icon: Sigma },
];

function defaultCondition(): Condition {
  return { field: "", operator: "", value: "", value_type: "value" };
}

function defaultRuleGroup(): RuleGroup {
  return { logic_type: "AND", conditions: [] };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function TermSheetConditionSheet({
  open,
  onOpenChange,
  peTermSheetId,
  templateName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peTermSheetId: string;
  templateName: string;
}) {
  const [inputs, setInputs] = useState<InputField[]>([]);
  const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [inputsRes, condRes] = await Promise.all([
          fetch("/api/pricing-engine-inputs"),
          fetch(`/api/pe-term-sheet-conditions?pe_term_sheet_id=${peTermSheetId}`),
        ]);
        const inputsJson = await inputsRes.json().catch(() => []);
        const condJson = await condRes.json().catch(() => ({ rules: [] }));

        if (!cancelled) {
          setInputs(Array.isArray(inputsJson) ? inputsJson : []);
          const rules = Array.isArray(condJson.rules) ? condJson.rules : [];
          setRuleGroups(
            rules.length > 0
              ? rules.map((r: RuleGroup) => ({
                  logic_type: r.logic_type || "AND",
                  conditions: Array.isArray(r.conditions)
                    ? r.conditions.map((c: Condition) => ({
                        ...c,
                        value_type: c.value_type || "value",
                      }))
                    : [],
                }))
              : []
          );
        }
      } catch {
        if (!cancelled) {
          setInputs([]);
          setRuleGroups([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [open, peTermSheetId]);

  useEffect(() => {
    if (!open) {
      setRuleGroups([]);
      setSubmitError(null);
    }
  }, [open]);

  const inputMap = useMemo(() => {
    const m = new Map<string, InputField>();
    for (const inp of inputs) m.set(inp.id, inp);
    return m;
  }, [inputs]);

  const addRuleGroup = useCallback(() => {
    setRuleGroups((prev) => [...prev, defaultRuleGroup()]);
  }, []);

  const removeRuleGroup = useCallback((ruleIdx: number) => {
    setRuleGroups((prev) => prev.filter((_, i) => i !== ruleIdx));
  }, []);

  const setRuleLogicType = useCallback((ruleIdx: number, lt: "AND" | "OR") => {
    setRuleGroups((prev) =>
      prev.map((r, i) => (i === ruleIdx ? { ...r, logic_type: lt } : r))
    );
  }, []);

  const addCondition = useCallback((ruleIdx: number) => {
    setRuleGroups((prev) =>
      prev.map((r, i) =>
        i === ruleIdx
          ? { ...r, conditions: [...r.conditions, defaultCondition()] }
          : r
      )
    );
  }, []);

  const removeCondition = useCallback((ruleIdx: number, condIdx: number) => {
    setRuleGroups((prev) =>
      prev.map((r, i) =>
        i === ruleIdx
          ? { ...r, conditions: r.conditions.filter((_, ci) => ci !== condIdx) }
          : r
      )
    );
  }, []);

  const updateCondition = useCallback(
    (ruleIdx: number, condIdx: number, field: keyof Condition, value: string) => {
      setRuleGroups((prev) =>
        prev.map((r, i) =>
          i === ruleIdx
            ? {
                ...r,
                conditions: r.conditions.map((c, ci) =>
                  ci === condIdx ? { ...c, [field]: value } : c
                ),
              }
            : r
        )
      );
    },
    []
  );

  const setConditionValueType = useCallback(
    (ruleIdx: number, condIdx: number, vt: ConditionValueType) => {
      setRuleGroups((prev) =>
        prev.map((r, i) =>
          i === ruleIdx
            ? {
                ...r,
                conditions: r.conditions.map((c, ci) => {
                  if (ci !== condIdx) return c;
                  return {
                    ...c,
                    value_type: vt,
                    value: vt === "value" ? c.value : "",
                    value_field: vt === "field" ? (c.value_field ?? "") : undefined,
                    value_expression: vt === "expression" ? (c.value_expression ?? "") : undefined,
                  };
                }),
              }
            : r
        )
      );
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/pe-term-sheet-conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pe_term_sheet_id: peTermSheetId,
          rules: ruleGroups,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to save conditions");
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }, [peTermSheetId, ruleGroups, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Term Sheet Conditions — {templateName}</SheetTitle>
          <SheetDescription>
            Define when this term sheet template should be used. Add rule groups with conditions based on pricing engine inputs.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {ruleGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">No rule groups yet.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Term sheets with no conditions will always be available.
                  </p>
                </div>
              ) : (
                ruleGroups.map((rule, ruleIdx) => (
                  <div
                    key={ruleIdx}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Rule Group {ruleIdx + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">— Match</span>
                        <Select
                          value={rule.logic_type}
                          onValueChange={(val) => setRuleLogicType(ruleIdx, val as "AND" | "OR")}
                        >
                          <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">ALL</SelectItem>
                            <SelectItem value="OR">ANY</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">of the following</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeRuleGroup(ruleIdx)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {rule.conditions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center rounded-md border border-dashed">
                        <p className="text-xs text-muted-foreground">No conditions in this rule group.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rule.conditions.map((cond, condIdx) => (
                          <ConditionRow
                            key={condIdx}
                            cond={cond}
                            ruleIndex={ruleIdx}
                            condIndex={condIdx}
                            inputs={inputs}
                            inputMap={inputMap}
                            updateCondition={updateCondition}
                            setConditionValueType={setConditionValueType}
                            removeCondition={removeCondition}
                          />
                        ))}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addCondition(ruleIdx)}
                    >
                      <Plus className="size-4 mr-1.5" />
                      Add Condition
                    </Button>
                  </div>
                ))
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addRuleGroup}
              >
                <Plus className="size-4 mr-1.5" />
                Add Rule Group
              </Button>
            </div>
          )}
        </div>

        <SheetFooter className="mt-4 flex-col gap-2">
          {submitError && (
            <p className="text-sm text-destructive text-center w-full">{submitError}</p>
          )}
          <div className="flex gap-2 justify-end w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Conditions
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  SearchableInputSelect                                                      */
/* -------------------------------------------------------------------------- */

function SearchableInputSelect({
  inputs,
  value,
  onValueChange,
  placeholder = "Select field",
}: {
  inputs: InputField[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = inputs.find((inp) => inp.id === value)?.input_label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-9 text-sm"
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {inputs.map((inp) => (
                <CommandItem
                  key={inp.id}
                  value={inp.input_label}
                  onSelect={() => { onValueChange(inp.id); setOpen(false); }}
                >
                  {inp.input_label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/*  ConditionRow                                                               */
/* -------------------------------------------------------------------------- */

function ConditionRow({
  cond,
  ruleIndex,
  condIndex,
  inputs,
  inputMap,
  updateCondition,
  setConditionValueType,
  removeCondition,
}: {
  cond: Condition;
  ruleIndex: number;
  condIndex: number;
  inputs: InputField[];
  inputMap: Map<string, InputField>;
  updateCondition: (ruleIdx: number, condIdx: number, field: keyof Condition, value: string) => void;
  setConditionValueType: (ruleIdx: number, condIdx: number, vt: ConditionValueType) => void;
  removeCondition: (ruleIdx: number, condIdx: number) => void;
}) {
  const fieldInput = cond.field ? inputMap.get(cond.field) : undefined;
  const fieldType = fieldInput?.input_type;
  const vt = cond.value_type || "value";
  const operators = getOperatorsForType(fieldType);
  const isValueless = VALUELESS_OPERATORS.has(cond.operator);

  const valueTypeLabel =
    CONDITION_VALUE_TYPE_OPTIONS.find((o) => o.value === vt)?.label ?? "Value";

  const threeDotButton = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors z-10"
          title={`Type: ${valueTypeLabel}`}
        >
          <MoreVertical className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1" sideOffset={4}>
        <div className="flex flex-col">
          {CONDITION_VALUE_TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = vt === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-muted transition-colors w-full text-left ${
                  isActive ? "bg-muted font-medium" : "text-muted-foreground"
                }`}
                onClick={() => setConditionValueType(ruleIndex, condIndex, opt.value)}
              >
                <Icon className="size-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );

  const renderConditionValue = () => {
    if (isValueless) return null;

    if (vt === "field") {
      return (
        <div className="relative flex-1">
          <SearchableInputSelect
            inputs={inputs}
            value={cond.value_field || ""}
            onValueChange={(val) => updateCondition(ruleIndex, condIndex, "value_field", val)}
            placeholder="Select field"
          />
          {threeDotButton}
        </div>
      );
    }

    const onChangeValue = (val: string) => updateCondition(ruleIndex, condIndex, "value", val);

    if (fieldType === "dropdown" && fieldInput?.dropdown_options) {
      return (
        <div className="relative flex-1">
          <Select value={cond.value || undefined} onValueChange={onChangeValue}>
            <SelectTrigger className="h-8 text-xs pr-8">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {fieldInput.dropdown_options.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {threeDotButton}
        </div>
      );
    }

    if (fieldType === "boolean") {
      return (
        <div className="relative flex-1">
          <Select value={cond.value || undefined} onValueChange={onChangeValue}>
            <SelectTrigger className="h-8 text-xs pr-8">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
          {threeDotButton}
        </div>
      );
    }

    if (fieldType === "date") {
      return (
        <div className="relative flex-1">
          <DatePickerField value={cond.value || ""} onChange={onChangeValue} className="h-8 text-xs" />
          {threeDotButton}
        </div>
      );
    }

    if (fieldType === "number") {
      return (
        <div className="relative flex-1">
          <NumberField
            value={cond.value ? Number(cond.value) : undefined}
            onChange={(val) => onChangeValue(isNaN(val) ? "" : String(val))}
            minValue={0}
            className="w-full"
          >
            <Group className="border-input data-focus-within:ring-ring relative inline-flex h-8 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-xs transition-colors outline-none data-disabled:opacity-50 data-focus-within:ring-1">
              <AriaInput placeholder="0" className="placeholder:text-muted-foreground w-full grow bg-transparent px-3 py-1 text-xs outline-none" />
              <AriaButton slot="decrement" className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50">
                <MinusIcon className="size-3" />
              </AriaButton>
              <AriaButton slot="increment" className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50">
                <PlusIcon className="size-3" />
              </AriaButton>
            </Group>
          </NumberField>
          {threeDotButton}
        </div>
      );
    }

    if (fieldType === "currency") {
      return (
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground z-10">$</span>
          <CalcInput value={cond.value} onValueChange={onChangeValue} className="h-8 text-xs pl-6 pr-8" placeholder="0.00" />
          {threeDotButton}
        </div>
      );
    }

    if (fieldType === "percentage") {
      return (
        <div className="relative flex-1">
          <Input type="number" inputMode="decimal" placeholder="0.00" min={0} max={100} step={0.01} value={cond.value} onChange={(e) => onChangeValue(e.target.value)} className="h-8 text-xs pr-7" />
          <span className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          {threeDotButton}
        </div>
      );
    }

    return (
      <div className="relative flex-1">
        <Input value={cond.value} onChange={(e) => onChangeValue(e.target.value)} placeholder="Value" className="h-8 text-xs pr-8" />
        {threeDotButton}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <SearchableInputSelect
          inputs={inputs}
          value={cond.field || ""}
          onValueChange={(val) => {
            updateCondition(ruleIndex, condIndex, "field", val);
            updateCondition(ruleIndex, condIndex, "operator", "");
            updateCondition(ruleIndex, condIndex, "value", "");
          }}
          placeholder="Select field"
        />
      </div>

      <Select
        value={cond.operator || undefined}
        onValueChange={(val) => {
          updateCondition(ruleIndex, condIndex, "operator", val);
          if (VALUELESS_OPERATORS.has(val)) updateCondition(ruleIndex, condIndex, "value", "");
        }}
      >
        <SelectTrigger className="h-8 text-xs w-48">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {renderConditionValue()}

      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => removeCondition(ruleIndex, condIndex)}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
