"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  Shield,
  Bot,
  Scale,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Textarea } from "@repo/ui/shadcn/textarea";
import { Badge } from "@repo/ui/shadcn/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@repo/ui/shadcn/separator";
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

interface DocTypeCondition {
  id: number;
  document_type_id: number;
  document_type_name: string;
  condition_label: string;
  ai_prompt: string;
  created_at: string;
}

interface DealCondition {
  id: number;
  organization_id: string;
  label: string;
  description: string | null;
  evaluation_type: "ai_prompt" | "rule";
  ai_prompt: string | null;
  rule_config: Record<string, unknown> | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface DocumentType {
  id: number;
  document_name: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ConditionsSettings() {
  const [loading, setLoading] = useState(true);
  const [docTypeConditions, setDocTypeConditions] = useState<DocTypeCondition[]>([]);
  const [dealConditions, setDealConditions] = useState<DealCondition[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [condSubTab, setCondSubTab] = useState<"all" | "document_type" | "deal_level">("all");

  // Expanded doc type groups
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  // Doc-type condition form state
  const [dtFormOpen, setDtFormOpen] = useState(false);
  const [dtEditingId, setDtEditingId] = useState<number | null>(null);
  const [dtFormDocTypeId, setDtFormDocTypeId] = useState<number | null>(null);
  const [dtFormLabel, setDtFormLabel] = useState("");
  const [dtFormPrompt, setDtFormPrompt] = useState("");
  const [dtSaving, setDtSaving] = useState(false);
  const [dtDeletingId, setDtDeletingId] = useState<number | null>(null);
  const [dtDocTypeOpen, setDtDocTypeOpen] = useState(false);

  // Deal-level condition form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEvalType, setFormEvalType] = useState<"ai_prompt" | "rule">("ai_prompt");
  const [formPrompt, setFormPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [condRes, dtRes] = await Promise.all([
        fetch("/api/deal-conditions"),
        fetch("/api/document-types"),
      ]);
      if (condRes.ok) {
        const data = await condRes.json();
        setDocTypeConditions(data.document_type_conditions ?? []);
        setDealConditions(data.deal_conditions ?? []);
      }
      if (dtRes.ok) {
        const dtData = await dtRes.json();
        const types = Array.isArray(dtData) ? dtData : dtData.document_types ?? [];
        setDocumentTypes(types.map((t: any) => ({ id: t.id, document_name: t.document_name })));
      }
    } catch (err) {
      console.error("Failed to load conditions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group doc-type conditions by document type
  const groupedDocType = docTypeConditions.reduce<
    Map<number, { name: string; conditions: DocTypeCondition[] }>
  >((acc, c) => {
    if (!acc.has(c.document_type_id)) {
      acc.set(c.document_type_id, { name: c.document_type_name, conditions: [] });
    }
    acc.get(c.document_type_id)!.conditions.push(c);
    return acc;
  }, new Map());

  const toggleGroup = (dtId: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(dtId)) next.delete(dtId);
      else next.add(dtId);
      return next;
    });
  };

  /* ---- Doc-type condition handlers ---- */

  const resetDtForm = () => {
    setDtFormOpen(false);
    setDtEditingId(null);
    setDtFormDocTypeId(null);
    setDtFormLabel("");
    setDtFormPrompt("");
  };

  const startDtEdit = (cond: DocTypeCondition) => {
    setDtEditingId(cond.id);
    setDtFormDocTypeId(cond.document_type_id);
    setDtFormLabel(cond.condition_label);
    setDtFormPrompt(cond.ai_prompt);
    setDtFormOpen(true);
  };

  const handleDtSave = async () => {
    if (!dtFormLabel.trim() || !dtFormPrompt.trim()) return;
    if (!dtEditingId && !dtFormDocTypeId) return;

    setDtSaving(true);
    try {
      if (dtEditingId) {
        await fetch("/api/document-type-ai-conditions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: dtEditingId,
            condition_label: dtFormLabel.trim(),
            ai_prompt: dtFormPrompt.trim(),
          }),
        });
      } else {
        await fetch("/api/document-type-ai-conditions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_type_id: dtFormDocTypeId,
            condition_label: dtFormLabel.trim(),
            ai_prompt: dtFormPrompt.trim(),
          }),
        });
      }
      resetDtForm();
      await fetchData();
    } catch (err) {
      console.error("Failed to save doc-type condition:", err);
    } finally {
      setDtSaving(false);
    }
  };

  const handleDtDelete = async (id: number) => {
    setDtDeletingId(id);
    try {
      await fetch("/api/document-type-ai-conditions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to delete doc-type condition:", err);
    } finally {
      setDtDeletingId(null);
    }
  };

  /* ---- Deal-level condition handlers ---- */

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormLabel("");
    setFormDescription("");
    setFormEvalType("ai_prompt");
    setFormPrompt("");
  };

  const startEdit = (cond: DealCondition) => {
    setEditingId(cond.id);
    setFormLabel(cond.label);
    setFormDescription(cond.description ?? "");
    setFormEvalType(cond.evaluation_type);
    setFormPrompt(cond.ai_prompt ?? "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formLabel.trim()) return;
    if (formEvalType === "ai_prompt" && !formPrompt.trim()) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        label: formLabel.trim(),
        description: formDescription.trim() || null,
        evaluation_type: formEvalType,
        ai_prompt: formEvalType === "ai_prompt" ? formPrompt.trim() : null,
        rule_config: formEvalType === "rule" ? {} : null,
      };

      if (editingId) {
        payload.id = editingId;
        await fetch("/api/deal-conditions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/deal-conditions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Failed to save condition:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch("/api/deal-conditions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to delete condition:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (cond: DealCondition) => {
    await fetch("/api/deal-conditions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cond.id, is_active: !cond.is_active }),
    });
    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedDocTypeName = documentTypes.find((d) => d.id === dtFormDocTypeId)?.document_name;

  /* ---- Render: Document-Type Conditions section ---- */
  const renderDocTypeSection = () => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Document-Type Conditions
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI conditions configured per document type.
          </p>
        </div>
        {!dtFormOpen && (
          <Button size="sm" onClick={() => setDtFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {dtFormOpen && (
        <div className="rounded-lg border p-4 space-y-4 mb-4">
          {!dtEditingId && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Document Type</Label>
              <Popover open={dtDocTypeOpen} onOpenChange={setDtDocTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {selectedDocTypeName ?? "Select document type..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search document types..." />
                    <CommandList>
                      <CommandEmpty>No document types found.</CommandEmpty>
                      <CommandGroup>
                        {documentTypes.map((dt) => (
                          <CommandItem
                            key={dt.id}
                            value={dt.document_name}
                            onSelect={() => {
                              setDtFormDocTypeId(dt.id);
                              setDtDocTypeOpen(false);
                            }}
                          >
                            {dtFormDocTypeId === dt.id && (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            {dt.document_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium">Condition Label</Label>
            <Input
              placeholder='e.g. Property is marked "As-Is"'
              value={dtFormLabel}
              onChange={(e) => setDtFormLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">AI Prompt</Label>
            <Textarea
              placeholder="Describe what the AI should evaluate in this document type..."
              value={dtFormPrompt}
              onChange={(e) => setDtFormPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={resetDtForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDtSave}
              disabled={
                dtSaving ||
                !dtFormLabel.trim() ||
                !dtFormPrompt.trim() ||
                (!dtEditingId && !dtFormDocTypeId)
              }
            >
              {dtSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {dtEditingId ? "Save Changes" : "Add Condition"}
            </Button>
          </div>
        </div>
      )}

      {/* Grouped list */}
      {groupedDocType.size === 0 && !dtFormOpen ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No document-type conditions configured yet.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {Array.from(groupedDocType.entries()).map(([dtId, group]) => {
            const isExpanded = expandedGroups.has(dtId);
            return (
              <div key={dtId} className="rounded-lg border">
                <div
                  className="flex w-full items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGroup(dtId)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{group.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {group.conditions.length}
                    </Badge>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 pb-3 pt-2 space-y-2">
                    {group.conditions.map((cond) => (
                      <div
                        key={cond.id}
                        className="flex items-start justify-between gap-3 py-1.5 group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{cond.condition_label}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {cond.ai_prompt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              startDtEdit(cond);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDtDelete(cond.id);
                            }}
                            disabled={dtDeletingId === cond.id}
                          >
                            {dtDeletingId === cond.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ---- Render: Deal-Level Conditions section ---- */
  const renderDealLevelSection = () => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Deal-Level Conditions
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conditions that apply across all deals. Can use AI prompts or rule-based logic.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-4 mb-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Label</Label>
            <Input
              placeholder="e.g. LTV must be under 80%"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Description (optional)</Label>
            <Input
              placeholder="Brief description of this condition"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Evaluation Type</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={formEvalType === "ai_prompt" ? "default" : "outline"}
                onClick={() => setFormEvalType("ai_prompt")}
                className="gap-1.5"
              >
                <Bot className="h-3.5 w-3.5" />
                AI Prompt
              </Button>
              <Button
                size="sm"
                variant={formEvalType === "rule" ? "default" : "outline"}
                onClick={() => setFormEvalType("rule")}
                className="gap-1.5"
              >
                <Scale className="h-3.5 w-3.5" />
                Rule
              </Button>
            </div>
          </div>

          {formEvalType === "ai_prompt" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">AI Prompt</Label>
              <Textarea
                placeholder="Describe what this condition should evaluate across the deal's documents..."
                value={formPrompt}
                onChange={(e) => setFormPrompt(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {formEvalType === "rule" && (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Rule builder coming soon. For now, use AI Prompt evaluation.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !formLabel.trim() || (formEvalType === "ai_prompt" && !formPrompt.trim())}
            >
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingId ? "Save Changes" : "Add Condition"}
            </Button>
          </div>
        </div>
      )}

      {dealConditions.length === 0 && !showForm ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Scale className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No deal-level conditions yet. Click &ldquo;Add Condition&rdquo; to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {dealConditions.map((cond) => (
            <div
              key={cond.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                !cond.is_active && "opacity-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {cond.evaluation_type === "ai_prompt" ? (
                    <Bot className="h-4 w-4 mt-0.5 shrink-0 text-violet-500" />
                  ) : (
                    <Scale className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{cond.label}</p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          cond.evaluation_type === "ai_prompt"
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}
                      >
                        {cond.evaluation_type === "ai_prompt" ? "AI" : "Rule"}
                      </Badge>
                    </div>
                    {cond.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cond.description}
                      </p>
                    )}
                    {cond.ai_prompt && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                        {cond.ai_prompt}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={cond.is_active}
                    onCheckedChange={() => handleToggleActive(cond)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => startEdit(cond)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(cond.id)}
                    disabled={deletingId === cond.id}
                  >
                    {deletingId === cond.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pt-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b">
        {(
          [
            { value: "all", label: "All" },
            { value: "document_type", label: "Document Type" },
            { value: "deal_level", label: "Deal Level" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCondSubTab(tab.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              condSubTab === tab.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(condSubTab === "all" || condSubTab === "document_type") && renderDocTypeSection()}

      {condSubTab === "all" && <Separator />}

      {(condSubTab === "all" || condSubTab === "deal_level") && renderDealLevelSection()}
    </div>
  );
}
