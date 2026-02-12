"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
  ChevronsUpDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Textarea } from "@repo/ui/shadcn/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface InputField {
  id: string;
  input_label: string;
  input_type: string;
  category: string;
}

interface AIInputPrompt {
  id: number;
  document_type_id: number;
  input_id: string;
  ai_prompt: string;
  created_at: string;
  inputs: { id: string; input_label: string } | null;
}

interface AIConditionPrompt {
  id: number;
  document_type: number;
  condition_label: string;
  ai_prompt: string;
  created_at: string;
}

/* -------------------------------------------------------------------------- */
/*  SearchableInputSelect (copied from logic builder)                          */
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
          <span
            className={cn(
              "truncate",
              !selectedLabel && "text-muted-foreground"
            )}
          >
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
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function DocumentAIPromptsSheet({
  open,
  onOpenChange,
  documentTypeId,
  documentTypeName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTypeId: number | null;
  documentTypeName: string;
}) {
  const [activeTab, setActiveTab] = useState("inputs");

  // Data
  const [inputs, setInputs] = useState<InputField[]>([]);
  const [aiInputs, setAiInputs] = useState<AIInputPrompt[]>([]);
  const [aiConditions, setAiConditions] = useState<AIConditionPrompt[]>([]);
  const [loading, setLoading] = useState(false);

  // Input prompt form
  const [inputFieldId, setInputFieldId] = useState("");
  const [inputPrompt, setInputPrompt] = useState("");
  const [savingInput, setSavingInput] = useState(false);

  // Condition prompt form
  const [conditionLabel, setConditionLabel] = useState("");
  const [conditionPrompt, setConditionPrompt] = useState("");
  const [savingCondition, setSavingCondition] = useState(false);

  // Deleting state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Editing state
  const [editingInputId, setEditingInputId] = useState<number | null>(null);
  const [editInputFieldId, setEditInputFieldId] = useState("");
  const [editInputPrompt, setEditInputPrompt] = useState("");
  const [editingConditionId, setEditingConditionId] = useState<number | null>(null);
  const [editConditionLabel, setEditConditionLabel] = useState("");
  const [editConditionPrompt, setEditConditionPrompt] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Set of input IDs that already have a saved prompt on this document type
  const usedInputIds = new Set(aiInputs.map((item) => item.input_id));

  const resetForms = useCallback(() => {
    setInputFieldId("");
    setInputPrompt("");
    setConditionLabel("");
    setConditionPrompt("");
    setEditingInputId(null);
    setEditingConditionId(null);
  }, []);

  // Fetch data when sheet opens
  const fetchData = useCallback(async () => {
    if (!documentTypeId) return;
    setLoading(true);
    try {
      const [inputsRes, aiInputsRes, aiConditionsRes] = await Promise.all([
        fetch("/api/inputs"),
        fetch(
          `/api/document-type-ai-inputs?document_type_id=${documentTypeId}`
        ),
        fetch(
          `/api/document-type-ai-conditions?document_type_id=${documentTypeId}`
        ),
      ]);
      const inputsJson = await inputsRes.json().catch(() => []);
      const aiInputsJson = await aiInputsRes.json().catch(() => []);
      const aiConditionsJson = await aiConditionsRes.json().catch(() => []);
      setInputs(Array.isArray(inputsJson) ? inputsJson : []);
      setAiInputs(Array.isArray(aiInputsJson) ? aiInputsJson : []);
      setAiConditions(
        Array.isArray(aiConditionsJson) ? aiConditionsJson : []
      );
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [documentTypeId]);

  useEffect(() => {
    if (!open) return;
    resetForms();
    fetchData();
  }, [open, fetchData, resetForms]);

  // Save input prompt
  const handleSaveInput = async () => {
    if (!inputFieldId || !inputPrompt.trim() || !documentTypeId) return;
    setSavingInput(true);
    try {
      const res = await fetch("/api/document-type-ai-inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type_id: documentTypeId,
          input_id: inputFieldId,
          ai_prompt: inputPrompt.trim(),
        }),
      });
      if (res.ok) {
        setInputFieldId("");
        setInputPrompt("");
        await fetchData();
      }
    } finally {
      setSavingInput(false);
    }
  };

  // Save condition prompt
  const handleSaveCondition = async () => {
    if (!conditionLabel.trim() || !conditionPrompt.trim() || !documentTypeId)
      return;
    setSavingCondition(true);
    try {
      const res = await fetch("/api/document-type-ai-conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type_id: documentTypeId,
          condition_label: conditionLabel.trim(),
          ai_prompt: conditionPrompt.trim(),
        }),
      });
      if (res.ok) {
        setConditionLabel("");
        setConditionPrompt("");
        await fetchData();
      }
    } finally {
      setSavingCondition(false);
    }
  };

  // Delete input prompt
  const handleDeleteInput = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch("/api/document-type-ai-inputs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } finally {
      setDeletingId(null);
    }
  };

  // Delete condition prompt
  const handleDeleteCondition = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch("/api/document-type-ai-conditions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } finally {
      setDeletingId(null);
    }
  };

  // Start editing an input prompt
  const startEditInput = (item: AIInputPrompt) => {
    setEditingInputId(item.id);
    setEditInputFieldId(item.input_id);
    setEditInputPrompt(item.ai_prompt);
  };

  // Save edited input prompt
  const handleSaveEditInput = async () => {
    if (!editingInputId || !editInputFieldId || !editInputPrompt.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/document-type-ai-inputs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingInputId,
          input_id: editInputFieldId,
          ai_prompt: editInputPrompt.trim(),
        }),
      });
      if (res.ok) {
        setEditingInputId(null);
        await fetchData();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Start editing a condition prompt
  const startEditCondition = (item: AIConditionPrompt) => {
    setEditingConditionId(item.id);
    setEditConditionLabel(item.condition_label);
    setEditConditionPrompt(item.ai_prompt);
  };

  // Save edited condition prompt
  const handleSaveEditCondition = async () => {
    if (!editingConditionId || !editConditionLabel.trim() || !editConditionPrompt.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/document-type-ai-conditions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingConditionId,
          condition_label: editConditionLabel.trim(),
          ai_prompt: editConditionPrompt.trim(),
        }),
      });
      if (res.ok) {
        setEditingConditionId(null);
        await fetchData();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            AI Prompts &mdash; {documentTypeName}
          </SheetTitle>
          <SheetDescription>
            Configure AI prompts for extracting input values and evaluating
            conditions on &ldquo;{documentTypeName}&rdquo; documents.
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col mt-4"
        >
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto shrink-0">
            <TabsTrigger
              value="inputs"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Inputs
            </TabsTrigger>
            <TabsTrigger
              value="conditions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Conditions
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading...
              </span>
            </div>
          ) : (
            <>
              {/* ---- Inputs Tab ---- */}
              <TabsContent
                value="inputs"
                className="mt-0 flex-1 overflow-y-auto"
              >
                <div className="space-y-4 p-4">
                  {/* Add form */}
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      New AI Input Prompt
                    </Label>
                    <div className="space-y-2">
                      <Label className="text-xs">Input Field</Label>
                      <SearchableInputSelect
                        inputs={inputs
                          .filter((inp) => !usedInputIds.has(inp.id))
                          .map((inp) => ({
                            id: inp.id,
                            label: inp.input_label,
                          }))}
                        value={inputFieldId}
                        onValueChange={setInputFieldId}
                        placeholder="Select input field"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">AI Prompt</Label>
                      <Textarea
                        placeholder="Describe what the AI should extract from the document for this input..."
                        value={inputPrompt}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        rows={3}
                        className="text-sm resize-none"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleSaveInput}
                      disabled={
                        savingInput || !inputFieldId || !inputPrompt.trim()
                      }
                    >
                      {savingInput ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : (
                        <Plus className="size-3 mr-1" />
                      )}
                      Save Prompt
                    </Button>
                  </div>

                  {/* Existing prompts list */}
                  {aiInputs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed">
                      <p className="text-sm text-muted-foreground">
                        No AI input prompts yet.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add a prompt above to configure AI extraction for an
                        input field.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Saved Prompts
                      </Label>
                      {aiInputs.map((item) =>
                        editingInputId === item.id ? (
                          <div
                            key={item.id}
                            className="rounded-md border border-primary/30 bg-card p-3 space-y-3"
                          >
                            <div className="space-y-2">
                              <Label className="text-xs">Input Field</Label>
                              <SearchableInputSelect
                                inputs={inputs
                                  .filter((inp) => inp.id === editInputFieldId || !usedInputIds.has(inp.id))
                                  .map((inp) => ({
                                    id: inp.id,
                                    label: inp.input_label,
                                  }))}
                                value={editInputFieldId}
                                onValueChange={setEditInputFieldId}
                                placeholder="Select input field"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">AI Prompt</Label>
                              <Textarea
                                value={editInputPrompt}
                                onChange={(e) => setEditInputPrompt(e.target.value)}
                                rows={3}
                                className="text-sm resize-none"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={handleSaveEditInput}
                                disabled={savingEdit || !editInputFieldId || !editInputPrompt.trim()}
                              >
                                {savingEdit ? (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                ) : (
                                  <Check className="size-3 mr-1" />
                                )}
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => setEditingInputId(null)}
                                disabled={savingEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 rounded-md border bg-card p-3"
                          >
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="text-sm font-medium">
                                {item.inputs?.input_label ?? "Unknown input"}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.ai_prompt}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                                onClick={() => startEditInput(item)}
                              >
                                <Pencil className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteInput(item.id)}
                                disabled={deletingId === item.id}
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ---- Conditions Tab ---- */}
              <TabsContent
                value="conditions"
                className="mt-0 flex-1 overflow-y-auto"
              >
                <div className="space-y-4 p-4">
                  {/* Add form */}
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      New AI Condition Prompt
                    </Label>
                    <div className="space-y-2">
                      <Label className="text-xs">Label</Label>
                      <Input
                        placeholder="e.g. Property in flood zone"
                        value={conditionLabel}
                        onChange={(e) => setConditionLabel(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">AI Prompt</Label>
                      <Textarea
                        placeholder="Describe what the AI should evaluate on the document to determine this condition..."
                        value={conditionPrompt}
                        onChange={(e) => setConditionPrompt(e.target.value)}
                        rows={3}
                        className="text-sm resize-none"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleSaveCondition}
                      disabled={
                        savingCondition ||
                        !conditionLabel.trim() ||
                        !conditionPrompt.trim()
                      }
                    >
                      {savingCondition ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : (
                        <Plus className="size-3 mr-1" />
                      )}
                      Save Prompt
                    </Button>
                  </div>

                  {/* Existing conditions list */}
                  {aiConditions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed">
                      <p className="text-sm text-muted-foreground">
                        No AI condition prompts yet.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add a prompt above to configure AI condition evaluation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Saved Conditions
                      </Label>
                      {aiConditions.map((item) =>
                        editingConditionId === item.id ? (
                          <div
                            key={item.id}
                            className="rounded-md border border-primary/30 bg-card p-3 space-y-3"
                          >
                            <div className="space-y-2">
                              <Label className="text-xs">Label</Label>
                              <Input
                                value={editConditionLabel}
                                onChange={(e) => setEditConditionLabel(e.target.value)}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">AI Prompt</Label>
                              <Textarea
                                value={editConditionPrompt}
                                onChange={(e) => setEditConditionPrompt(e.target.value)}
                                rows={3}
                                className="text-sm resize-none"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={handleSaveEditCondition}
                                disabled={savingEdit || !editConditionLabel.trim() || !editConditionPrompt.trim()}
                              >
                                {savingEdit ? (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                ) : (
                                  <Check className="size-3 mr-1" />
                                )}
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => setEditingConditionId(null)}
                                disabled={savingEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 rounded-md border bg-card p-3"
                          >
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="text-sm font-medium">
                                {item.condition_label}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.ai_prompt}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                                onClick={() => startEditCondition(item)}
                              >
                                <Pencil className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteCondition(item.id)}
                                disabled={deletingId === item.id}
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
