"use client";

import { Check, ChevronDown, ChevronsUpDown, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@repo/ui/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import { Button } from "@repo/ui/shadcn/button";
import { Switch } from "@repo/ui/shadcn/switch";
import { cn } from "@repo/lib/cn";
import { TemplateBadgeInput } from "@/components/workflow-builder/ui/template-badge-input";
import { TemplateBadgeTextarea } from "@/components/workflow-builder/ui/template-badge-textarea";
import {
  type ActionConfigField,
  type ActionConfigFieldBase,
  isFieldGroup,
} from "@/components/workflow-builder/plugins";
import { SchemaBuilder, type SchemaField } from "./schema-builder";

type FieldProps = {
  field: ActionConfigFieldBase;
  value: string;
  onChange: (value: unknown) => void;
  disabled?: boolean;
};

function TemplateInputField({ field, value, onChange, disabled }: FieldProps) {
  return (
    <TemplateBadgeInput
      disabled={disabled}
      id={field.key}
      onChange={onChange}
      placeholder={field.placeholder}
      value={value}
    />
  );
}

function TemplateTextareaField({
  field,
  value,
  onChange,
  disabled,
}: FieldProps) {
  return (
    <TemplateBadgeTextarea
      disabled={disabled}
      id={field.key}
      onChange={onChange}
      placeholder={field.placeholder}
      rows={field.rows || 4}
      value={value}
    />
  );
}

function TextInputField({ field, value, onChange, disabled }: FieldProps) {
  return (
    <Input
      disabled={disabled}
      id={field.key}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      value={value}
    />
  );
}

function NumberInputField({ field, value, onChange, disabled }: FieldProps) {
  return (
    <Input
      disabled={disabled}
      id={field.key}
      min={field.min}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      type="number"
      value={value}
    />
  );
}

function SelectField({ field, value, onChange, disabled }: FieldProps) {
  if (!field.options) {
    return null;
  }

  return (
    <Select disabled={disabled} onValueChange={onChange} value={value}>
      <SelectTrigger className="w-full" id={field.key}>
        <SelectValue placeholder={field.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {field.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SchemaBuilderField(props: FieldProps) {
  return (
    <SchemaBuilder
      disabled={props.disabled}
      onChange={(schema) => props.onChange(JSON.stringify(schema))}
      schema={props.value ? (JSON.parse(props.value) as SchemaField[]) : []}
    />
  );
}

/**
 * Maps Postgres column types to schema builder types.
 */
function mapPostgresTypeToSchemaType(pgType: string): "string" | "number" | "boolean" | "object" | "array" {
  const t = pgType.toLowerCase();
  if (t === "boolean" || t === "bool") return "boolean";
  if (
    t === "integer" || t === "int" || t === "int4" || t === "int8" ||
    t === "bigint" || t === "smallint" || t === "int2" ||
    t === "numeric" || t === "decimal" || t === "real" || t === "float4" ||
    t === "double precision" || t === "float8" || t === "serial" || t === "bigserial"
  ) return "number";
  if (t === "jsonb" || t === "json") return "object";
  if (t.startsWith("_") || t.includes("[]") || t === "array") return "array";
  // uuid, text, varchar, character varying, timestamp, timestamptz, date, time, etc.
  return "string";
}

/**
 * Supabase Table picker - searchable combobox that fetches tables from the schema API.
 * Falls back to text input if fetch fails.
 */
function SupabaseTableField({ field, value, onChange, disabled, onUpdateConfig }: FieldProps & { onUpdateConfig?: (key: string, value: unknown) => void }) {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/supabase-schema?type=tables");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.tables)) {
            setTables(data.tables);
          }
        }
      } catch {
        // ignore - will fall back to text input
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-populate outputSchema when the selected table changes.
  // This runs in a useEffect so that onUpdateConfig uses the latest
  // render's closure (which already includes the updated table value),
  // avoiding the stale-closure bug that previously clobbered the table.
  useEffect(() => {
    if (!onUpdateConfig) return;
    if (!value) {
      onUpdateConfig("outputSchema", "");
      return;
    }
    let cancelled = false;
    fetch(`/api/supabase-schema?type=columns&table=${encodeURIComponent(value)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.columns)) {
          const schema = data.columns.map((col: { name: string; type: string }) => ({
            name: col.name,
            type: mapPostgresTypeToSchemaType(col.type),
            description: col.type,
          }));
          onUpdateConfig("outputSchema", JSON.stringify(schema));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground h-9 px-3 border rounded-md">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading tables...
      </div>
    );
  }

  if (tables.length > 0) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
            id={field.key}
          >
            {value ? value : "Select a table..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tables..." />
            <CommandEmpty>No table found.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {tables.map((table) => (
                <CommandItem
                  key={table}
                  value={table}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {table}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Fallback to text input
  return (
    <Input
      disabled={disabled}
      id={field.key}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      value={value}
    />
  );
}

/**
 * Supabase Column picker - searchable combobox that fetches columns based on selected table.
 */
function SupabaseColumnField({ field, value, onChange, disabled, config }: FieldProps & { config?: Record<string, unknown> }) {
  const [columns, setColumns] = useState<Array<{ name: string; type: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const tableName = (config?.table as string) || "";

  useEffect(() => {
    if (!tableName) {
      setColumns([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/supabase-schema?type=columns&table=${encodeURIComponent(tableName)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.columns)) {
            setColumns(data.columns);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tableName]);

  if (!tableName) {
    return (
      <Input
        disabled
        placeholder="Select a table first..."
        value=""
        id={field.key}
        onChange={() => {}}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground h-9 px-3 border rounded-md">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading columns...
      </div>
    );
  }

  if (columns.length > 0) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
            id={field.key}
          >
            {value ? `${value}` : "Select a column..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search columns..." />
            <CommandEmpty>No column found.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {columns.map((col) => (
                <CommandItem
                  key={col.name}
                  value={col.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === col.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{col.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{col.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Fallback
  return (
    <Input
      disabled={disabled}
      id={field.key}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || "Enter column name"}
      value={value}
    />
  );
}

/**
 * Supabase Filter Builder - multi-condition filter with AND/OR.
 * Stores as JSON string: [{ column, operator, value }, ...]
 */
const FILTER_OPERATORS = [
  { value: "eq", label: "Equals" },
  { value: "neq", label: "Not Equals" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less or Equal" },
  { value: "like", label: "Like" },
  { value: "ilike", label: "Contains (case-insensitive)" },
  { value: "is", label: "Is (null)" },
  { value: "in", label: "In (comma-separated)" },
];

type FilterCondition = { column: string; operator: string; value: string };

function SupabaseFilterBuilderField({ field, value, onChange, disabled, config }: FieldProps & { config?: Record<string, unknown> }) {
  const [columns, setColumns] = useState<Array<{ name: string; type: string }>>([]);
  const tableName = (config?.table as string) || "";

  let conditions: FilterCondition[] = [];
  try {
    conditions = value ? JSON.parse(value) : [];
  } catch {
    conditions = [];
  }

  useEffect(() => {
    if (!tableName) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/supabase-schema?type=columns&table=${encodeURIComponent(tableName)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.columns)) {
            setColumns(data.columns);
          }
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [tableName]);

  const updateConditions = (newConditions: FilterCondition[]) => {
    onChange(JSON.stringify(newConditions));
  };

  const addCondition = () => {
    updateConditions([...conditions, { column: "", operator: "eq", value: "" }]);
  };

  const removeCondition = (index: number) => {
    updateConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, key: keyof FilterCondition, val: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [key]: val };
    updateConditions(updated);
  };

  return (
    <div className="space-y-2">
      {conditions.map((cond, idx) => (
        <div key={idx} className="rounded-md border p-2.5 space-y-2">
          {/* Row 1: Column + Operator + Delete */}
          <div className="flex items-center gap-1.5">
            <Select
              disabled={disabled || !tableName}
              value={cond.column}
              onValueChange={(v) => updateCondition(idx, "column", v)}
            >
              <SelectTrigger className="flex-1 text-xs h-8">
                <SelectValue placeholder="Column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    <span className="text-xs">{col.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              disabled={disabled}
              value={cond.operator}
              onValueChange={(v) => updateCondition(idx, "operator", v)}
            >
              <SelectTrigger className="flex-1 text-xs h-8">
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    <span className="text-xs">{op.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              disabled={disabled}
              onClick={() => removeCondition(idx)}
            >
              <span className="text-sm">×</span>
            </Button>
          </div>

          {/* Row 2: Value */}
          <div className="text-xs">
            <TemplateBadgeInput
              disabled={disabled}
              placeholder="Value or @node"
              value={cond.value}
              onChange={(val) => updateCondition(idx, "value", val)}
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        disabled={disabled || !tableName}
        onClick={addCondition}
      >
        + Add Condition
      </Button>
    </div>
  );
}

/**
 * Supabase Schema Builder - wraps the standard SchemaBuilder with a refresh button
 * that re-fetches columns from the selected table.
 */
function SupabaseSchemaBuilderField({
  field,
  value,
  onChange,
  disabled,
  config,
  onUpdateConfig,
}: FieldProps & { config?: Record<string, unknown>; onUpdateConfig?: (key: string, value: unknown) => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const tableName = (config?.table as string) || "";

  const handleRefresh = async () => {
    if (!tableName || refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/supabase-schema?type=columns&table=${encodeURIComponent(tableName)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.columns)) {
          const schema = data.columns.map((col: { name: string; type: string }) => ({
            name: col.name,
            type: mapPostgresTypeToSchemaType(col.type),
            description: col.type,
          }));
          // Only call onChange (sets outputSchema) — do NOT make a separate
          // onUpdateConfig call here, because handleUpdateConfig spreads from
          // stale selectedNode.data.config and the second call would clobber the first.
          onChange(JSON.stringify(schema));
        }
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="ml-1" htmlFor={field.key}>
          {field.label}
        </Label>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          disabled={disabled || !tableName || refreshing}
          onClick={handleRefresh}
          title={tableName ? `Refresh columns from "${tableName}"` : "Select a table first"}
        >
          <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      <SchemaBuilder
        disabled={disabled}
        onChange={(schema) => onChange(JSON.stringify(schema))}
        schema={value ? (JSON.parse(value) as SchemaField[]) : []}
      />
    </div>
  );
}

function ToggleField({ field, value, onChange, disabled }: FieldProps) {
  const checked = value === "true";
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label htmlFor={field.key} className="text-sm font-normal cursor-pointer">
        {field.label}
      </Label>
      <Switch
        id={field.key}
        disabled={disabled}
        checked={checked}
        onCheckedChange={(val) => onChange(val ? "true" : "false")}
      />
    </div>
  );
}

const FIELD_RENDERERS: Record<
  string,
  React.ComponentType<FieldProps>
> = {
  "template-input": TemplateInputField,
  "template-textarea": TemplateTextareaField,
  text: TextInputField,
  number: NumberInputField,
  select: SelectField,
  toggle: ToggleField,
  "schema-builder": SchemaBuilderField,
  "condition-builder": ConditionBuilderField,
};

/**
 * Condition Builder - visual IF condition builder with typed operators and AND/OR.
 */
const DATA_TYPES = [
  { value: "string", label: "T", title: "String" },
  { value: "number", label: "#", title: "Number" },
  { value: "boolean", label: "◉", title: "Boolean" },
  { value: "date", label: "◷", title: "Date" },
];

const OPERATORS_BY_TYPE: Record<string, Array<{ value: string; label: string; unary?: boolean }>> = {
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
    { value: "greater_than_or_equal", label: "is greater than or equal" },
    { value: "less_than", label: "is less than" },
    { value: "less_than_or_equal", label: "is less than or equal" },
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

type ConditionRow = {
  leftValue: string;
  operator: string;
  rightValue: string;
  dataType: string;
};

type ConditionBuilderData = {
  match: "and" | "or";
  conditions: ConditionRow[];
};

function ConditionBuilderField({ field, value, onChange, disabled }: FieldProps) {
  let data: ConditionBuilderData;
  try {
    data = value ? JSON.parse(value) : { match: "and", conditions: [] };
    if (!data.conditions) data = { match: "and", conditions: [] };
  } catch {
    data = { match: "and", conditions: [] };
  }

  // Auto-add first condition if empty
  if (data.conditions.length === 0) {
    data = {
      ...data,
      conditions: [{ leftValue: "", operator: "equals", rightValue: "", dataType: "string" }],
    };
  }

  const update = (newData: ConditionBuilderData) => {
    onChange(JSON.stringify(newData));
  };

  const updateCondition = (index: number, key: keyof ConditionRow, val: string) => {
    const updated = [...data.conditions];
    updated[index] = { ...updated[index], [key]: val };

    // Reset operator when data type changes
    if (key === "dataType") {
      const ops = OPERATORS_BY_TYPE[val] || OPERATORS_BY_TYPE.string;
      updated[index].operator = ops[0].value;
      updated[index].rightValue = "";
    }

    update({ ...data, conditions: updated });
  };

  const addCondition = () => {
    update({
      ...data,
      conditions: [...data.conditions, { leftValue: "", operator: "equals", rightValue: "", dataType: "string" }],
    });
  };

  const removeCondition = (index: number) => {
    if (data.conditions.length <= 1) return;
    update({ ...data, conditions: data.conditions.filter((_, i) => i !== index) });
  };

  const operators = (dataType: string) => OPERATORS_BY_TYPE[dataType] || OPERATORS_BY_TYPE.string;
  const isUnary = (dataType: string, operator: string) =>
    operators(dataType).find((o) => o.value === operator)?.unary ?? false;

  return (
    <div className="space-y-3">
      {/* AND/OR Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">When</span>
        <Select
          disabled={disabled}
          value={data.match}
          onValueChange={(v) => update({ ...data, match: v as "and" | "or" })}
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

      {/* Condition Rows */}
      {data.conditions.map((cond, idx) => (
        <div key={idx} className="space-y-1.5 rounded-lg border p-2.5 bg-muted/30">
          {/* Row 1: Left value */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">Value</span>
            <div className="flex-1 text-xs">
              <TemplateBadgeInput
                disabled={disabled}
                placeholder="Type @ to reference a node output"
                value={cond.leftValue}
                onChange={(val) => updateCondition(idx, "leftValue", val)}
              />
            </div>
          </div>

          {/* Row 2: Type + Operator */}
          <div className="flex items-center gap-1.5">
            {/* Data Type */}
            <Select
              disabled={disabled}
              value={cond.dataType}
              onValueChange={(v) => updateCondition(idx, "dataType", v)}
            >
              <SelectTrigger className="w-12 h-8 text-xs px-2 justify-center" title="Data type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    <span title={dt.title}>{dt.label} {dt.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator */}
            <Select
              disabled={disabled}
              value={cond.operator}
              onValueChange={(v) => updateCondition(idx, "operator", v)}
            >
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators(cond.dataType).map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    <span className="text-xs">{op.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Delete */}
            {data.conditions.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={disabled}
                onClick={() => removeCondition(idx)}
              >
                <span className="text-sm">×</span>
              </Button>
            )}
          </div>

          {/* Row 3: Right value (hidden for unary operators) */}
          {!isUnary(cond.dataType, cond.operator) && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground w-10 shrink-0">With</span>
              <div className="flex-1 text-xs">
                <TemplateBadgeInput
                  disabled={disabled}
                  placeholder={cond.dataType === "number" ? "e.g. 100 or @node" : cond.dataType === "date" ? "e.g. 2024-01-01 or @node" : "e.g. active or @node"}
                  value={cond.rightValue}
                  onChange={(val) => updateCondition(idx, "rightValue", val)}
                />
              </div>
            </div>
          )}

          {/* AND/OR divider between conditions */}
          {idx < data.conditions.length - 1 && (
            <div className="flex items-center justify-center pt-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {data.match === "and" ? "AND" : "OR"}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Add Condition */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        disabled={disabled}
        onClick={addCondition}
      >
        + Add Condition
      </Button>
    </div>
  );
}

/** Fields that need access to the full config (e.g., to read the selected table) */
const CONFIG_AWARE_FIELDS: Record<
  string,
  React.ComponentType<FieldProps & { config?: Record<string, unknown>; onUpdateConfig?: (key: string, value: unknown) => void }>
> = {
  "supabase-table": SupabaseTableField as React.ComponentType<FieldProps & { config?: Record<string, unknown>; onUpdateConfig?: (key: string, value: unknown) => void }>,
  "supabase-column": SupabaseColumnField,
  "supabase-filter-builder": SupabaseFilterBuilderField,
  "supabase-schema-builder": SupabaseSchemaBuilderField,
};

/**
 * Renders a single base field
 */
function renderField(
  field: ActionConfigFieldBase,
  config: Record<string, unknown>,
  onUpdateConfig: (key: string, value: unknown) => void,
  disabled?: boolean
) {
  // Check conditional rendering
  if (field.showWhen) {
    const dependentValue = config[field.showWhen.field] as string | undefined;
    // Treat undefined/empty as defaultValue of the dependent field, or just compare directly
    const effectiveValue = dependentValue ?? "";
    const expectedValue = field.showWhen.equals;
    // For "false" comparisons, also treat empty/undefined as "false"
    const matches =
      effectiveValue === expectedValue ||
      (expectedValue === "false" && !effectiveValue);
    if (!matches) {
      return null;
    }
  }

  const value =
    (config[field.key] as string | undefined) || field.defaultValue || "";

  // Check for config-aware fields first (need full config for context like selected table)
  const ConfigAwareRenderer = CONFIG_AWARE_FIELDS[field.type];
  if (ConfigAwareRenderer) {
    // supabase-schema-builder renders its own label (with inline refresh button)
    const skipLabel = field.type === "supabase-schema-builder";
    return (
      <div className="space-y-2" key={field.key}>
        {!skipLabel && (
          <Label className="ml-1" htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <ConfigAwareRenderer
          config={config}
          disabled={disabled}
          field={field}
          onChange={(val) => onUpdateConfig(field.key, val)}
          onUpdateConfig={onUpdateConfig}
          value={value}
        />
      </div>
    );
  }

  const FieldRenderer = FIELD_RENDERERS[field.type];

  // Toggle renders its own inline label
  if (field.type === "toggle") {
    return (
      <div key={field.key}>
        <FieldRenderer
          disabled={disabled}
          field={field}
          onChange={(val) => onUpdateConfig(field.key, val)}
          value={value}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2" key={field.key}>
      <Label className="ml-1" htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </Label>
      <FieldRenderer
        disabled={disabled}
        field={field}
        onChange={(val) => onUpdateConfig(field.key, val)}
        value={value}
      />
    </div>
  );
}

/**
 * Collapsible field group component
 */
function FieldGroup({
  label,
  fields,
  config,
  onUpdateConfig,
  disabled,
  defaultExpanded = false,
}: {
  label: string;
  fields: ActionConfigFieldBase[];
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="space-y-2">
      <button
        className="ml-1 flex items-center gap-1 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <span className="font-medium text-sm">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? "" : "-rotate-90"
          }`}
        />
      </button>
      {isExpanded && (
        <div className="ml-1 space-y-4 border-primary/50 border-l-2 py-2 pl-3">
          {fields.map((field) =>
            renderField(field, config, onUpdateConfig, disabled)
          )}
        </div>
      )}
    </div>
  );
}

type ActionConfigRendererProps = {
  fields: ActionConfigField[];
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
};

/**
 * Renders action config fields declaratively
 * Converts ActionConfigField definitions into actual UI components
 */
export function ActionConfigRenderer({
  fields,
  config,
  onUpdateConfig,
  disabled,
}: ActionConfigRendererProps) {
  return (
    <>
      {fields.map((field) => {
        if (isFieldGroup(field)) {
          return (
            <FieldGroup
              config={config}
              defaultExpanded={field.defaultExpanded}
              disabled={disabled}
              fields={field.fields}
              key={`group-${field.label}`}
              label={field.label}
              onUpdateConfig={onUpdateConfig}
            />
          );
        }

        return renderField(field, config, onUpdateConfig, disabled);
      })}
    </>
  );
}
