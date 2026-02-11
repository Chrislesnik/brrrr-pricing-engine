"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
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

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface InputField {
  id: string;
  input_label: string;
  input_type: string;
  category: string;
}

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  input_id: string;
  value_text: string;
}

interface LogicRule {
  type: "AND" | "OR";
  conditions: Condition[];
  actions: Action[];
}

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "notEquals", label: "Not Equals" },
  { value: "greaterThan", label: "Greater Than" },
  { value: "lessThan", label: "Less Than" },
  { value: "contains", label: "Contains" },
  { value: "isEmpty", label: "Is Empty" },
  { value: "isNotEmpty", label: "Is Not Empty" },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function LogicBuilderSheet({
  open,
  onOpenChange,
  filterInputId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterInputId?: string | null;
}) {
  const [inputs, setInputs] = useState<InputField[]>([]);
  const [rules, setRules] = useState<LogicRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch inputs metadata when sheet opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/inputs");
        const json = await res.json().catch(() => []);
        if (!cancelled) {
          setInputs(Array.isArray(json) ? json : []);
        }
      } catch {
        if (!cancelled) setInputs([]);
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
        const url = filterInputId
          ? `/api/input-logic?input_id=${filterInputId}`
          : "/api/input-logic";
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && Array.isArray(json.rules)) {
            setRules(json.rules);
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
  }, [open, filterInputId]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setRules([]);
      setSubmitError(null);
    }
  }, [open]);

  /* ---- Rule manipulation ---- */

  const addRule = useCallback(() => {
    const newRule: LogicRule = {
      type: "AND",
      conditions: [{ field: "", operator: "", value: "" }],
      actions: [
        {
          input_id: filterInputId ?? "",
          value_text: "",
        },
      ],
    };
    setRules((prev) => [...prev, newRule]);
  }, [filterInputId]);

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
              conditions: [
                ...r.conditions,
                { field: "", operator: "", value: "" },
              ],
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

  /* ---- Action manipulation ---- */

  const addAction = useCallback(
    (ruleIndex: number) => {
      setRules((prev) =>
        prev.map((r, i) =>
          i === ruleIndex
            ? {
                ...r,
                actions: [
                  ...r.actions,
                  { input_id: filterInputId ?? "", value_text: "" },
                ],
              }
            : r
        )
      );
    },
    [filterInputId]
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
      field: keyof Action,
      value: string
    ) => {
      setRules((prev) =>
        prev.map((r, i) => {
          if (i !== ruleIndex) return r;
          const newActions = [...r.actions];
          newActions[actionIndex] = {
            ...newActions[actionIndex],
            [field]: value,
          };
          return { ...r, actions: newActions };
        })
      );
    },
    []
  );

  /* ---- Save ---- */

  const handleSave = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/input-logic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
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
  }, [rules, onOpenChange]);

  /* ---- Helpers ---- */

  const getInputLabel = (inputId: string): string => {
    const inp = inputs.find((i) => i.id === inputId);
    return inp ? inp.input_label : inputId;
  };

  const filteredInputLabel = filterInputId
    ? getInputLabel(filterInputId)
    : null;

  /* ---- Render ---- */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {filterInputId
              ? `Logic Builder — ${filteredInputLabel}`
              : "Logic Builder"}
          </SheetTitle>
          <SheetDescription>
            {filterInputId
              ? `Create rules that control the behavior of "${filteredInputLabel}".`
              : "Create logic rules with conditions and actions for your inputs."}
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
                    Add a rule to define conditional behavior.
                  </p>
                </div>
              ) : (
                rules.map((rule, ruleIndex) => (
                  <div
                    key={ruleIndex}
                    className="rounded-lg border bg-muted/30 shadow-sm"
                  >
                    {/* Rule header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <span className="text-sm font-semibold">
                        Rule #{ruleIndex + 1}
                      </span>
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
                            <div
                              key={condIndex}
                              className="flex items-center gap-2"
                            >
                              {/* Field dropdown */}
                              <Select
                                value={cond.field || undefined}
                                onValueChange={(val) =>
                                  updateCondition(
                                    ruleIndex,
                                    condIndex,
                                    "field",
                                    val
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 text-xs flex-1">
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

                              {/* Operator dropdown */}
                              <Select
                                value={cond.operator || undefined}
                                onValueChange={(val) =>
                                  updateCondition(
                                    ruleIndex,
                                    condIndex,
                                    "operator",
                                    val
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 text-xs w-36">
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

                              {/* Value input */}
                              <Input
                                value={cond.value}
                                onChange={(e) =>
                                  updateCondition(
                                    ruleIndex,
                                    condIndex,
                                    "value",
                                    e.target.value
                                  )
                                }
                                placeholder="Value"
                                className="h-8 text-xs flex-1"
                              />

                              {/* Remove condition */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  removeCondition(ruleIndex, condIndex)
                                }
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
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
                            <div
                              key={actionIndex}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs font-medium text-muted-foreground shrink-0">
                                Set
                              </span>

                              {/* Input dropdown */}
                              {filterInputId && action.input_id === filterInputId ? (
                                <div className="h-8 flex items-center px-3 rounded-md border bg-muted text-xs flex-1">
                                  {filteredInputLabel}
                                </div>
                              ) : (
                                <Select
                                  value={action.input_id || undefined}
                                  onValueChange={(val) =>
                                    updateAction(
                                      ruleIndex,
                                      actionIndex,
                                      "input_id",
                                      val
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs flex-1">
                                    <SelectValue placeholder="Select input" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {inputs.map((inp) => (
                                      <SelectItem key={inp.id} value={inp.id}>
                                        {inp.input_label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}

                              <span className="text-xs font-medium text-muted-foreground shrink-0">
                                to
                              </span>

                              {/* Value input */}
                              <Input
                                value={action.value_text}
                                onChange={(e) =>
                                  updateAction(
                                    ruleIndex,
                                    actionIndex,
                                    "value_text",
                                    e.target.value
                                  )
                                }
                                placeholder="Value"
                                className="h-8 text-xs flex-1"
                              />

                              {/* Remove action */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  removeAction(ruleIndex, actionIndex)
                                }
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
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
                ))
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
              disabled={submitting || rules.length === 0}
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
