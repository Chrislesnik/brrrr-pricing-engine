"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  X,
  MoreVertical,
  Type,
  Grid2x2,
  Sigma,
  GripVertical,
  ChevronsUpDown,
  Database,
  ArrowRight,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import {
  Button as AriaButton,
  Group,
  Input as AriaInput,
  NumberField,
} from "react-aria-components";
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
import { ColumnExpressionInput } from "@/components/column-expression-input";

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

export interface LinkedRule {
  rule_order: number;
  logic_type: "AND" | "OR";
  conditions: Condition[];
  linked_table: string;
  linked_column: string;
}

/* -------------------------------------------------------------------------- */
/*  Operators                                                                  */
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
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
];

const NUMERIC_OPERATORS = [
  ...COMMON_OPERATORS,
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "greater_than_or_equal", label: "Greater Than or Equal" },
  { value: "less_than_or_equal", label: "Less Than or Equal" },
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
  "exists",
  "does_not_exist",
  "is_empty",
  "is_not_empty",
  "is_true",
  "is_false",
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

function defaultRule(): LinkedRule {
  return {
    rule_order: 0,
    logic_type: "AND",
    conditions: [defaultCondition()],
    linked_table: "",
    linked_column: "",
  };
}

function formatTableLabel(name: string): string {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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
          className="w-full justify-between font-normal h-8 text-xs"
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 z-[100]" align="start" side="bottom" sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search inputs..." className="h-8" />
          <CommandList className="max-h-60 overflow-y-auto" style={{ maxHeight: "240px", overflowY: "auto" }}>
            <CommandEmpty>No inputs found.</CommandEmpty>
            <CommandGroup>
              {inputs.map((inp) => (
                <CommandItem
                  key={inp.id}
                  value={inp.input_label}
                  onSelect={() => {
                    onValueChange(inp.id);
                    setOpen(false);
                  }}
                  className="px-2 py-1.5 text-xs cursor-pointer"
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
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function LinkedRulesSheet({
  open,
  onOpenChange,
  inputId,
  inputLabel,
  inputsEndpoint = "/api/inputs",
  pendingRules,
  onPendingRulesChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputId: string;
  inputLabel: string;
  /** API endpoint to fetch the list of inputs for condition fields. Defaults to "/api/inputs" (deal inputs). */
  inputsEndpoint?: string;
  /** If provided, the sheet initializes from these rules instead of fetching from the API. */
  pendingRules?: LinkedRule[];
  /** Called instead of the API save when in pending mode; passes the configured rules back to the parent. */
  onPendingRulesChange?: (rules: LinkedRule[]) => void;
  onSaved?: () => void;
}) {
  const [inputs, setInputs] = useState<InputField[]>([]);
  const [rules, setRules] = useState<LinkedRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [linkableTables, setLinkableTables] = useState<{ value: string; label: string }[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const [columnsByTable, setColumnsByTable] = useState<Record<string, { name: string; type: string }[]>>({});
  const [loadingColumnsFor, setLoadingColumnsFor] = useState<string | null>(null);

  const isPending = pendingRules !== undefined;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const fetches: Promise<Response>[] = [
          fetch(inputsEndpoint),
          fetch("/api/supabase-schema?type=tables"),
        ];
        if (!isPending) {
          fetches.push(fetch(`/api/input-linked-rules?input_id=${inputId}`));
        }

        const responses = await Promise.all(fetches);
        const inputsJson = await responses[0].json().catch(() => []);
        const tablesJson = await responses[1].json().catch(() => []);
        const rulesJson = !isPending
          ? await responses[2].json().catch(() => ({ rules: [] }))
          : { rules: [] };

        if (!cancelled) {
          setInputs(Array.isArray(inputsJson) ? inputsJson : []);

          if (isPending) {
            setRules(
              pendingRules.length > 0 ? [...pendingRules] : [defaultRule()]
            );
          } else {
            const fetched = Array.isArray(rulesJson.rules) ? rulesJson.rules : [];
            setRules(
              fetched.length > 0
                ? fetched.map((r: any) => ({
                    rule_order: r.rule_order ?? 0,
                    logic_type: r.logic_type || "AND",
                    conditions: Array.isArray(r.conditions) ? r.conditions : [defaultCondition()],
                    linked_table: r.linked_table ?? "",
                    linked_column: r.linked_column ?? "",
                  }))
                : [defaultRule()]
            );
          }

          if (tablesJson && Array.isArray(tablesJson.tables)) {
            setLinkableTables(
              tablesJson.tables
                .sort((a: string, b: string) => a.localeCompare(b))
                .map((t: string) => ({
                  value: t,
                  label: formatTableLabel(t),
                }))
            );
          }
        }
      } catch {
        if (!cancelled) {
          setInputs([]);
          setRules(isPending && pendingRules.length > 0 ? [...pendingRules] : [defaultRule()]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [open, inputId, inputsEndpoint, isPending]);

  const fetchColumnsForTable = useCallback(async (table: string) => {
    if (!table || columnsByTable[table]) return;
    setLoadingColumnsFor(table);
    try {
      const res = await fetch(`/api/supabase-schema?type=columns&table=${encodeURIComponent(table)}`);
      const json = await res.json().catch(() => ({}));
      setColumnsByTable((prev) => ({
        ...prev,
        [table]: Array.isArray(json.columns) ? json.columns : Array.isArray(json) ? json : [],
      }));
    } catch {
      // ignore
    } finally {
      setLoadingColumnsFor(null);
    }
  }, [columnsByTable]);

  const updateRule = useCallback(
    <K extends keyof LinkedRule>(ruleIndex: number, key: K, value: LinkedRule[K]) => {
      setRules((prev) => {
        const updated = [...prev];
        updated[ruleIndex] = { ...updated[ruleIndex], [key]: value };
        return updated;
      });
    },
    []
  );

  const updateCondition = useCallback(
    (ruleIndex: number, condIndex: number, key: string, value: string) => {
      setRules((prev) => {
        const updated = [...prev];
        const rule = { ...updated[ruleIndex] };
        const conditions = [...rule.conditions];
        conditions[condIndex] = { ...conditions[condIndex], [key]: value };
        rule.conditions = conditions;
        updated[ruleIndex] = rule;
        return updated;
      });
    },
    []
  );

  const addCondition = useCallback((ruleIndex: number) => {
    setRules((prev) => {
      const updated = [...prev];
      const rule = { ...updated[ruleIndex] };
      rule.conditions = [...rule.conditions, defaultCondition()];
      updated[ruleIndex] = rule;
      return updated;
    });
  }, []);

  const removeCondition = useCallback((ruleIndex: number, condIndex: number) => {
    setRules((prev) => {
      const updated = [...prev];
      const rule = { ...updated[ruleIndex] };
      rule.conditions = rule.conditions.filter((_, i) => i !== condIndex);
      updated[ruleIndex] = rule;
      return updated;
    });
  }, []);

  const addRule = useCallback(() => {
    setRules((prev) => [...prev, { ...defaultRule(), rule_order: prev.length }]);
  }, []);

  const removeRule = useCallback((ruleIndex: number) => {
    setRules((prev) => prev.filter((_, i) => i !== ruleIndex));
  }, []);

  const handleSave = async () => {
    const validRules = rules
      .filter((r) => r.linked_table)
      .map((r, idx) => ({
        rule_order: idx,
        logic_type: r.logic_type,
        conditions: r.conditions.filter((c) => c.field && c.operator),
        linked_table: r.linked_table,
        linked_column: r.linked_column,
      }));

    if (isPending && onPendingRulesChange) {
      onPendingRulesChange(validRules);
      onOpenChange(false);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/input-linked-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_id: Number(inputId), rules: validRules }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save");
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to save rules");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Database className="size-4" />
            Conditional Database Link Rules
          </SheetTitle>
          <SheetDescription className="text-xs">
            Configure which database table and display expression to use for
            &quot;{inputLabel}&quot; based on other input values. Rules are
            evaluated top-to-bottom; the first matching rule wins.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : rules.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No database link rules configured. Add a rule to link this input to a database table.
              </p>
            </div>
          ) : (
            rules.map((rule, ruleIndex) => (
              <RuleCard
                key={ruleIndex}
                rule={rule}
                ruleIndex={ruleIndex}
                inputs={inputs}
                linkableTables={linkableTables}
                loadingTables={loadingTables}
                columnsByTable={columnsByTable}
                loadingColumnsFor={loadingColumnsFor}
                fetchColumnsForTable={fetchColumnsForTable}
                updateRule={updateRule}
                updateCondition={updateCondition}
                addCondition={addCondition}
                removeCondition={removeCondition}
                removeRule={removeRule}
              />
            ))
          )}

          {!loading && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addRule}
            >
              <Plus className="size-3.5 mr-1.5" />
              Add Rule
            </Button>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t flex items-center gap-2">
          {submitError && (
            <p className="text-xs text-destructive flex-1">{submitError}</p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
              Save Rules
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  RuleCard                                                                   */
/* -------------------------------------------------------------------------- */

function RuleCard({
  rule,
  ruleIndex,
  inputs,
  linkableTables,
  loadingTables,
  columnsByTable,
  loadingColumnsFor,
  fetchColumnsForTable,
  updateRule,
  updateCondition,
  addCondition,
  removeCondition,
  removeRule,
}: {
  rule: LinkedRule;
  ruleIndex: number;
  inputs: InputField[];
  linkableTables: { value: string; label: string }[];
  loadingTables: boolean;
  columnsByTable: Record<string, { name: string; type: string }[]>;
  loadingColumnsFor: string | null;
  fetchColumnsForTable: (table: string) => void;
  updateRule: <K extends keyof LinkedRule>(ruleIndex: number, key: K, value: LinkedRule[K]) => void;
  updateCondition: (ruleIndex: number, condIndex: number, key: string, value: string) => void;
  addCondition: (ruleIndex: number) => void;
  removeCondition: (ruleIndex: number, condIndex: number) => void;
  removeRule: (ruleIndex: number) => void;
}) {
  useEffect(() => {
    if (rule.linked_table) {
      fetchColumnsForTable(rule.linked_table);
    }
  }, [rule.linked_table, fetchColumnsForTable]);

  const columns = rule.linked_table ? columnsByTable[rule.linked_table] ?? [] : [];
  const isLoadingCols = loadingColumnsFor === rule.linked_table;

  return (
    <div className="rounded-lg border bg-card">
      {/* Rule header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <GripVertical className="size-3.5 text-muted-foreground cursor-grab" />
          <span className="text-xs font-semibold">Rule {ruleIndex + 1}</span>
          <Select
            value={rule.logic_type}
            onValueChange={(val) => updateRule(ruleIndex, "logic_type", val as "AND" | "OR")}
          >
            <SelectTrigger className="h-6 w-16 text-[10px] px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => removeRule(ruleIndex)}
        >
          <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>

      {/* Conditions */}
      <div className="p-3 space-y-2">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          When
        </Label>
        {rule.conditions.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic">
            No conditions — this rule always applies (default).
          </p>
        ) : (
          rule.conditions.map((cond, condIndex) => (
            <ConditionRow
              key={condIndex}
              condition={cond}
              condIndex={condIndex}
              ruleIndex={ruleIndex}
              inputs={inputs}
              updateCondition={updateCondition}
              removeCondition={removeCondition}
              canRemove={true}
            />
          ))
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={() => addCondition(ruleIndex)}
        >
          <Plus className="size-3 mr-1" />
          Add Condition
        </Button>
      </div>

      {/* Target: Table + Expression */}
      <div className="p-3 pt-0 space-y-2 border-t mt-3">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 pt-2">
          <ArrowRight className="size-3" />
          Then link to
        </Label>
        <Select
          value={rule.linked_table || undefined}
          onValueChange={(val) => {
            updateRule(ruleIndex, "linked_table", val);
            updateRule(ruleIndex, "linked_column", "");
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select table..." />
          </SelectTrigger>
          <SelectContent>
            {loadingTables ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading...</div>
            ) : (
              linkableTables.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {rule.linked_table && (
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Display Expression
            </Label>
            <ColumnExpressionInput
              value={rule.linked_column}
              onChange={(val) => updateRule(ruleIndex, "linked_column", val)}
              columns={columns}
              loading={isLoadingCols}
              placeholder="e.g. @first_name @last_name"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ConditionRow                                                               */
/* -------------------------------------------------------------------------- */

function ConditionRow({
  condition: cond,
  condIndex,
  ruleIndex,
  inputs,
  updateCondition,
  removeCondition,
  canRemove,
}: {
  condition: Condition;
  condIndex: number;
  ruleIndex: number;
  inputs: InputField[];
  updateCondition: (ruleIndex: number, condIndex: number, key: string, value: string) => void;
  removeCondition: (ruleIndex: number, condIndex: number) => void;
  canRemove: boolean;
}) {
  const fieldInput = inputs.find((inp) => inp.id === cond.field);
  const operators = getOperatorsForType(fieldInput?.input_type);
  const isValueless = VALUELESS_OPERATORS.has(cond.operator);

  return (
    <div className="flex items-start gap-1.5">
      {/* Field selector */}
      <div className="w-40 shrink-0">
        <SearchableInputSelect
          inputs={inputs}
          value={cond.field}
          onValueChange={(val) => {
            updateCondition(ruleIndex, condIndex, "field", val);
            updateCondition(ruleIndex, condIndex, "operator", "");
            updateCondition(ruleIndex, condIndex, "value", "");
          }}
          placeholder="Select field"
        />
      </div>

      {/* Operator */}
      <Select
        value={cond.operator || undefined}
        onValueChange={(val) => {
          updateCondition(ruleIndex, condIndex, "operator", val);
          if (VALUELESS_OPERATORS.has(val)) {
            updateCondition(ruleIndex, condIndex, "value", "");
          }
        }}
      >
        <SelectTrigger className="h-8 text-[10px] w-36 shrink-0">
          <SelectValue placeholder="Operator" />
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
      {!isValueless && (
        <div className="flex-1 min-w-0">
          <ConditionValueInput
            condition={cond}
            condIndex={condIndex}
            ruleIndex={ruleIndex}
            fieldInput={fieldInput}
            inputs={inputs}
            updateCondition={updateCondition}
          />
        </div>
      )}

      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => removeCondition(ruleIndex, condIndex)}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ConditionValueInput                                                        */
/* -------------------------------------------------------------------------- */

function ConditionValueInput({
  condition: cond,
  condIndex,
  ruleIndex,
  fieldInput,
  inputs,
  updateCondition,
}: {
  condition: Condition;
  condIndex: number;
  ruleIndex: number;
  fieldInput?: InputField;
  inputs: InputField[];
  updateCondition: (ruleIndex: number, condIndex: number, key: string, value: string) => void;
}) {
  const vt = cond.value_type || "value";

  const threeDotButton = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
        >
          <MoreVertical className="size-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="end">
        {CONDITION_VALUE_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent",
              vt === opt.value && "bg-accent"
            )}
            onClick={() => {
              updateCondition(ruleIndex, condIndex, "value_type", opt.value);
              updateCondition(ruleIndex, condIndex, "value", "");
              updateCondition(ruleIndex, condIndex, "value_field", "");
              updateCondition(ruleIndex, condIndex, "value_expression", "");
            }}
          >
            <opt.icon className="size-3" />
            {opt.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );

  if (vt === "field") {
    return (
      <div className="relative">
        <SearchableInputSelect
          inputs={inputs}
          value={cond.value_field || ""}
          onValueChange={(val) => updateCondition(ruleIndex, condIndex, "value_field", val)}
          placeholder="Select field"
        />
      </div>
    );
  }

  if (vt === "expression") {
    return (
      <div className="relative">
        <Input
          value={cond.value_expression ?? ""}
          onChange={(e) => updateCondition(ruleIndex, condIndex, "value_expression", e.target.value)}
          placeholder="Expression..."
          className="h-8 text-xs pr-7"
        />
        {threeDotButton}
      </div>
    );
  }

  const inputType = fieldInput?.input_type;

  if (inputType === "dropdown" && fieldInput?.dropdown_options?.length) {
    return (
      <div className="relative">
        <Select
          value={cond.value || undefined}
          onValueChange={(val) => updateCondition(ruleIndex, condIndex, "value", val)}
        >
          <SelectTrigger className="h-8 text-xs pr-7">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {fieldInput.dropdown_options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {threeDotButton}
      </div>
    );
  }

  if (inputType === "boolean") {
    return (
      <div className="relative">
        <Select
          value={cond.value || undefined}
          onValueChange={(val) => updateCondition(ruleIndex, condIndex, "value", val)}
        >
          <SelectTrigger className="h-8 text-xs pr-7">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True / Yes</SelectItem>
            <SelectItem value="false">False / No</SelectItem>
          </SelectContent>
        </Select>
        {threeDotButton}
      </div>
    );
  }

  if (inputType === "date") {
    return (
      <div className="relative">
        <Input
          type="date"
          value={cond.value || ""}
          onChange={(e) => updateCondition(ruleIndex, condIndex, "value", e.target.value)}
          className="h-8 text-xs pr-7"
        />
        {threeDotButton}
      </div>
    );
  }

  if (inputType === "number" || inputType === "currency" || inputType === "percentage") {
    return (
      <div className="relative">
        <Input
          type="number"
          value={cond.value || ""}
          onChange={(e) => updateCondition(ruleIndex, condIndex, "value", e.target.value)}
          className="h-8 text-xs pr-7"
          placeholder="0"
        />
        {threeDotButton}
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        value={cond.value || ""}
        onChange={(e) => updateCondition(ruleIndex, condIndex, "value", e.target.value)}
        className="h-8 text-xs pr-7"
        placeholder="Value..."
      />
      {threeDotButton}
    </div>
  );
}
