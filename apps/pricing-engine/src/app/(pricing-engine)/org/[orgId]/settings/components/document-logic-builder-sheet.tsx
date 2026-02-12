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
  Trash2,
  X,
  MoreVertical,
  Eye,
  EyeOff,
  Asterisk,
  Ban,
  Type,
  Grid2x2,
  Sigma,
  MinusIcon,
  PlusIcon,
  Check,
  ChevronsUpDown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
import { detectDocumentLogicConflicts } from "@/lib/logic-contradiction-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { ExpressionInput } from "./expression-input";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Action value types for documents – only visibility/required toggles */
type DocActionValueType = "visible" | "not_visible" | "required" | "not_required";

/** Condition value types – same as input logic */
type ConditionValueType = "value" | "field" | "expression";

interface InputField {
  id: string;
  input_code: string;
  input_label: string;
  input_type: string;
  category: string;
  dropdown_options?: string[] | null;
}

interface DocumentTypeItem {
  id: number;
  document_name: string;
  document_description: string | null;
  document_category_id: number;
}

interface Condition {
  field: string;
  operator: string;
  value: string;
  value_type: ConditionValueType;
  value_field?: string;
  value_expression?: string;
}

interface Action {
  document_type_id: number;
  value_type: DocActionValueType;
  value_visible?: boolean;
  value_required?: boolean;
}

interface LogicRule {
  type: "AND" | "OR";
  conditions: Condition[];
  actions: Action[];
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
  { value: "starts_with", label: "Starts With" },
  { value: "does_not_start_with", label: "Does Not Start With" },
  { value: "ends_with", label: "Ends With" },
  { value: "does_not_end_with", label: "Does Not End With" },
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
  { value: "is_after_or_equal", label: "Is After or Equal To" },
  { value: "is_before_or_equal", label: "Is Before or Equal To" },
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

const DOC_ACTION_VALUE_TYPE_OPTIONS: {
  value: DocActionValueType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "visible", label: "Visible", icon: Eye },
  { value: "not_visible", label: "Not Visible", icon: EyeOff },
  { value: "required", label: "Required", icon: Asterisk },
  { value: "not_required", label: "Not Required", icon: Ban },
];

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
  return {
    field: "",
    operator: "",
    value: "",
    value_type: "value",
  };
}

function defaultAction(filterDocTypeId?: number | null): Action {
  return {
    document_type_id: filterDocTypeId ?? 0,
    value_type: "visible",
    value_visible: true,
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function DocumentLogicBuilderSheet({
  open,
  onOpenChange,
  filterDocumentTypeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterDocumentTypeId?: number | null;
}) {
  const [inputs, setInputs] = useState<InputField[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeItem[]>([]);
  const [rules, setRules] = useState<LogicRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch inputs metadata + document types when sheet opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [inputsRes, docTypesRes] = await Promise.all([
          fetch("/api/inputs"),
          fetch("/api/document-types"),
        ]);
        const inputsJson = await inputsRes.json().catch(() => []);
        const docTypesJson = await docTypesRes.json().catch(() => []);
        if (!cancelled) {
          setInputs(Array.isArray(inputsJson) ? inputsJson : []);
          setDocumentTypes(Array.isArray(docTypesJson) ? docTypesJson : []);
        }
      } catch {
        if (!cancelled) {
          setInputs([]);
          setDocumentTypes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Fetch existing rules when sheet opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchRules = async () => {
      try {
        const url = filterDocumentTypeId
          ? `/api/document-logic?document_type_id=${filterDocumentTypeId}`
          : "/api/document-logic";
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && Array.isArray(json.rules)) {
            const normalized = json.rules.map((r: LogicRule) => ({
              ...r,
              conditions: (r.conditions ?? []).map((c: Condition) => ({
                ...c,
                value_type: (c.value_type as ConditionValueType) || "value",
              })),
              actions: (r.actions ?? []).map((a: Action) => ({
                ...a,
                value_type: a.value_type || "visible",
              })),
            }));
            setRules(normalized);
          }
        }
      } catch {
        // silently fail — start with empty rules
      }
    };

    fetchRules();
    return () => {
      cancelled = true;
    };
  }, [open, filterDocumentTypeId]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setRules([]);
      setSubmitError(null);
    }
  }, [open]);

  /* ---- Input lookup helpers ---- */

  const inputMap = useMemo(() => {
    const m = new Map<string, InputField>();
    for (const inp of inputs) m.set(inp.id, inp);
    return m;
  }, [inputs]);

  const docTypeMap = useMemo(() => {
    const m = new Map<number, DocumentTypeItem>();
    for (const dt of documentTypes) m.set(dt.id, dt);
    return m;
  }, [documentTypes]);

  const getDocTypeName = useCallback(
    (id: number): string => {
      const dt = docTypeMap.get(id);
      return dt ? dt.document_name : String(id);
    },
    [docTypeMap]
  );

  const filteredDocTypeName = filterDocumentTypeId
    ? getDocTypeName(filterDocumentTypeId)
    : null;

  /* ---- Contradiction detection ---- */

  const conflictWarnings = useMemo(
    () => detectDocumentLogicConflicts(rules, getDocTypeName),
    [rules, getDocTypeName]
  );

  /* ---- Rule manipulation ---- */

  const addRule = useCallback(() => {
    const newRule: LogicRule = {
      type: "AND",
      conditions: [defaultCondition()],
      actions: [defaultAction(filterDocumentTypeId)],
    };
    setRules((prev) => [...prev, newRule]);
  }, [filterDocumentTypeId]);

  const removeRule = useCallback((ruleIndex: number) => {
    setRules((prev) => prev.filter((_, i) => i !== ruleIndex));
  }, []);

  const updateRuleType = useCallback(
    (ruleIndex: number, type: "AND" | "OR") => {
      setRules((prev) =>
        prev.map((r, i) => (i === ruleIndex ? { ...r, type } : r))
      );
    },
    []
  );

  /* ---- Condition manipulation ---- */

  const addCondition = useCallback((ruleIndex: number) => {
    setRules((prev) =>
      prev.map((r, i) =>
        i === ruleIndex
          ? {
              ...r,
              conditions: [...r.conditions, defaultCondition()],
            }
          : r
      )
    );
  }, []);

  const removeCondition = useCallback(
    (ruleIndex: number, condIndex: number) => {
      setRules((prev) =>
        prev.map((r, i) =>
          i === ruleIndex
            ? {
                ...r,
                conditions: r.conditions.filter((_, ci) => ci !== condIndex),
              }
            : r
        )
      );
    },
    []
  );

  const updateCondition = useCallback(
    (
      ruleIndex: number,
      condIndex: number,
      field: keyof Condition,
      value: string
    ) => {
      setRules((prev) =>
        prev.map((r, i) => {
          if (i !== ruleIndex) return r;
          const newConds = [...r.conditions];
          newConds[condIndex] = { ...newConds[condIndex], [field]: value };
          return { ...r, conditions: newConds };
        })
      );
    },
    []
  );

  const setConditionValueType = useCallback(
    (ruleIndex: number, condIndex: number, vt: ConditionValueType) => {
      setRules((prev) =>
        prev.map((r, i) => {
          if (i !== ruleIndex) return r;
          const newConds = [...r.conditions];
          newConds[condIndex] = {
            ...newConds[condIndex],
            value_type: vt,
            value: vt === "value" ? newConds[condIndex].value : "",
            value_field: vt === "field" ? (newConds[condIndex].value_field ?? "") : undefined,
            value_expression: vt === "expression" ? (newConds[condIndex].value_expression ?? "") : undefined,
          };
          return { ...r, conditions: newConds };
        })
      );
    },
    []
  );

  /* ---- Action manipulation ---- */

  const addAction = useCallback(
    (ruleIndex: number) => {
      setRules((prev) =>
        prev.map((r, i) =>
          i === ruleIndex
            ? {
                ...r,
                actions: [...r.actions, defaultAction(filterDocumentTypeId)],
              }
            : r
        )
      );
    },
    [filterDocumentTypeId]
  );

  const removeAction = useCallback(
    (ruleIndex: number, actionIndex: number) => {
      setRules((prev) =>
        prev.map((r, i) =>
          i === ruleIndex
            ? {
                ...r,
                actions: r.actions.filter((_, ai) => ai !== actionIndex),
              }
            : r
        )
      );
    },
    []
  );

  const updateAction = useCallback(
    (
      ruleIndex: number,
      actionIndex: number,
      updates: Partial<Action>
    ) => {
      setRules((prev) =>
        prev.map((r, i) => {
          if (i !== ruleIndex) return r;
          const newActions = [...r.actions];
          newActions[actionIndex] = {
            ...newActions[actionIndex],
            ...updates,
          };
          return { ...r, actions: newActions };
        })
      );
    },
    []
  );

  const setActionValueType = useCallback(
    (ruleIndex: number, actionIndex: number, vt: DocActionValueType) => {
      const base: Partial<Action> = {
        value_type: vt,
        value_visible: undefined,
        value_required: undefined,
      };

      if (vt === "visible") base.value_visible = true;
      if (vt === "not_visible") base.value_visible = false;
      if (vt === "required") base.value_required = true;
      if (vt === "not_required") base.value_required = false;

      updateAction(ruleIndex, actionIndex, base);
    },
    [updateAction]
  );

  /* ---- Save ---- */

  const handleSave = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<string, unknown> = { rules };
      if (filterDocumentTypeId) {
        payload.document_type_id = filterDocumentTypeId;
      }
      const res = await fetch("/api/document-logic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to save logic rules");
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }, [rules, filterDocumentTypeId, onOpenChange]);

  /* ---- Render ---- */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {filterDocumentTypeId
              ? `Logic Builder — ${filteredDocTypeName}`
              : "Document Logic Builder"}
          </SheetTitle>
          <SheetDescription>
            {filterDocumentTypeId
              ? `Create rules that control the behavior of "${filteredDocTypeName}".`
              : "Create logic rules with conditions on input fields and actions on document types."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    No logic rules yet.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add a rule to define conditional document behavior.
                  </p>
                </div>
              ) : (
                rules.map((rule, ruleIndex) => {
                  const ruleWarnings = conflictWarnings.get(ruleIndex) ?? [];
                  return (
                  <div
                    key={ruleIndex}
                    className="rounded-lg border bg-muted/30 shadow-sm"
                  >
                    {/* Rule header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          Rule #{ruleIndex + 1}
                        </span>
                        {ruleWarnings.length > 0 && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex cursor-default">
                                  <AlertTriangle className="size-4 text-warning shrink-0" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs space-y-1">
                                {ruleWarnings.map((w, i) => (
                                  <p key={i} className="text-xs">{w}</p>
                                ))}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={rule.type}
                          onValueChange={(val) =>
                            updateRuleType(
                              ruleIndex,
                              val as "AND" | "OR"
                            )
                          }
                        >
                          <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">AND</SelectItem>
                            <SelectItem value="OR">OR</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRule(ruleIndex)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="px-4 py-3 space-y-4">
                      {/* Conditions section */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Conditions
                        </Label>
                        <div className="space-y-2">
                          {rule.conditions.map((cond, condIndex) => (
                            <ConditionRow
                              key={condIndex}
                              cond={cond}
                              condIndex={condIndex}
                              ruleIndex={ruleIndex}
                              inputs={inputs}
                              inputMap={inputMap}
                              updateCondition={updateCondition}
                              setConditionValueType={setConditionValueType}
                              removeCondition={removeCondition}
                            />
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => addCondition(ruleIndex)}
                        >
                          <Plus className="size-3 mr-1" />
                          Add Condition
                        </Button>
                      </div>

                      {/* Actions section */}
                      <div className="space-y-2 border-t pt-3">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Actions
                        </Label>
                        <div className="space-y-2">
                          {rule.actions.map((action, actionIndex) => (
                            <DocActionRow
                              key={actionIndex}
                              action={action}
                              actionIndex={actionIndex}
                              ruleIndex={ruleIndex}
                              documentTypes={documentTypes}
                              filterDocumentTypeId={filterDocumentTypeId}
                              filteredDocTypeName={filteredDocTypeName}
                              updateAction={updateAction}
                              setActionValueType={setActionValueType}
                              removeAction={removeAction}
                            />
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => addAction(ruleIndex)}
                        >
                          <Plus className="size-3 mr-1" />
                          Add Action
                        </Button>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}

              {/* Add rule button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addRule}
              >
                <Plus className="size-4 mr-1.5" />
                Add Logic Rule
              </Button>
            </div>
          )}
        </div>

        <SheetFooter className="mt-4 flex-col gap-2">
          {submitError && (
            <p className="text-sm text-destructive text-center w-full">
              {submitError}
            </p>
          )}
          {conflictWarnings.size > 0 && (
            <p className="text-sm text-warning text-center w-full flex items-center justify-center gap-1.5">
              <AlertTriangle className="size-3.5 shrink-0" />
              Resolve all warnings before saving.
            </p>
          )}
          <div className="flex gap-2 justify-end w-full">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={submitting || conflictWarnings.size > 0}
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Rules
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  SearchableInputSelect – combobox with search for input fields              */
/* -------------------------------------------------------------------------- */

function SearchableInputSelect({
  inputs,
  value,
  onValueChange,
  placeholder = "Select field",
  disabled = false,
}: {
  inputs: { id: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = inputs.find((inp) => inp.id === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
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
                  value={inp.label}
                  onSelect={() => {
                    onValueChange(inp.id);
                    setOpen(false);
                  }}
                >
                  {inp.label}
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
/*  SearchableDocTypeSelect – combobox for document types                      */
/* -------------------------------------------------------------------------- */

function SearchableDocTypeSelect({
  documentTypes,
  value,
  onValueChange,
  placeholder = "Select document",
  disabled = false,
}: {
  documentTypes: DocumentTypeItem[];
  value: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = documentTypes.find((dt) => dt.id === value)?.document_name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
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
              {documentTypes.map((dt) => (
                <CommandItem
                  key={dt.id}
                  value={dt.document_name}
                  onSelect={() => {
                    onValueChange(dt.id);
                    setOpen(false);
                  }}
                >
                  {dt.document_name}
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
/*  ConditionRow – identical to input logic builder conditions                 */
/* -------------------------------------------------------------------------- */

function ConditionRow({
  cond,
  condIndex,
  ruleIndex,
  inputs,
  inputMap,
  updateCondition,
  setConditionValueType,
  removeCondition,
}: {
  cond: Condition;
  condIndex: number;
  ruleIndex: number;
  inputs: InputField[];
  inputMap: Map<string, InputField>;
  updateCondition: (
    ruleIndex: number,
    condIndex: number,
    field: keyof Condition,
    value: string
  ) => void;
  setConditionValueType: (
    ruleIndex: number,
    condIndex: number,
    vt: ConditionValueType
  ) => void;
  removeCondition: (ruleIndex: number, condIndex: number) => void;
}) {
  const fieldInput = cond.field ? inputMap.get(cond.field) : undefined;
  const fieldType = fieldInput?.input_type;
  const vt = cond.value_type || "value";

  const operators = getOperatorsForType(fieldType);
  const isValueless = VALUELESS_OPERATORS.has(cond.operator);

  const valueTypeLabel =
    CONDITION_VALUE_TYPE_OPTIONS.find((o) => o.value === vt)?.label ?? "Value";

  // 3-dot popover for switching condition value type
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
                  isActive
                    ? "bg-muted font-medium"
                    : "text-muted-foreground"
                }`}
                onClick={() =>
                  setConditionValueType(ruleIndex, condIndex, opt.value)
                }
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

  // Render the value input based on the value_type and field's input_type
  const renderConditionValue = () => {
    if (isValueless) return null;

    /* -- Field mode: dropdown of all inputs (searchable) -- */
    if (vt === "field") {
      return (
        <div className="relative flex-1">
          <SearchableInputSelect
            inputs={inputs.map((inp) => ({ ...inp, label: inp.input_label }))}
            value={cond.value_field || ""}
            onValueChange={(val) =>
              updateCondition(ruleIndex, condIndex, "value_field", val)
            }
            placeholder="Select field"
          />
          {threeDotButton}
        </div>
      );
    }

    /* -- Expression mode -- */
    if (vt === "expression") {
      return (
        <div className="relative flex-1">
          <ExpressionInput
            value={cond.value_expression ?? ""}
            onChange={(val) =>
              updateCondition(ruleIndex, condIndex, "value_expression", val)
            }
            inputs={inputs}
            className="pr-6"
          />
          {threeDotButton}
        </div>
      );
    }

    /* -- Value mode (default): mirror the field's input_type -- */
    const onChangeValue = (val: string) =>
      updateCondition(ruleIndex, condIndex, "value", val);

    // Dropdown field
    if (fieldType === "dropdown" && fieldInput?.dropdown_options) {
      return (
        <div className="relative flex-1">
          <Select
            value={cond.value || undefined}
            onValueChange={onChangeValue}
          >
            <SelectTrigger className="h-8 text-xs pr-8">
              <SelectValue placeholder="Select value" />
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

    // Boolean field
    if (fieldType === "boolean") {
      return (
        <div className="relative flex-1">
          <Select
            value={cond.value || undefined}
            onValueChange={onChangeValue}
          >
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

    // Date field
    if (fieldType === "date") {
      return (
        <div className="relative flex-1">
          <DatePickerField
            value={cond.value || ""}
            onChange={onChangeValue}
            className="h-8 text-xs"
          />
          {threeDotButton}
        </div>
      );
    }

    // Number field
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
              <AriaInput
                placeholder="0"
                className="placeholder:text-muted-foreground w-full grow bg-transparent px-3 py-1 text-xs outline-none"
              />
              <AriaButton
                slot="decrement"
                className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
              >
                <MinusIcon className="size-3" />
              </AriaButton>
              <AriaButton
                slot="increment"
                className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
              >
                <PlusIcon className="size-3" />
              </AriaButton>
            </Group>
          </NumberField>
          {threeDotButton}
        </div>
      );
    }

    // Currency field
    if (fieldType === "currency") {
      return (
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground z-10">
            $
          </span>
          <CalcInput
            value={cond.value}
            onValueChange={onChangeValue}
            className="h-8 text-xs pl-6 pr-8"
            placeholder="0.00"
          />
          {threeDotButton}
        </div>
      );
    }

    // Percentage field
    if (fieldType === "percentage") {
      return (
        <div className="relative flex-1">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            min={0}
            max={100}
            step={0.01}
            value={cond.value}
            onChange={(e) => onChangeValue(e.target.value)}
            onBlur={() => {
              if (cond.value === "") return;
              const num = parseFloat(cond.value);
              if (isNaN(num)) {
                onChangeValue("");
                return;
              }
              const clamped = Math.min(100, Math.max(0, num));
              onChangeValue(
                clamped.toFixed(2).replace(/\.?0+$/, "") || "0"
              );
            }}
            className="h-8 text-xs pr-7"
          />
          <span className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            %
          </span>
          {threeDotButton}
        </div>
      );
    }

    // Default: text
    return (
      <div className="relative flex-1">
        <Input
          value={cond.value}
          onChange={(e) => onChangeValue(e.target.value)}
          placeholder="Value"
          className="h-8 text-xs pr-8"
        />
        {threeDotButton}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* Field dropdown – searchable (references inputs) */}
      <div className="flex-1">
        <SearchableInputSelect
          inputs={inputs.map((inp) => ({ ...inp, label: inp.input_label }))}
          value={cond.field || ""}
          onValueChange={(val) => {
            updateCondition(ruleIndex, condIndex, "field", val);
            updateCondition(ruleIndex, condIndex, "operator", "");
            updateCondition(ruleIndex, condIndex, "value", "");
          }}
          placeholder="Select field"
        />
      </div>

      {/* Operator dropdown */}
      <Select
        value={cond.operator || undefined}
        onValueChange={(val) => {
          updateCondition(ruleIndex, condIndex, "operator", val);
          if (VALUELESS_OPERATORS.has(val)) {
            updateCondition(ruleIndex, condIndex, "value", "");
          }
        }}
      >
        <SelectTrigger className="h-8 text-xs w-48">
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

      {/* Dynamic value input */}
      {renderConditionValue()}

      {/* Remove condition */}
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

/* -------------------------------------------------------------------------- */
/*  DocActionRow – simplified: only 4 value types                              */
/* -------------------------------------------------------------------------- */

function DocActionRow({
  action,
  actionIndex,
  ruleIndex,
  documentTypes,
  filterDocumentTypeId,
  filteredDocTypeName,
  updateAction,
  setActionValueType,
  removeAction,
}: {
  action: Action;
  actionIndex: number;
  ruleIndex: number;
  documentTypes: DocumentTypeItem[];
  filterDocumentTypeId?: number | null;
  filteredDocTypeName: string | null;
  updateAction: (
    ruleIndex: number,
    actionIndex: number,
    updates: Partial<Action>
  ) => void;
  setActionValueType: (
    ruleIndex: number,
    actionIndex: number,
    vt: DocActionValueType
  ) => void;
  removeAction: (ruleIndex: number, actionIndex: number) => void;
}) {
  const vt = action.value_type || "visible";

  const valueTypeLabel =
    DOC_ACTION_VALUE_TYPE_OPTIONS.find((o) => o.value === vt)?.label ?? "Visible";

  // 3-dot popover for switching action value type (only 4 options)
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
          {DOC_ACTION_VALUE_TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = vt === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-muted transition-colors w-full text-left ${
                  isActive
                    ? "bg-muted font-medium"
                    : "text-muted-foreground"
                }`}
                onClick={() =>
                  setActionValueType(ruleIndex, actionIndex, opt.value)
                }
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

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground shrink-0">
        Set
      </span>

      {/* Document type dropdown – searchable */}
      {filterDocumentTypeId && action.document_type_id === filterDocumentTypeId ? (
        <div className="h-8 flex items-center px-3 rounded-md border bg-muted text-xs flex-1 min-w-0">
          <span className="truncate">{filteredDocTypeName}</span>
        </div>
      ) : (
        <div className="flex-1">
          <SearchableDocTypeSelect
            documentTypes={documentTypes}
            value={action.document_type_id || 0}
            onValueChange={(val) =>
              updateAction(ruleIndex, actionIndex, { document_type_id: val })
            }
            placeholder="Select document"
          />
        </div>
      )}

      <span className="text-xs font-medium text-muted-foreground shrink-0">
        to
      </span>

      {/* Value type display – always locked since only visibility/required */}
      <div className="relative flex-1">
        <div className="h-8 flex items-center px-3 pr-8 rounded-md border bg-muted text-xs cursor-default select-none">
          {valueTypeLabel}
        </div>
        {threeDotButton}
      </div>

      {/* Remove action */}
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => removeAction(ruleIndex, actionIndex)}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
