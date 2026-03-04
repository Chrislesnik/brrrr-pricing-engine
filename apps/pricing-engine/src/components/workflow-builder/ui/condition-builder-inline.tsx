"use client";

import { Button } from "@repo/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import { TemplateBadgeInput } from "./template-badge-input";

export const CONDITION_DATA_TYPES = [
  { value: "string", label: "T", title: "String" },
  { value: "number", label: "#", title: "Number" },
  { value: "boolean", label: "◉", title: "Boolean" },
  { value: "date", label: "◷", title: "Date" },
];

export const CONDITION_OPERATORS: Record<
  string,
  Array<{ value: string; label: string; unary?: boolean }>
> = {
  string: [
    { value: "equals", label: "is equal to" },
    { value: "not_equals", label: "is not equal to" },
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "starts_with", label: "starts with" },
    { value: "ends_with", label: "ends with" },
    { value: "is_empty", label: "is empty", unary: true },
    { value: "is_not_empty", label: "is not empty", unary: true },
  ],
  number: [
    { value: "equals", label: "is equal to" },
    { value: "not_equals", label: "is not equal to" },
    { value: "greater_than", label: "is greater than" },
    { value: "greater_than_or_equal", label: "is greater or equal" },
    { value: "less_than", label: "is less than" },
    { value: "less_than_or_equal", label: "is less or equal" },
  ],
  boolean: [
    { value: "is_true", label: "is true", unary: true },
    { value: "is_false", label: "is false", unary: true },
  ],
  date: [
    { value: "equals", label: "is equal to" },
    { value: "is_after", label: "is after" },
    { value: "is_before", label: "is before" },
  ],
};

export type ConditionRowData = {
  leftValue: string;
  operator: string;
  rightValue: string;
  dataType: string;
};

export type ConditionBuilderState = {
  match: "and" | "or";
  conditions: ConditionRowData[];
};

const DEFAULT_ROW: ConditionRowData = {
  leftValue: "",
  operator: "equals",
  rightValue: "",
  dataType: "string",
};

export function ConditionBuilderInline({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  let data: ConditionBuilderState;
  try {
    data = value ? JSON.parse(value) : null;
    if (!data?.conditions)
      data = { match: "and", conditions: [{ ...DEFAULT_ROW }] };
  } catch {
    data = { match: "and", conditions: [{ ...DEFAULT_ROW }] };
  }

  const update = (d: ConditionBuilderState) => onChange(JSON.stringify(d));

  const updateCond = (
    idx: number,
    key: keyof ConditionRowData,
    val: string,
  ) => {
    const updated = [...data.conditions];
    updated[idx] = { ...updated[idx], [key]: val };
    if (key === "dataType") {
      const opsList =
        CONDITION_OPERATORS[val] || CONDITION_OPERATORS.string;
      updated[idx].operator = opsList[0].value;
      updated[idx].rightValue = "";
    }
    update({ ...data, conditions: updated });
  };

  const ops = (dt: string) =>
    CONDITION_OPERATORS[dt] || CONDITION_OPERATORS.string;
  const isUnary = (dt: string, op: string) =>
    ops(dt).find((o) => o.value === op)?.unary ?? false;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">When</span>
        <Select
          disabled={disabled}
          value={data.match}
          onValueChange={(v) =>
            update({ ...data, match: v as "and" | "or" })
          }
        >
          <SelectTrigger className="w-[140px] h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">All conditions (AND)</SelectItem>
            <SelectItem value="or">Any condition (OR)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">are met</span>
      </div>

      {data.conditions.map((cond, idx) => (
        <div
          key={idx}
          className="space-y-1.5 rounded-lg border p-2.5 bg-muted/30"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">
              Value
            </span>
            <div className="flex-1 text-xs [&_.template-badge-input]:h-8 [&_.template-badge-input]:text-xs">
              <TemplateBadgeInput
                disabled={disabled}
                placeholder="Type @ to reference a node output"
                value={cond.leftValue}
                onChange={(val) => updateCond(idx, "leftValue", val)}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Select
              disabled={disabled}
              value={cond.dataType}
              onValueChange={(v) => updateCond(idx, "dataType", v)}
            >
              <SelectTrigger className="w-12 h-8 text-xs px-2 justify-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_DATA_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    <span title={dt.title}>
                      {dt.label} {dt.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              disabled={disabled}
              value={cond.operator}
              onValueChange={(v) => updateCond(idx, "operator", v)}
            >
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ops(cond.dataType).map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    <span className="text-xs">{op.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {data.conditions.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={disabled}
                onClick={() =>
                  update({
                    ...data,
                    conditions: data.conditions.filter(
                      (_, i) => i !== idx,
                    ),
                  })
                }
              >
                <span className="text-sm">×</span>
              </Button>
            )}
          </div>
          {!isUnary(cond.dataType, cond.operator) && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground w-10 shrink-0">
                With
              </span>
              <div className="flex-1 text-xs [&_.template-badge-input]:h-8 [&_.template-badge-input]:text-xs">
                <TemplateBadgeInput
                  disabled={disabled}
                  placeholder={
                    cond.dataType === "number"
                      ? "e.g. 100 or @node"
                      : cond.dataType === "date"
                        ? "e.g. 2024-01-01 or @node"
                        : "e.g. active or @node"
                  }
                  value={cond.rightValue}
                  onChange={(val) =>
                    updateCond(idx, "rightValue", val)
                  }
                />
              </div>
            </div>
          )}
          {idx < data.conditions.length - 1 && (
            <div className="flex items-center justify-center pt-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {data.match === "and" ? "AND" : "OR"}
              </span>
            </div>
          )}
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        disabled={disabled}
        onClick={() =>
          update({
            ...data,
            conditions: [...data.conditions, { ...DEFAULT_ROW }],
          })
        }
      >
        + Add Condition
      </Button>
    </div>
  );
}
