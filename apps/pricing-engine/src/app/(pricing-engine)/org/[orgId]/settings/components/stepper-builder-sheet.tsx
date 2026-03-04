"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ListOrdered, Trash2, ChevronsUpDown, Check, GripVertical } from "lucide-react";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { cn } from "@repo/lib/cn";
import { Button } from "@repo/ui/shadcn/button";
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
import { Badge } from "@repo/ui/shadcn/badge";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface InputField {
  id: string;
  input_label: string;
  input_type: string;
  dropdown_options: string[] | null;
  category: string;
}

interface StepperRecord {
  id: number;
  input_id: string;
  step_order: string[] | null;
  created_at: string;
}

interface StepperBuilderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function StepperBuilderSheet({
  open,
  onOpenChange,
}: StepperBuilderSheetProps) {
  const [inputs, setInputs] = useState<InputField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [selectedInputId, setSelectedInputId] = useState<string>("");
  const [currentStepper, setCurrentStepper] = useState<StepperRecord | null>(null);
  const [stepOrder, setStepOrder] = useState<string[]>([]);

  // Derived: only dropdown inputs
  const dropdownInputs = inputs.filter((i) => i.input_type === "dropdown");

  // Derived: the selected input's details
  const selectedInput = inputs.find((i) => i.id === selectedInputId);

  // Update step order when selected input changes
  const handleInputChange = useCallback((inputId: string) => {
    setSelectedInputId(inputId);
    const input = inputs.find((i) => i.id === inputId);
    if (input?.dropdown_options) {
      setStepOrder(input.dropdown_options);
    } else {
      setStepOrder([]);
    }
  }, [inputs]);

  // ---- Fetch inputs and current stepper when sheet opens ----
  useEffect(() => {
    if (!open) {
      // Reset on close
      setSelectedInputId("");
      setCurrentStepper(null);
      setStepOrder([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [inputsRes, stepperRes] = await Promise.all([
          fetch("/api/inputs"),
          fetch("/api/input-stepper"),
        ]);

        let loadedInputs: InputField[] = [];
        if (inputsRes.ok) {
          const inputsData = await inputsRes.json();
          loadedInputs = inputsData.inputs ?? inputsData ?? [];
          setInputs(loadedInputs);
        }

        if (stepperRes.ok) {
          const stepperData = await stepperRes.json();
          const steppers = stepperData.steppers ?? [];
          if (steppers.length > 0) {
            const stepper = steppers[0];
            setCurrentStepper({ ...stepper, input_id: String(stepper.input_id) });
            setSelectedInputId(String(stepper.input_id));
            // Use saved step_order if available, otherwise fall back to dropdown options
            if (stepper.step_order && stepper.step_order.length > 0) {
              setStepOrder(stepper.step_order);
            } else {
              const savedInput = loadedInputs.find((i: InputField) => i.id === String(stepper.input_id));
              if (savedInput?.dropdown_options) {
                setStepOrder(savedInput.dropdown_options);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load stepper data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open]);

  // ---- Save handler ----
  const handleSave = async () => {
    if (!selectedInputId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/input-stepper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_id: selectedInputId,
          step_order: stepOrder.length > 0 ? stepOrder : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentStepper(data.stepper);
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Failed to save stepper:", err);
    } finally {
      setSaving(false);
    }
  };

  // ---- Remove handler ----
  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch("/api/input-stepper", { method: "DELETE" });
      if (res.ok) {
        setCurrentStepper(null);
        setSelectedInputId("");
      }
    } catch (err) {
      console.error("Failed to remove stepper:", err);
    } finally {
      setRemoving(false);
    }
  };

  // Check if selection or order has changed from saved state
  const savedOrder = currentStepper?.step_order ?? [];
  const hasChanges =
    selectedInputId !== (currentStepper?.input_id ?? "") ||
    JSON.stringify(stepOrder) !== JSON.stringify(savedOrder);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ListOrdered className="size-5" />
            Stepper Configuration
          </SheetTitle>
          <SheetDescription>
            Attach a dropdown input to use as the deal stepper. The dropdown
            options will define the steps.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : dropdownInputs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListOrdered className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No dropdown inputs found</p>
              <p className="text-xs mt-1">
                Create a dropdown-type input first to use as a stepper.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Searchable dropdown selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Stepper Input</label>
                <SearchableDropdownSelect
                  inputs={dropdownInputs}
                  value={selectedInputId}
                  onValueChange={handleInputChange}
                  placeholder="Search dropdown inputs..."
                />
              </div>

              {/* Sortable steps list */}
              {stepOrder.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Step Order
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Drag to reorder the steps
                  </p>
                  <Sortable
                    value={stepOrder}
                    onValueChange={setStepOrder}
                    getItemValue={(item) => item}
                    orientation="vertical"
                  >
                    <SortableContent className="rounded-lg border divide-y overflow-hidden">
                      {stepOrder.map((option, idx) => (
                        <SortableItem
                          key={option}
                          value={option}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 bg-background data-dragging:bg-muted data-dragging:shadow-md data-dragging:rounded-lg",
                            idx === 0 && "rounded-t-lg",
                            idx === stepOrder.length - 1 && "rounded-b-lg"
                          )}
                        >
                          <SortableItemHandle className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                            <GripVertical className="h-4 w-4" />
                          </SortableItemHandle>
                          <div
                            className={cn(
                              "flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold shrink-0",
                              "bg-primary/10 text-primary"
                            )}
                          >
                            {idx + 1}
                          </div>
                          <span className="text-sm">{option}</span>
                        </SortableItem>
                      ))}
                    </SortableContent>
                    <SortableOverlay>
                      {({ value }) => (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-background shadow-lg">
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div
                            className={cn(
                              "flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold shrink-0",
                              "bg-primary/10 text-primary"
                            )}
                          >
                            ·
                          </div>
                          <span className="text-sm">{value}</span>
                        </div>
                      )}
                    </SortableOverlay>
                  </Sortable>
                </div>
              )}

              {/* Current stepper info */}
              {currentStepper && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRemove}
                    disabled={removing}
                  >
                    {removing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Remove Stepper
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedInputId || saving || !hasChanges}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  SearchableDropdownSelect – combobox with search for dropdown inputs        */
/* -------------------------------------------------------------------------- */

function SearchableDropdownSelect({
  inputs,
  value,
  onValueChange,
  placeholder = "Search dropdown inputs...",
}: {
  inputs: InputField[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = inputs.find((inp) => inp.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-9 text-sm"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.input_label}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {selected.category}
                </Badge>
              </span>
            ) : (
              placeholder
            )}
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
            <CommandEmpty>No dropdown inputs found.</CommandEmpty>
            <CommandGroup>
              {inputs.map((inp) => (
                <CommandItem
                  key={inp.id}
                  value={`${inp.input_label} ${inp.category}`}
                  onSelect={() => {
                    onValueChange(inp.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === inp.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{inp.input_label}</span>
                  <Badge
                    variant="secondary"
                    className="ml-2 text-[10px] px-1.5 py-0 h-4"
                  >
                    {inp.category}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
