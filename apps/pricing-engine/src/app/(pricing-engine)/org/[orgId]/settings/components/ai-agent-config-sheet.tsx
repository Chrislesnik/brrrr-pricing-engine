"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Globe,
  Calculator,
  Database,
  Bot,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Textarea } from "@repo/ui/shadcn/textarea";
import { Badge } from "@repo/ui/shadcn/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/shadcn/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@repo/ui/shadcn/scroll-area";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AgentData {
  id?: string;
  name: string;
  description: string;
  agent_type: string;
  model: string;
  system_prompt: string;
  tools: Array<{ type: string }>;
  config: {
    task_prompt?: string;
    resolution_prompt?: string;
    output_type?: string;
    linked_document_type_ids?: number[];
    linked_input_ids?: number[];
    enabled_tools?: string[];
  };
}

interface DocumentType {
  id: number;
  document_name: string;
}

interface InputField {
  id: string;
  input_label: string;
  input_type: string;
  category?: string;
}

interface AIAgentConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string | null;
  onSaved: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Tool definitions                                                           */
/* -------------------------------------------------------------------------- */

const AVAILABLE_TOOLS = [
  {
    type: "vector_search",
    label: "Vector Search",
    description: "Search document chunks by semantic similarity",
    icon: Search,
  },
  {
    type: "query_deal_inputs",
    label: "Deal Inputs",
    description: "Read current deal input values",
    icon: FileText,
  },
  {
    type: "supabase_query",
    label: "Database Query",
    description: "Query deal and document metadata",
    icon: Database,
  },
  {
    type: "web_search",
    label: "Web Search",
    description: "Search the internet for external data",
    icon: Globe,
  },
  {
    type: "calculator",
    label: "Calculator",
    description: "Evaluate math expressions (DSCR, LTV, etc.)",
    icon: Calculator,
  },
  {
    type: "call_agent",
    label: "Call Agent",
    description: "Invoke another agent as a sub-task",
    icon: Bot,
  },
];

const AGENT_TYPES = [
  { value: "extraction", label: "Extraction" },
  { value: "validation", label: "Validation" },
  { value: "cross_reference", label: "Cross-Reference" },
  { value: "decision", label: "Decision" },
];

const MODELS = [
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
];

const OUTPUT_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "percentage", label: "Percentage" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "json", label: "JSON" },
];

/* -------------------------------------------------------------------------- */
/*  Numbered step header                                                       */
/* -------------------------------------------------------------------------- */

function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-semibold shrink-0">
        {step}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function AIAgentConfigSheet({
  open,
  onOpenChange,
  agentId,
  onSaved,
}: AIAgentConfigSheetProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [inputs, setInputs] = useState<InputField[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agentType, setAgentType] = useState("extraction");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [resolutionPrompt, setResolutionPrompt] = useState("");
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set(["vector_search"]));
  const [outputType, setOutputType] = useState("text");
  const [linkedDocTypeIds, setLinkedDocTypeIds] = useState<Set<number>>(new Set());
  const [linkedInputIds, setLinkedInputIds] = useState<Set<string>>(new Set());

  // Load metadata on mount
  useEffect(() => {
    if (!open) return;
    const loadMeta = async () => {
      const [dtRes, inputsRes] = await Promise.all([
        fetch("/api/document-types"),
        fetch("/api/inputs"),
      ]);
      if (dtRes.ok) {
        const data = await dtRes.json();
        setDocumentTypes(
          (Array.isArray(data) ? data : data.document_types ?? []).map((t: any) => ({
            id: t.id,
            document_name: t.document_name,
          }))
        );
      }
      if (inputsRes.ok) {
        const data = await inputsRes.json();
        setInputs(
          (Array.isArray(data) ? data : []).map((i: any) => ({
            id: String(i.id),
            input_label: i.input_label,
            input_type: i.input_type,
            category: i.category,
          }))
        );
      }
    };
    loadMeta();
  }, [open]);

  // Load agent data when editing
  useEffect(() => {
    if (!open || !agentId) {
      resetForm();
      return;
    }

    setLoading(true);
    const loadAgent = async () => {
      try {
        const res = await fetch("/api/ai-agents");
        if (res.ok) {
          const data = await res.json();
          const agent = (data.agents ?? []).find((a: any) => a.id === agentId);
          if (agent) {
            setName(agent.name ?? "");
            setDescription(agent.description ?? "");
            setAgentType(agent.agent_type ?? "extraction");
            setModel(agent.model ?? "gpt-4.1-mini");
            const cfg = (agent.config as any) ?? {};
            setTaskPrompt(cfg.task_prompt ?? agent.system_prompt ?? "");
            setResolutionPrompt(cfg.resolution_prompt ?? "");
            setOutputType(cfg.output_type ?? "text");
            setLinkedDocTypeIds(new Set(cfg.linked_document_type_ids ?? []));
            setLinkedInputIds(new Set((cfg.linked_input_ids ?? []).map(String)));
            const tools = (agent.tools as any[]) ?? [];
            setEnabledTools(new Set(tools.map((t: any) => t.type)));
          }
        }
      } catch (err) {
        console.error("Failed to load agent:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAgent();
  }, [open, agentId]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setAgentType("extraction");
    setModel("gpt-4.1-mini");
    setTaskPrompt("");
    setResolutionPrompt("");
    setEnabledTools(new Set(["vector_search"]));
    setOutputType("text");
    setLinkedDocTypeIds(new Set());
    setLinkedInputIds(new Set());
  };

  const toggleTool = (toolType: string) => {
    setEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolType)) next.delete(toolType);
      else next.add(toolType);
      return next;
    });
  };

  const toggleDocType = (id: number) => {
    setLinkedDocTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleInput = (id: string) => {
    setLinkedInputIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const toolsArray = Array.from(enabledTools).map((type) => ({ type }));
    const config = {
      task_prompt: taskPrompt,
      resolution_prompt: resolutionPrompt,
      output_type: outputType,
      linked_document_type_ids: Array.from(linkedDocTypeIds),
      linked_input_ids: Array.from(linkedInputIds).map(Number),
      enabled_tools: Array.from(enabledTools),
    };

    try {
      if (agentId) {
        await fetch("/api/ai-agents", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: agentId,
            name: name.trim(),
            description: description.trim() || null,
            agent_type: agentType,
            model,
            system_prompt: taskPrompt,
            tools: toolsArray,
            config,
          }),
        });
      } else {
        await fetch("/api/ai-agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            agent_type: agentType,
            model,
            system_prompt: taskPrompt,
            tools: toolsArray,
            config,
          }),
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save agent:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{agentId ? "Edit Agent" : "Create Agent"}</SheetTitle>
          <SheetDescription>Configure your AI agent</SheetDescription>
        </SheetHeader>
        {/* Sticky header (Parsewise-style) */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 pt-4 pb-3">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-3 flex-1">
              <div className="flex-1 min-w-[200px] max-w-[400px]">
                <StepHeader step={1} title="Agent Name *" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter agent name"
                  className="h-9"
                />
              </div>
              <div className="w-[140px]">
                <Label className="text-sm font-semibold mb-1 block">Type</Label>
                <Select value={agentType} onValueChange={setAgentType}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[160px]">
                <Label className="text-sm font-semibold mb-1 block">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="px-6 py-6 space-y-8">
              {/* 2. Extraction Task */}
              <div>
                <StepHeader step={2} title="Extraction / Evaluation Task *" />
                <p className="text-xs text-muted-foreground mb-2">
                  Describe what this agent should extract or evaluate from documents.
                </p>
                <Textarea
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  placeholder="e.g. What is the appraised value of the property? Extract the as-is value from the appraisal report."
                  rows={4}
                />
              </div>

              {/* 3. Resolution Task */}
              <div>
                <StepHeader step={3} title="Resolution Task" />
                <p className="text-xs text-muted-foreground mb-2">
                  How should conflicts be resolved when multiple documents provide different values?
                </p>
                <Textarea
                  value={resolutionPrompt}
                  onChange={(e) => setResolutionPrompt(e.target.value)}
                  placeholder="e.g. If multiple values are found, prioritize the most recent document. If values conflict, flag for manual review."
                  rows={3}
                />
              </div>

              {/* 4. Tools */}
              <div>
                <StepHeader step={4} title="Tools" />
                <p className="text-xs text-muted-foreground mb-3">
                  Select which tools this agent can use during its reasoning process.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    const isEnabled = enabledTools.has(tool.type);
                    return (
                      <button
                        key={tool.type}
                        type="button"
                        onClick={() => toggleTool(tool.type)}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                          isEnabled
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <div
                          className={cn(
                            "h-8 w-8 rounded-md flex items-center justify-center shrink-0",
                            isEnabled
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{tool.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {tool.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Output Configuration */}
              <div>
                <StepHeader step={5} title="Output Configuration" />
                <p className="text-xs text-muted-foreground mb-2">
                  What type of value does this agent produce?
                </p>
                <Select value={outputType} onValueChange={setOutputType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTPUT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 6. Linked Document Types */}
              <div>
                <StepHeader step={6} title="Linked Document Types" />
                <p className="text-xs text-muted-foreground mb-3">
                  Which document types can this agent process?
                </p>
                {documentTypes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No document types configured.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {documentTypes.map((dt) => (
                      <label
                        key={dt.id}
                        className="flex items-center gap-2.5 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={linkedDocTypeIds.has(dt.id)}
                          onCheckedChange={() => toggleDocType(dt.id)}
                        />
                        <span className="text-sm">{dt.document_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Linked Inputs */}
              <div>
                <StepHeader step={7} title="Linked Inputs" />
                <p className="text-xs text-muted-foreground mb-3">
                  Which deal inputs should this agent populate with its results?
                </p>
                {inputs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No inputs configured.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {inputs.map((inp) => (
                      <label
                        key={inp.id}
                        className="flex items-center justify-between gap-2.5 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            checked={linkedInputIds.has(inp.id)}
                            onCheckedChange={() => toggleInput(inp.id)}
                          />
                          <span className="text-sm">{inp.input_label}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {inp.input_type}
                        </Badge>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {agentId ? "Save Changes" : "Create Agent"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
