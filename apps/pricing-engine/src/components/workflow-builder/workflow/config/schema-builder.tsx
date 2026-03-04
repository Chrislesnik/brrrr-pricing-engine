"use client";

import { useState } from "react";
import { AlertTriangle, Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { cn } from "@/components/workflow-builder/lib/utils";
import { Button } from "@repo/ui/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/shadcn/command";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";

export type SchemaField = {
  id?: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  itemType?: "string" | "number" | "boolean" | "object";
  fields?: SchemaField[];
  description?: string;
  inputId?: string;
  inputCode?: string;
};

export type InputOption = {
  id: string;
  input_label: string;
  input_code: string;
  input_type: string;
};

export function inputTypeToSchemaType(inputType: string): SchemaField["type"] {
  switch (inputType) {
    case "number":
    case "currency":
    case "percentage":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "string";
  }
}

/**
 * Returns true if any field has an input linked whose expected type
 * doesn't match the field's current schema type.
 */
export function hasSchemaTypeMismatches(
  schema: SchemaField[],
  inputs: InputOption[]
): boolean {
  for (const field of schema) {
    if (field.inputId) {
      const inp = inputs.find((i) => i.id === field.inputId);
      if (inp && inputTypeToSchemaType(inp.input_type) !== field.type) {
        return true;
      }
    }
    if (field.fields && hasSchemaTypeMismatches(field.fields, inputs)) {
      return true;
    }
  }
  return false;
}

type SchemaBuilderProps = {
  schema: SchemaField[];
  onChange: (schema: SchemaField[]) => void;
  disabled?: boolean;
  level?: number;
  inputs?: InputOption[];
};

export function SchemaBuilder({
  schema,
  onChange,
  disabled,
  level = 0,
  inputs,
}: SchemaBuilderProps) {
  const addField = () => {
    onChange([...schema, { id: nanoid(), name: "", type: "string" }]);
  };

  const resetDependentFields = (
    field: SchemaField,
    type: SchemaField["type"]
  ): SchemaField => {
    const updated = { ...field };

    if (type !== "array") {
      updated.itemType = undefined;
    }
    if (type !== "object") {
      updated.fields = undefined;
    }
    if (type === "array" && !updated.itemType) {
      updated.itemType = "string";
    }
    if (type === "object" && !updated.fields) {
      updated.fields = [];
    }

    return updated;
  };

  const updateField = (index: number, updates: Partial<SchemaField>) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], ...updates };

    // Reset dependent fields when type changes
    if (updates.type) {
      newSchema[index] = resetDependentFields(newSchema[index], updates.type);
    }

    onChange(newSchema);
  };

  const removeField = (index: number) => {
    onChange(schema.filter((_, i) => i !== index));
  };

  const updateNestedFields = (index: number, fields: SchemaField[]) => {
    const newSchema = [...schema];
    newSchema[index].fields = fields;
    onChange(newSchema);
  };

  const indentClass = level > 0 ? "ml-4 border-l-2 border-muted pl-4" : "";

  return (
    <div className={`space-y-3 ${indentClass}`}>
      {schema.map((field, index) => {
        const fieldId = field.id || `field-${level}-${index}`;
        return (
          <div className="space-y-2 rounded-md border p-3" key={fieldId}>
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label
                  className="ml-1"
                  htmlFor={`field-name-${level}-${index}`}
                >
                  Property Name
                </Label>
                <Input
                  disabled={disabled}
                  id={`field-name-${level}-${index}`}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  placeholder="propertyName"
                  value={field.name}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label
                  className="ml-1"
                  htmlFor={`field-type-${level}-${index}`}
                >
                  Type
                </Label>
                <Select
                  disabled={disabled}
                  onValueChange={(value) =>
                    updateField(index, {
                      type: value as SchemaField["type"],
                    })
                  }
                  value={field.type}
                >
                  <SelectTrigger
                    className="w-full"
                    id={`field-type-${level}-${index}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  disabled={disabled}
                  onClick={() => removeField(index)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {field.type === "array" && (
              <div className="space-y-2">
                <Label
                  className="ml-1"
                  htmlFor={`field-item-type-${level}-${index}`}
                >
                  Array Item Type
                </Label>
                <Select
                  disabled={disabled}
                  onValueChange={(value) =>
                    updateField(index, {
                      itemType: value as SchemaField["itemType"],
                    })
                  }
                  value={field.itemType || "string"}
                >
                  <SelectTrigger
                    className="w-full"
                    id={`field-item-type-${level}-${index}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {field.type === "object" && (
              <div className="mt-2">
                <Label className="mb-2 block">Object Properties</Label>
                <SchemaBuilder
                  disabled={disabled}
                  inputs={inputs}
                  level={level + 1}
                  onChange={(fields) => updateNestedFields(index, fields)}
                  schema={field.fields || []}
                />
              </div>
            )}

            {field.type === "array" && field.itemType === "object" && (
              <div className="mt-2">
                <Label className="mb-2 block">Array Item Properties</Label>
                <SchemaBuilder
                  disabled={disabled}
                  inputs={inputs}
                  level={level + 1}
                  onChange={(fields) => updateNestedFields(index, fields)}
                  schema={field.fields || []}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="ml-1" htmlFor={`field-desc-${level}-${index}`}>
                Description (optional)
              </Label>
              <Input
                disabled={disabled}
                id={`field-desc-${level}-${index}`}
                onChange={(e) =>
                  updateField(index, { description: e.target.value })
                }
                placeholder="Description for the AI"
                value={field.description || ""}
              />
            </div>

            {inputs && inputs.length > 0 && (() => {
              const linkedInput = field.inputId
                ? inputs.find((i) => i.id === field.inputId)
                : undefined;
              const expectedType = linkedInput
                ? inputTypeToSchemaType(linkedInput.input_type)
                : undefined;
              const hasMismatch = linkedInput && expectedType !== field.type;

              return (
                <div className="space-y-2">
                  <Label className="ml-1">Input (optional)</Label>
                  <InputSelector
                    disabled={disabled}
                    inputs={inputs}
                    value={field.inputId}
                    onSelect={(inputId) => {
                      const selected = inputs.find((i) => i.id === inputId);
                      const updates: Partial<SchemaField> = { inputId };
                      if (selected) {
                        const mapped = inputTypeToSchemaType(selected.input_type);
                        if (!field.name) {
                          updates.name = selected.input_code;
                        }
                        updates.type = mapped;
                        updates.inputCode = selected.input_code;
                      }
                      updateField(index, updates);
                    }}
                  />
                  {hasMismatch && (
                    <div className="flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        Type mismatch: <strong>{linkedInput.input_label}</strong> is{" "}
                        <strong>{linkedInput.input_type}</strong> (expects{" "}
                        <strong>{expectedType}</strong>), but property type is{" "}
                        <strong>{field.type}</strong>. Change the type to{" "}
                        <strong>{expectedType}</strong> or pick a different input.
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}

      <Button
        className="w-full"
        disabled={disabled}
        onClick={addField}
        type="button"
        variant="outline"
      >
        <Plus className="size-4" />
        Add Property
      </Button>
    </div>
  );
}

function InputSelector({
  disabled,
  inputs,
  value,
  onSelect,
}: {
  disabled?: boolean;
  inputs: InputOption[];
  value?: string;
  onSelect: (inputId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = inputs.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected ? selected.input_label : "Select input..."}
          </span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Search inputs..." />
          <CommandList>
            <CommandEmpty>No inputs found.</CommandEmpty>
            <CommandGroup>
              {inputs.map((inp) => (
                <CommandItem
                  key={inp.id}
                  value={inp.input_label}
                  className="px-2"
                  onSelect={() => {
                    onSelect(inp.id);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{inp.input_label}</span>
                  {value === inp.id && (
                    <Check className="ml-auto h-3.5 w-3.5 shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
