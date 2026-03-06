"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Database, Plus, X, Settings, ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";
import { cn } from "@repo/lib/cn";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Badge } from "@repo/ui/shadcn/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
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

interface SourceLinkedRule {
  id: string | number;
  rule_order: number;
  logic_type: "AND" | "OR";
  conditions: SourceCondition[];
  linked_table: string;
  linked_column: string;
}

interface SourceCondition {
  field: string;
  operator: string;
  value: string;
}

export interface AutofillExtraCondition {
  field: string;
  operator: string;
  value: string;
}

export interface AutofillRuleConfig {
  source_input_id: string;
  source_linked_rule_id: string | number;
  rule_order: number;
  conditions: AutofillExtraCondition[];
  logic_type: "AND" | "OR";
  expression: string;
  locked: boolean;
}

export interface AutofillRulesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetInputId: string;
  targetInputLabel: string;
  inputsEndpoint?: string;
  onSaved?: () => void;
  pendingRules?: AutofillRuleConfig[];
  onPendingRulesChange?: (rules: AutofillRuleConfig[]) => void;
}

/* -------------------------------------------------------------------------- */
/*  Operators (simplified)                                                     */
/* -------------------------------------------------------------------------- */

const OPERATORS = [
  { value: "equals", label: "Is Equal To" },
  { value: "not_equals", label: "Is Not Equal To" },
  { value: "contains", label: "Contains" },
  { value: "does_not_contain", label: "Does Not Contain" },
  { value: "is_empty", label: "Is Empty" },
  { value: "is_not_empty", label: "Is Not Empty" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
];

const VALUELESS_OPERATORS = new Set(["is_empty", "is_not_empty"]);

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatTableLabel(name: string): string {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatConditions(
  conditions: SourceCondition[],
  inputsById: Map<string, InputField>
): string {
  if (!conditions || conditions.length === 0) return "";
  return conditions
    .map((c) => {
      const label = inputsById.get(c.field)?.input_label ?? c.field;
      const op = OPERATORS.find((o) => o.value === c.operator)?.label ?? c.operator;
      return `${label} ${op} ${c.value || ""}`.trim();
    })
    .join(" & ");
}

function defaultExtraCondition(): AutofillExtraCondition {
  return { field: "", operator: "", value: "" };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function AutofillRulesSheet({
  open,
  onOpenChange,
  targetInputId,
  targetInputLabel,
  inputsEndpoint = "/api/inputs",
  onSaved,
  pendingRules,
  onPendingRulesChange,
}: AutofillRulesSheetProps) {
  const isPending = Boolean(onPendingRulesChange);
  const [inputs, setInputs] = useState<InputField[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [sourceInputId, setSourceInputId] = useState<string>("");
  const [sourcePopoverOpen, setSourcePopoverOpen] = useState(false);
  const [sourceLinkedRules, setSourceLinkedRules] = useState<SourceLinkedRule[]>([]);
  const [loadingLinkedRules, setLoadingLinkedRules] = useState(false);

  const [ruleConfigs, setRuleConfigs] = useState<
    Map<string | number, { expression: string; locked: boolean; conditions: AutofillExtraCondition[] }>
  >(new Map());

  const [columnsByTable, setColumnsByTable] = useState<
    Record<string, { name: string; type: string }[]>
  >({});
  const [loadingColumnsFor, setLoadingColumnsFor] = useState<string | null>(null);

  const [expandedConditions, setExpandedConditions] = useState<Set<string | number>>(new Set());

  const inputsById = new Map(inputs.map((inp) => [inp.id, inp]));

  /* ---- Fetch inputs + existing autofill rules on open ---- */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Always fetch inputs list
        const inputsRes = await fetch(inputsEndpoint);
        const inputsJson = await inputsRes.json().catch(() => []);

        if (cancelled) return;
        const inputList = Array.isArray(inputsJson) ? inputsJson : [];
        setInputs(inputList);

        // In pending mode, initialize from pendingRules prop
        if (isPending) {
          if (pendingRules && pendingRules.length > 0) {
            setSourceInputId(String(pendingRules[0].source_input_id ?? ""));
            const configMap = new Map<
              string | number,
              { expression: string; locked: boolean; conditions: AutofillExtraCondition[] }
            >();
            for (const r of pendingRules) {
              configMap.set(r.source_linked_rule_id, {
                expression: r.expression ?? "",
                locked: r.locked ?? false,
                conditions: Array.isArray(r.conditions) ? r.conditions : [],
              });
            }
            setRuleConfigs(configMap);
          } else {
            setSourceInputId("");
            setRuleConfigs(new Map());
          }
        } else {
          // Fetch existing rules from API
          const existingRes = await fetch(`/api/input-autofill-rules?target_input_id=${targetInputId}`);
          const existingJson = await existingRes.json().catch(() => ({ rules: [] }));

          if (!cancelled) {
            const existing = Array.isArray(existingJson.rules) ? existingJson.rules : [];
            if (existing.length > 0) {
              const firstRule = existing[0];
              setSourceInputId(String(firstRule.source_input_id ?? ""));

              const configMap = new Map<
                string | number,
                { expression: string; locked: boolean; conditions: AutofillExtraCondition[] }
              >();
              for (const r of existing) {
                configMap.set(r.source_linked_rule_id, {
                  expression: r.expression ?? "",
                  locked: r.locked ?? false,
                  conditions: Array.isArray(r.conditions) ? r.conditions : [],
                });
              }
              setRuleConfigs(configMap);
            } else {
              setSourceInputId("");
              setRuleConfigs(new Map());
            }
          }
        }
      } catch {
        if (!cancelled) {
          setInputs([]);
          setSourceInputId("");
          setRuleConfigs(new Map());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [open, targetInputId, inputsEndpoint, isPending, pendingRules]);

  /* ---- Fetch linked rules when source changes ---- */
  useEffect(() => {
    if (!sourceInputId) {
      setSourceLinkedRules([]);
      return;
    }
    let cancelled = false;

    const fetchLinkedRules = async () => {
      setLoadingLinkedRules(true);
      try {
        const res = await fetch(`/api/input-linked-rules?input_id=${sourceInputId}`);
        const json = await res.json().catch(() => ({ rules: [] }));
        if (!cancelled) {
          const rules = Array.isArray(json.rules) ? json.rules : [];
          setSourceLinkedRules(rules);

          const tables = new Set(rules.map((r: SourceLinkedRule) => r.linked_table).filter(Boolean));
          for (const table of tables) {
            fetchColumnsForTable(table as string);
          }
        }
      } catch {
        if (!cancelled) setSourceLinkedRules([]);
      } finally {
        if (!cancelled) setLoadingLinkedRules(false);
      }
    };

    fetchLinkedRules();
    return () => {
      cancelled = true;
    };
  }, [sourceInputId]);

  const fetchColumnsForTable = useCallback(
    async (table: string) => {
      if (!table || columnsByTable[table]) return;
      setLoadingColumnsFor(table);
      try {
        const res = await fetch(
          `/api/supabase-schema?type=columns&table=${encodeURIComponent(table)}`
        );
        const json = await res.json().catch(() => ({}));
        setColumnsByTable((prev) => ({
          ...prev,
          [table]: Array.isArray(json.columns)
            ? json.columns
            : Array.isArray(json)
              ? json
              : [],
        }));
      } catch {
        // ignore
      } finally {
        setLoadingColumnsFor(null);
      }
    },
    [columnsByTable]
  );

  /* ---- Rule config helpers ---- */
  const getConfig = (ruleId: string | number) => {
    return ruleConfigs.get(ruleId) ?? { expression: "", locked: false, conditions: [] };
  };

  const updateConfig = useCallback(
    (
      ruleId: string | number,
      patch: Partial<{ expression: string; locked: boolean; conditions: AutofillExtraCondition[] }>
    ) => {
      setRuleConfigs((prev) => {
        const next = new Map(prev);
        const current = next.get(ruleId) ?? { expression: "", locked: false, conditions: [] };
        next.set(ruleId, { ...current, ...patch });
        return next;
      });
    },
    []
  );

  const toggleConditions = useCallback((ruleId: string | number) => {
    setExpandedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  }, []);

  /* ---- Save ---- */
  const handleSave = async () => {
    const rules: AutofillRuleConfig[] = sourceLinkedRules.map((lr, idx) => {
      const cfg = getConfig(lr.id);
      return {
        source_input_id: sourceInputId,
        source_linked_rule_id: lr.id,
        rule_order: idx,
        conditions: cfg.conditions.filter((c) => c.field && c.operator),
        logic_type: "AND" as const,
        expression: cfg.expression,
        locked: cfg.locked,
      };
    });

    if (isPending && onPendingRulesChange) {
      onPendingRulesChange(rules);
      onOpenChange(false);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/input-autofill-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_input_id: targetInputId, rules }),
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

  /* ---- Reset state when sheet closes ---- */
  useEffect(() => {
    if (!open) {
      setSubmitError(null);
      setExpandedConditions(new Set());
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4" />
            Auto-Fill Rules for &quot;{targetInputLabel}&quot;
          </SheetTitle>
          <SheetDescription className="text-xs">
            Configure how this input gets auto-filled based on a source
            input&apos;s linked database rules. Select a source input, then
            configure the column expression and lock behavior for each of its
            linked rules.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <>
              {/* Source Input Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Source Input (linked dropdown)
                </Label>
                <Popover open={sourcePopoverOpen} onOpenChange={setSourcePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sourcePopoverOpen}
                      className="w-full justify-between font-normal h-9 text-xs"
                    >
                      <span className={cn("truncate", !sourceInputId && "text-muted-foreground")}>
                        {sourceInputId
                          ? inputs.find((inp) => inp.id === sourceInputId)?.input_label ?? "Select..."
                          : "Select a source input..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0 z-[100]"
                    align="start"
                    side="bottom"
                    sideOffset={4}
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
                                setSourceInputId(inp.id);
                                setRuleConfigs(new Map());
                                setExpandedConditions(new Set());
                                setSourcePopoverOpen(false);
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
              </div>

              {/* Linked rules loading */}
              {sourceInputId && loadingLinkedRules && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Loading linked rules...
                </div>
              )}

              {/* Linked rule cards */}
              {sourceInputId && !loadingLinkedRules && sourceLinkedRules.length > 0 && (
                <div className="space-y-3">
                  {sourceLinkedRules.map((lr, idx) => {
                    const cfg = getConfig(lr.id);
                    const columns = lr.linked_table
                      ? columnsByTable[lr.linked_table] ?? []
                      : [];
                    const isLoadingCols = loadingColumnsFor === lr.linked_table;
                    const hasConditions = lr.conditions && lr.conditions.length > 0;
                    const conditionsExpanded = expandedConditions.has(lr.id);

                    return (
                      <div key={lr.id} className="rounded-lg border bg-card">
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">
                              {hasConditions ? `Rule ${idx + 1}` : "Default (always matches)"}
                            </span>
                          </div>
                          {lr.linked_table && (
                            <Badge variant="secondary" className="text-[10px] font-mono">
                              <Database className="size-2.5 mr-1" />
                              {formatTableLabel(lr.linked_table)}
                            </Badge>
                          )}
                        </div>

                        {/* Source conditions (read-only) */}
                        {hasConditions && (
                          <div className="px-3 py-2 border-b bg-muted/10">
                            <p className="text-[10px] text-muted-foreground">
                              <span className="font-medium uppercase tracking-wider">
                                When:
                              </span>{" "}
                              {formatConditions(lr.conditions, inputsById)}
                            </p>
                          </div>
                        )}

                        <div className="p-3 space-y-3">
                          {/* Column Expression */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              Column Expression
                            </Label>
                            <ColumnExpressionInput
                              value={cfg.expression}
                              onChange={(val) => updateConfig(lr.id, { expression: val })}
                              columns={columns}
                              loading={isLoadingCols}
                              placeholder="e.g. @entity_name"
                            />
                          </div>

                          {/* Locked toggle */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              Editability
                            </Label>
                            <Select
                              value={cfg.locked ? "locked" : "editable"}
                              onValueChange={(val) =>
                                updateConfig(lr.id, { locked: val === "locked" })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="editable">Editable</SelectItem>
                                <SelectItem value="locked">Locked (read-only)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Extra Conditions (expandable) */}
                          <div className="space-y-2">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => toggleConditions(lr.id)}
                            >
                              {conditionsExpanded ? (
                                <ChevronDown className="size-3" />
                              ) : (
                                <ChevronRight className="size-3" />
                              )}
                              Additional Conditions
                              {cfg.conditions.length > 0 && (
                                <Badge variant="secondary" className="text-[9px] ml-1 px-1 py-0">
                                  {cfg.conditions.length}
                                </Badge>
                              )}
                            </button>

                            {conditionsExpanded && (
                              <div className="space-y-2 pl-4 border-l-2 border-muted">
                                {cfg.conditions.map((cond, ci) => (
                                  <ExtraConditionRow
                                    key={ci}
                                    condition={cond}
                                    inputs={inputs}
                                    onChange={(patch) => {
                                      const updated = [...cfg.conditions];
                                      updated[ci] = { ...updated[ci], ...patch };
                                      updateConfig(lr.id, { conditions: updated });
                                    }}
                                    onRemove={() => {
                                      const updated = cfg.conditions.filter(
                                        (_, i) => i !== ci
                                      );
                                      updateConfig(lr.id, { conditions: updated });
                                    }}
                                  />
                                ))}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() =>
                                    updateConfig(lr.id, {
                                      conditions: [
                                        ...cfg.conditions,
                                        defaultExtraCondition(),
                                      ],
                                    })
                                  }
                                >
                                  <Plus className="size-3 mr-1" />
                                  Add Extra Condition
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No linked rules on source */}
              {sourceInputId && !loadingLinkedRules && sourceLinkedRules.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  The selected source input has no linked rules configured.
                </div>
              )}

              {/* No source selected */}
              {!sourceInputId && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Select a source input to configure auto-fill rules.
                </div>
              )}
            </>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t flex items-center gap-2">
          {submitError && (
            <p className="text-xs text-destructive flex-1">{submitError}</p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={submitting || !sourceInputId || sourceLinkedRules.length === 0}
            >
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
/*  ExtraConditionRow                                                          */
/* -------------------------------------------------------------------------- */

function ExtraConditionRow({
  condition,
  inputs,
  onChange,
  onRemove,
}: {
  condition: AutofillExtraCondition;
  inputs: InputField[];
  onChange: (patch: Partial<AutofillExtraCondition>) => void;
  onRemove: () => void;
}) {
  const isValueless = VALUELESS_OPERATORS.has(condition.operator);

  return (
    <div className="flex items-start gap-1.5">
      {/* Field */}
      <Select
        value={condition.field || undefined}
        onValueChange={(val) => onChange({ field: val, operator: "", value: "" })}
      >
        <SelectTrigger className="h-8 text-[10px] w-40 shrink-0">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {inputs.map((inp) => (
            <SelectItem key={inp.id} value={inp.id}>
              {inp.input_label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator */}
      <Select
        value={condition.operator || undefined}
        onValueChange={(val) => {
          if (VALUELESS_OPERATORS.has(val)) {
            onChange({ operator: val, value: "" });
          } else {
            onChange({ operator: val });
          }
        }}
      >
        <SelectTrigger className="h-8 text-[10px] w-36 shrink-0">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value */}
      {!isValueless && (
        <Input
          value={condition.value || ""}
          onChange={(e) => onChange({ value: e.target.value })}
          className="h-8 text-xs flex-1 min-w-0"
          placeholder="Value..."
        />
      )}

      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={onRemove}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
