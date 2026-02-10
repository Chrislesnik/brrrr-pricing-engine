"use client";

import { Button } from "@repo/ui/shadcn/button";
import { Badge } from "@repo/ui/shadcn/badge";
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
import { ChevronsUpDown, Check, X } from "lucide-react";
import { cn } from "@repo/lib/cn";

export type ConditionFieldOption = {
  value: string;
  label: string;
  operators: Array<{ value: string; label: string }>;
  valueOptions: Array<{
    value: string;
    label: string;
    description?: string | null;
  }>;
};

export type ConditionState = {
  field: string;
  operator: string;
  values: string[];
};

interface PolicyConditionRowProps {
  condition: ConditionState;
  fieldOptions: ConditionFieldOption[];
  onChange: (updated: ConditionState) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function PolicyConditionRow({
  condition,
  fieldOptions,
  onChange,
  onRemove,
  canRemove,
}: PolicyConditionRowProps) {
  const selectedField = fieldOptions.find((f) => f.value === condition.field);
  const operators = selectedField?.operators ?? [
    { value: "is", label: "is" },
  ];
  const valueOptions = selectedField?.valueOptions ?? [];

  function handleFieldChange(newField: string) {
    // Reset operator and values when field changes
    const newFieldOption = fieldOptions.find((f) => f.value === newField);
    onChange({
      field: newField,
      operator: newFieldOption?.operators[0]?.value ?? "is",
      values: [],
    });
  }

  function toggleValue(value: string) {
    const isSelected = condition.values.includes(value);
    let next: string[];
    if (isSelected) {
      next = condition.values.filter((v) => v !== value);
    } else {
      next = [...condition.values, value];
    }
    onChange({ ...condition, values: next });
  }

  return (
    <div className="flex items-start gap-2 flex-wrap">
      {/* Field selector */}
      <Select
        value={condition.field}
        onValueChange={handleFieldChange}
      >
        <SelectTrigger className="w-[180px] h-9 shrink-0">
          <SelectValue placeholder="Select field..." />
        </SelectTrigger>
        <SelectContent>
          {fieldOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      <Select
        value={condition.operator}
        onValueChange={(op) => onChange({ ...condition, operator: op })}
      >
        <SelectTrigger className="w-[100px] h-9 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Values multi-select combobox with chips */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="flex-1 min-w-[200px] justify-between font-normal h-auto min-h-9 shadow-xs"
          >
            <div className="flex flex-wrap gap-1 flex-1 min-w-0">
              {condition.values.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  Select values...
                </span>
              ) : (
                condition.values.map((v) => {
                  const opt = valueOptions.find((o) => o.value === v);
                  return (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="text-xs gap-1 pr-1"
                    >
                      {opt?.label ?? v}
                      <button
                        type="button"
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                        aria-label={`Remove ${opt?.label ?? v}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleValue(v);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[var(--radix-popover-trigger-width)]"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {valueOptions.map((opt) => {
                  const isSelected = condition.values.includes(opt.value);
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.value}
                      onSelect={() => toggleValue(opt.value)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/25"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span>{opt.label}</span>
                        {opt.description && (
                          <span className="text-xs text-muted-foreground">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove condition"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
