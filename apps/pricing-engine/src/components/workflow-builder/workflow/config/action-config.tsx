"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  nodesAtom,
  edgesAtom,
  selectedNodeAtom,
} from "@/components/workflow-builder/lib/workflow-store";
import { ChevronRight, HelpCircle, Maximize2, Plus, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfigureConnectionOverlay } from "@/components/workflow-builder/overlays/add-connection-overlay";
import { AiGatewayConsentOverlay } from "@/components/workflow-builder/overlays/ai-gateway-consent-overlay";
import { useOverlay } from "@/components/workflow-builder/overlays/overlay-provider";
import { Button } from "@repo/ui/shadcn/button";
import { CodeEditor } from "@/components/workflow-builder/ui/code-editor";
import { IntegrationIcon } from "@/components/workflow-builder/ui/integration-icon";
import { IntegrationSelector } from "@/components/workflow-builder/ui/integration-selector";
import { Label } from "@repo/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import { TemplateBadgeInput } from "@/components/workflow-builder/ui/template-badge-input";
import { ExpressionEditorModal } from "@/components/workflow-builder/ui/expression-editor-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { aiGatewayStatusAtom } from "@/components/workflow-builder/lib/ai-gateway/state";
import {
  integrationsAtom,
  integrationsVersionAtom,
} from "@/components/workflow-builder/lib/integrations-store";
import type { IntegrationType } from "@/components/workflow-builder/lib/types/integration";
import {
  findActionById,
  getActionsByCategory,
  getAllIntegrations,
} from "@/components/workflow-builder/plugins";
import { Input } from "@repo/ui/shadcn/input";
import { Textarea } from "@repo/ui/shadcn/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog";
import { ActionConfigRenderer } from "./action-config-renderer";
import { SchemaBuilder, type SchemaField } from "./schema-builder";
import { ConditionBuilderInline } from "@/components/workflow-builder/ui/condition-builder-inline";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/shadcn/collapsible";

type ActionConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  onBatchUpdateConfig?: (updates: Record<string, string>) => void;
  disabled: boolean;
  isOwner?: boolean;
};

// Database Query fields component
function DatabaseQueryFields({
  config,
  onUpdateConfig,
  disabled,
  currentNodeId,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
  currentNodeId?: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="dbQuery">SQL Query</Label>
        <div className="overflow-hidden rounded-md border">
          <CodeEditor
            currentNodeId={currentNodeId}
            defaultLanguage="sql"
            height="150px"
            onChange={(value) => onUpdateConfig("dbQuery", value || "")}
            options={{
              minimap: { enabled: false },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              fontSize: 12,
              readOnly: disabled,
              wordWrap: "off",
            }}
            value={(config?.dbQuery as string) || ""}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          The DATABASE_URL from your project integrations will be used to
          execute this query.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Schema (Optional)</Label>
        <SchemaBuilder
          disabled={disabled}
          onChange={(schema) =>
            onUpdateConfig("dbSchema", JSON.stringify(schema))
          }
          schema={
            config?.dbSchema
              ? (JSON.parse(config.dbSchema as string) as SchemaField[])
              : []
          }
        />
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  cURL parser                                                                */
/* -------------------------------------------------------------------------- */

function parseCurl(raw: string): {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
} {
  // Normalise line continuations and collapse to single line
  const command = raw
    .replace(/\\\r?\n/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();

  // Tokenise respecting single and double quotes
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    const prev = i > 0 ? command[i - 1] : "";

    if (ch === "'" && !inDouble && prev !== "\\") {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle && prev !== "\\") {
      inDouble = !inDouble;
      continue;
    }
    if (ch === " " && !inSingle && !inDouble) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (current) tokens.push(current);

  // Strip leading "curl" token
  if (tokens.length > 0 && tokens[0].toLowerCase() === "curl") {
    tokens.shift();
  }

  let method = "";
  let url = "";
  const headers: Record<string, string> = {};
  let body = "";

  const flagsWithArg = new Set([
    "-X", "--request",
    "-H", "--header",
    "-d", "--data", "--data-raw", "--data-binary", "--data-urlencode",
    "-u", "--user",
    "-o", "--output",
    "-A", "--user-agent",
    "-e", "--referer",
    "--url",
    "-b", "--cookie",
    "-c", "--cookie-jar",
    "--connect-timeout",
    "--max-time",
    "-m",
  ]);

  const boolFlags = new Set([
    "--compressed", "--insecure", "-k", "-L", "--location",
    "-s", "--silent", "-S", "--show-error", "-v", "--verbose",
    "-i", "--include", "-I", "--head",
  ]);

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === "-X" || token === "--request") {
      method = (tokens[++i] ?? "GET").toUpperCase();
    } else if (token === "-H" || token === "--header") {
      const val = tokens[++i] ?? "";
      const colonIdx = val.indexOf(":");
      if (colonIdx > 0) {
        const key = val.slice(0, colonIdx).trim();
        const value = val.slice(colonIdx + 1).trim();
        headers[key] = value;
      }
    } else if (
      token === "-d" || token === "--data" ||
      token === "--data-raw" || token === "--data-binary" ||
      token === "--data-urlencode"
    ) {
      body = tokens[++i] ?? "";
    } else if (token === "--url") {
      url = tokens[++i] ?? "";
    } else if (token === "-A" || token === "--user-agent") {
      headers["User-Agent"] = tokens[++i] ?? "";
    } else if (token === "-e" || token === "--referer") {
      headers["Referer"] = tokens[++i] ?? "";
    } else if (token === "-u" || token === "--user") {
      const cred = tokens[++i] ?? "";
      headers["Authorization"] = "Basic " + btoa(cred);
    } else if (boolFlags.has(token)) {
      // skip boolean flags
    } else if (flagsWithArg.has(token)) {
      i++; // skip unknown flag argument
    } else if (token.startsWith("-")) {
      // unknown flag, skip
    } else if (!url) {
      url = token;
    }

    i++;
  }

  // Default method
  if (!method) {
    method = body ? "POST" : "GET";
  }

  // Try to pretty-print body if it's JSON
  if (body) {
    try {
      body = JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      // Leave as-is if not valid JSON
    }
  }

  return { method, url, headers, body };
}

// HTTP Request fields component
function HttpRequestFields({
  config,
  onUpdateConfig,
  onBatchUpdateConfig,
  disabled,
  currentNodeId,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  onBatchUpdateConfig?: (updates: Record<string, string>) => void;
  disabled: boolean;
  currentNodeId?: string;
}) {
  const [curlDialogOpen, setCurlDialogOpen] = useState(false);
  const [curlInput, setCurlInput] = useState("");
  const [headersModalOpen, setHeadersModalOpen] = useState(false);
  const [bodyModalOpen, setBodyModalOpen] = useState(false);

  useEffect(() => {
    if (!config?.httpMethod) {
      onUpdateConfig("httpMethod", "POST");
    }
  }, []);

  const handleCurlImport = () => {
    if (!curlInput.trim()) return;
    const parsed = parseCurl(curlInput);
    const updates: Record<string, string> = {
      httpMethod: parsed.method,
      endpoint: parsed.url,
      httpHeaders: JSON.stringify(parsed.headers, null, 2),
    };
    if (parsed.body) {
      updates.httpBody = parsed.body;
    }
    if (onBatchUpdateConfig) {
      onBatchUpdateConfig(updates);
    } else {
      for (const [key, value] of Object.entries(updates)) {
        onUpdateConfig(key, value);
      }
    }
    setCurlDialogOpen(false);
    setCurlInput("");
  };

  return (
    <>
      {/* Import cURL button */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setCurlDialogOpen(true)}
          className="text-xs h-7"
        >
          Import cURL
        </Button>
      </div>

      {/* Import cURL dialog */}
      <Dialog open={curlDialogOpen} onOpenChange={setCurlDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import cURL command</DialogTitle>
            <DialogDescription>
              Paste a cURL command to auto-fill the HTTP request fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Paste the cURL command here"
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              This will overwrite the current Method, URL, Headers, and Body values.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="default"
              size="sm"
              disabled={!curlInput.trim()}
              onClick={handleCurlImport}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <Label htmlFor="httpMethod">HTTP Method</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("httpMethod", value)}
          value={(config?.httpMethod as string) || "POST"}
        >
          <SelectTrigger className="w-full" id="httpMethod">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="endpoint">URL</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="endpoint"
          onChange={(value) => onUpdateConfig("endpoint", value)}
          placeholder="https://api.example.com/endpoint or {{NodeName.url}}"
          value={(config?.endpoint as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="httpHeaders">Headers (JSON)</Label>
        <div className="relative overflow-hidden rounded-md border">
          <CodeEditor
            currentNodeId={currentNodeId}
            defaultLanguage="json"
            height="100px"
            onChange={(value) => onUpdateConfig("httpHeaders", value || "{}")}
            options={{
              minimap: { enabled: false },
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              fontSize: 12,
              readOnly: disabled,
              wordWrap: "off",
            }}
            value={(config?.httpHeaders as string) || "{}"}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-1 right-1 h-6 w-6 opacity-50 hover:opacity-100 bg-background/80 backdrop-blur-sm"
            onClick={() => setHeadersModalOpen(true)}
            title="Open expression editor"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ExpressionEditorModal
        open={headersModalOpen}
        onOpenChange={setHeadersModalOpen}
        title="Headers (JSON)"
        value={(config?.httpHeaders as string) || "{}"}
        onChange={(v) => onUpdateConfig("httpHeaders", v || "{}")}
        readOnly={disabled}
      />
      <div className="space-y-2">
        <Label htmlFor="httpBody">Body (JSON)</Label>
        <div
          className={`relative overflow-hidden rounded-md border ${config?.httpMethod === "GET" ? "opacity-50" : ""}`}
        >
          <CodeEditor
            currentNodeId={currentNodeId}
            defaultLanguage="json"
            height="120px"
            onChange={(value) => onUpdateConfig("httpBody", value || "{}")}
            options={{
              minimap: { enabled: false },
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              fontSize: 12,
              readOnly: config?.httpMethod === "GET" || disabled,
              domReadOnly: config?.httpMethod === "GET" || disabled,
              wordWrap: "off",
            }}
            value={(config?.httpBody as string) || "{}"}
          />
          {config?.httpMethod !== "GET" && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-1 right-1 h-6 w-6 opacity-50 hover:opacity-100 bg-background/80 backdrop-blur-sm"
              onClick={() => setBodyModalOpen(true)}
              title="Open expression editor"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {config?.httpMethod === "GET" && (
          <p className="text-muted-foreground text-xs">
            Body is disabled for GET requests
          </p>
        )}
      </div>
      <ExpressionEditorModal
        open={bodyModalOpen}
        onOpenChange={setBodyModalOpen}
        title="Body (JSON)"
        value={(config?.httpBody as string) || "{}"}
        onChange={(v) => onUpdateConfig("httpBody", v || "{}")}
        readOnly={config?.httpMethod === "GET" || disabled}
      />
    </>
  );
}

// Condition fields component
function ConditionFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  // Check if using new structured format or legacy raw expression
  const conditionValue = (config?.condition as string) || "";
  let isStructured = false;
  try {
    const parsed = JSON.parse(conditionValue);
    isStructured = parsed && typeof parsed === "object" && "match" in parsed;
  } catch {
    isStructured = false;
  }

  // Initialize with structured format if empty or new
  if (!conditionValue || isStructured) {
    return (
      <div className="space-y-2">
        <Label>Conditions</Label>
        <ConditionBuilderInline
          disabled={disabled}
          value={conditionValue}
          onChange={(value) => onUpdateConfig("condition", value)}
        />
      </div>
    );
  }

  // Legacy: show raw expression input for backward compatibility
  return (
    <div className="space-y-2">
      <Label htmlFor="condition">Condition Expression (Legacy)</Label>
      <TemplateBadgeInput
        disabled={disabled}
        id="condition"
        onChange={(value) => onUpdateConfig("condition", value)}
        placeholder="e.g., 5 > 3, status === 200, {{PreviousNode.value}} > 100"
        value={conditionValue}
      />
      <p className="text-muted-foreground text-xs">
        This uses the legacy expression format. Clear the field to switch to the visual builder.
      </p>
    </div>
  );
}

// System action fields wrapper - extracts conditional rendering to reduce complexity
function SystemActionFields({
  actionType,
  config,
  onUpdateConfig,
  onBatchUpdateConfig,
  disabled,
}: {
  actionType: string;
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  onBatchUpdateConfig?: (updates: Record<string, string>) => void;
  disabled: boolean;
}) {
  const currentNodeId = useAtomValue(selectedNodeAtom) ?? undefined;

  switch (actionType) {
    case "HTTP Request":
      return (
        <HttpRequestFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
          onBatchUpdateConfig={onBatchUpdateConfig}
          currentNodeId={currentNodeId}
        />
      );
    case "Database Query":
      return (
        <DatabaseQueryFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
          currentNodeId={currentNodeId}
        />
      );
    case "Condition":
      return (
        <ConditionFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Set Fields":
      return (
        <SetFieldsFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Wait":
      return (
        <WaitFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Code":
      return (
        <CodeNodeFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
          currentNodeId={currentNodeId}
        />
      );
    case "Switch":
      return (
        <SwitchFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Filter":
      return (
        <ConditionFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "DateTime":
      return (
        <DateTimeFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Split Out":
      return (
        <SplitOutFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Limit":
      return (
        <LimitFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Aggregate":
      return (
        <AggregateFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Merge":
      return (
        <MergeFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Sort":
      return (
        <SortFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Remove Duplicates":
      return (
        <RemoveDuplicatesFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    case "Loop Over Batches":
      return (
        <LoopBatchesFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      );
    default:
      return null;
  }
}

// ── Code node config component ──

const CODE_MODES = [
  { value: "runOnceAllItems", label: "Run Once for All Items" },
  { value: "runOnceEachItem", label: "Run Once for Each Item" },
] as const;

const DEFAULT_CODE_ALL_ITEMS = `// Access input: $input.all(), $input.first(), $input.last()
// Access nodes: $node['NodeName'].json.fieldName

const items = $input.all();

// Transform and return items
return items;`;

const DEFAULT_CODE_EACH_ITEM = `// 'item' contains the current item's data: item.json.fieldName
// Access nodes: $node['NodeName'].json.fieldName

// Transform and return the item
return item;`;

function CodeNodeFields({
  config,
  onUpdateConfig,
  disabled,
  currentNodeId,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
  currentNodeId?: string;
}) {
  const mode = (config?.mode as string) || "runOnceAllItems";
  const code = config?.code as string | undefined;
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  // Initialize defaults
  useEffect(() => {
    if (!config?.mode) onUpdateConfig("mode", "runOnceAllItems");
    if (config?.code === undefined || config?.code === null) {
      onUpdateConfig("code", DEFAULT_CODE_ALL_ITEMS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = (newMode: string) => {
    onUpdateConfig("mode", newMode);
    // If code is still the default template for the old mode, swap it
    const currentCode = (config?.code as string) || "";
    const isDefaultAll = currentCode.trim() === DEFAULT_CODE_ALL_ITEMS.trim();
    const isDefaultEach = currentCode.trim() === DEFAULT_CODE_EACH_ITEM.trim();
    if (isDefaultAll || isDefaultEach || !currentCode.trim()) {
      onUpdateConfig(
        "code",
        newMode === "runOnceEachItem" ? DEFAULT_CODE_EACH_ITEM : DEFAULT_CODE_ALL_ITEMS
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="codeMode">Mode</Label>
        <Select
          disabled={disabled}
          value={mode}
          onValueChange={handleModeChange}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CODE_MODES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                <span className="text-xs">{m.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>JavaScript</Label>
          <span className="text-[10px] text-muted-foreground">
            {mode === "runOnceEachItem" ? "Runs per item" : "Runs once"}
          </span>
        </div>
        <div className="relative overflow-hidden rounded-md border">
          <CodeEditor
            currentNodeId={currentNodeId}
            defaultLanguage="javascript"
            height="250px"
            value={code ?? DEFAULT_CODE_ALL_ITEMS}
            onChange={(value) => onUpdateConfig("code", value || "")}
            options={{
              minimap: { enabled: false },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              fontSize: 12,
              readOnly: disabled,
              domReadOnly: disabled,
              wordWrap: "off",
              tabSize: 2,
              automaticLayout: true,
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-1 right-1 h-6 w-6 opacity-50 hover:opacity-100 bg-background/80 backdrop-blur-sm"
            onClick={() => setCodeModalOpen(true)}
            title="Open expression editor"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Use <code className="font-mono bg-muted px-1 rounded">$input.all()</code> for input data and{" "}
          <code className="font-mono bg-muted px-1 rounded">{"$node['Name']"}</code> for specific nodes.
        </p>
      </div>
      <ExpressionEditorModal
        open={codeModalOpen}
        onOpenChange={setCodeModalOpen}
        title="JavaScript"
        language="javascript"
        value={code ?? DEFAULT_CODE_ALL_ITEMS}
        onChange={(v) => onUpdateConfig("code", v || "")}
        readOnly={disabled}
      />

      {/* AI Code Assistant */}
      <CodeAIAssistant
        mode={mode}
        disabled={disabled}
        onApply={(generatedCode) => {
          onUpdateConfig("code", generatedCode);
        }}
        prompt={(config?.aiPrompt as string) ?? ""}
        onPromptChange={(value) => onUpdateConfig("aiPrompt", value)}
      />

      {/* Test execution */}
      <CodeTestPanel code={code ?? ""} mode={mode} disabled={disabled} />
    </div>
  );
}

function CodeAIAssistant({
  mode,
  disabled,
  onApply,
  prompt,
  onPromptChange,
}: {
  mode: string;
  disabled: boolean;
  onApply: (code: string) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
}) {
  const aiPrompt = prompt;
  const setAiPrompt = onPromptChange;
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const nodes = useAtomValue(nodesAtom);
  const edges = useAtomValue(edgesAtom);
  const selectedNodeId = useAtomValue(selectedNodeAtom);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const resizePrompt = useCallback(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resizePrompt();
  }, [aiPrompt, resizePrompt]);

  const handleGenerate = async () => {
    if (!aiPrompt.trim() || generating) return;
    setGenerating(true);
    setSuggestion("");
    setAiError(null);

    try {
      // Build workflow context client-side
      const { buildWorkflowContextForAI } = await import(
        "@/components/workflow-builder/lib/workflow-context-for-ai"
      );
      const workflowContext = buildWorkflowContextForAI(
        nodes,
        edges,
        selectedNodeId || "",
      );

      const res = await fetch("/api/code-agent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          mode,
          workflowContext,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        setAiError((err as { error?: string }).error || `Error ${res.status}`);
        setGenerating(false);
        return;
      }

      // Stream the response
      const reader = res.body?.getReader();
      if (!reader) {
        setAiError("No response stream");
        setGenerating(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      let lastUpdate = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const now = Date.now();
        if (now - lastUpdate > 250) {
          setSuggestion(accumulated);
          lastUpdate = now;
        }
      }

      // Clean up any markdown fences the model might have included
      let cleaned = accumulated.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:javascript|js)?\n?/, "").replace(/\n?```$/, "");
      }
      setSuggestion(cleaned);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">AI Code Assistant</Label>
      <div className="flex items-end gap-1.5">
        <textarea
          ref={promptRef}
          disabled={disabled || generating}
          placeholder="Describe what the code should do..."
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleGenerate();
            }
          }}
          rows={1}
          className="min-h-[32px] max-h-[160px] w-full resize-none overflow-y-auto rounded-md border border-input bg-background px-3 py-1.5 text-xs leading-5 shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1"
        />
        <Button
          variant="default"
          size="sm"
          disabled={disabled || generating || !aiPrompt.trim()}
          onClick={() => void handleGenerate()}
          className="h-8 text-xs shrink-0 px-3 self-end"
        >
          {generating ? "Generating..." : "Generate"}
        </Button>
      </div>

      {aiError && (
        <div className="rounded-md bg-destructive/10 text-destructive text-xs p-2">
          {aiError}
        </div>
      )}

      {suggestion !== null && !aiError && (
        <div className="rounded-md border overflow-hidden">
          <div className="bg-muted/50 px-2 py-1 flex items-center justify-between border-b">
            <span className="text-[10px] font-medium text-muted-foreground">
              AI Suggestion
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="default"
                size="sm"
                className="h-6 text-[10px] px-2"
                disabled={generating || !suggestion.trim()}
                onClick={() => {
                  if (suggestion) {
                    onApply(suggestion);
                    setSuggestion(null);
                  }
                }}
              >
                Apply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => {
                  setSuggestion(null);
                  setAiError(null);
                }}
              >
                Discard
              </Button>
            </div>
          </div>
          <div className="overflow-hidden">
            <CodeEditor
              defaultLanguage="javascript"
              height="150px"
              value={suggestion || ""}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                fontSize: 11,
                wordWrap: "off",
                tabSize: 2,
                domReadOnly: true,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CodeTestPanel({
  code,
  mode,
  disabled,
}: {
  code: string;
  mode: string;
  disabled: boolean;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    items?: unknown[];
    logs?: string[];
    error?: string;
  } | null>(null);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/workflows/test-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ error: data.error || "Test execution failed" });
      } else {
        setTestResult(data);
      }
    } catch (err) {
      setTestResult({ error: err instanceof Error ? err.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || testing || !code.trim()}
        onClick={runTest}
        className="w-full gap-1.5 text-xs"
      >
        {testing ? (
          <>
            <Settings className="h-3.5 w-3.5 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <HelpCircle className="h-3.5 w-3.5" />
            Test Code
          </>
        )}
      </Button>

      {testResult && (
        <div className="rounded-md border text-xs overflow-hidden">
          {testResult.error ? (
            <div className="bg-destructive/10 text-destructive p-2 font-mono whitespace-pre-wrap">
              {testResult.error}
            </div>
          ) : (
            <>
              {testResult.logs && testResult.logs.length > 0 && (
                <div className="border-b bg-muted/50 p-2">
                  <span className="text-[10px] font-medium text-muted-foreground">Console</span>
                  <pre className="mt-1 font-mono text-[10px] whitespace-pre-wrap text-muted-foreground">
                    {testResult.logs.join("\n")}
                  </pre>
                </div>
              )}
              <div className="p-2">
                <span className="text-[10px] font-medium text-muted-foreground">Output</span>
                <pre className="mt-1 font-mono text-[10px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {JSON.stringify(testResult.items, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Merge config component ──

const MERGE_MODES = [
  { value: "append", label: "Append" },
  { value: "byPosition", label: "Combine by Position" },
  { value: "byField", label: "Combine by Field" },
] as const;

function MergeFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  useEffect(() => {
    if (!config?.mode) onUpdateConfig("mode", "append");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mode = (config?.mode as string) || "append";

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Mode</Label>
        <Select
          disabled={disabled}
          value={mode}
          onValueChange={(v) => onUpdateConfig("mode", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MERGE_MODES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                <span className="text-xs">{m.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">
          {mode === "append" && "Concatenates all items from all branches into one list."}
          {mode === "byPosition" && "Zips items by index, merging fields from each branch."}
          {mode === "byField" && "Joins items from branches using a matching field value."}
        </p>
      </div>
      {mode === "byField" && (
        <>
          <div className="space-y-1.5">
            <Label>Join Field(s)</Label>
            <TemplateBadgeInput
              disabled={disabled}
              placeholder="e.g. id, email (comma-separated for multiple)"
              value={(config?.joinField as string) || ""}
              onChange={(val) => onUpdateConfig("joinField", val)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Output Type</Label>
            <Select
              disabled={disabled}
              value={(config?.joinMode as string) || "keepMatches"}
              onValueChange={(v) => onUpdateConfig("joinMode", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keepMatches"><span className="text-xs">Keep Matches (Inner Join)</span></SelectItem>
                <SelectItem value="keepEverything"><span className="text-xs">Keep Everything (Outer Join)</span></SelectItem>
                <SelectItem value="keepNonMatches"><span className="text-xs">Keep Non-Matches</span></SelectItem>
                <SelectItem value="enrichInput1"><span className="text-xs">Enrich Input 1 (Left Join)</span></SelectItem>
                <SelectItem value="enrichInput2"><span className="text-xs">Enrich Input 2 (Right Join)</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>When Fields Clash</Label>
            <Select
              disabled={disabled}
              value={(config?.clashHandling as string) || "preferInput2"}
              onValueChange={(v) => onUpdateConfig("clashHandling", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preferInput1"><span className="text-xs">Prefer Input 1</span></SelectItem>
                <SelectItem value="preferInput2"><span className="text-xs">Prefer Input 2</span></SelectItem>
                <SelectItem value="addSuffix"><span className="text-xs">Add Suffix (_1, _2)</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Multiple Matches</Label>
            <Select
              disabled={disabled}
              value={(config?.multipleMatches as string) || "all"}
              onValueChange={(v) => onUpdateConfig("multipleMatches", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><span className="text-xs">Include All Matches</span></SelectItem>
                <SelectItem value="first"><span className="text-xs">First Match Only</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sort config component ──

const SORT_TYPES = [
  { value: "auto", label: "Auto" },
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
] as const;

function SortFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  useEffect(() => {
    if (!config?.direction) onUpdateConfig("direction", "ascending");
    if (!config?.dataType) onUpdateConfig("dataType", "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Sort By Field</Label>
        <TemplateBadgeInput
          disabled={disabled}
          placeholder="e.g. amount, created_at, name"
          value={(config?.sortField as string) || ""}
          onChange={(val) => onUpdateConfig("sortField", val)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Direction</Label>
        <Select
          disabled={disabled}
          value={(config?.direction as string) || "ascending"}
          onValueChange={(v) => onUpdateConfig("direction", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ascending"><span className="text-xs">Ascending</span></SelectItem>
            <SelectItem value="descending"><span className="text-xs">Descending</span></SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Data Type</Label>
        <Select
          disabled={disabled}
          value={(config?.dataType as string) || "auto"}
          onValueChange={(v) => onUpdateConfig("dataType", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <span className="text-xs">{t.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ── Remove Duplicates config component ──

function RemoveDuplicatesFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  useEffect(() => {
    if (!config?.keep) onUpdateConfig("keep", "first");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Deduplicate By</Label>
        <TemplateBadgeInput
          disabled={disabled}
          placeholder="e.g. id, email"
          value={(config?.dedupField as string) || ""}
          onChange={(val) => onUpdateConfig("dedupField", val)}
        />
        <p className="text-[10px] text-muted-foreground">
          Field path to use as the unique key for deduplication.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>Keep</Label>
        <Select
          disabled={disabled}
          value={(config?.keep as string) || "first"}
          onValueChange={(v) => onUpdateConfig("keep", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first"><span className="text-xs">First Occurrence</span></SelectItem>
            <SelectItem value="last"><span className="text-xs">Last Occurrence</span></SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ── Loop Over Batches config component ──

function LoopBatchesFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  useEffect(() => {
    if (config?.batchSize === undefined) onUpdateConfig("batchSize", "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Batch Size</Label>
        <div className="flex items-center gap-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || Number(config?.batchSize ?? 1) <= 1}
            className="h-8 w-8 rounded-r-none border-r-0 shrink-0"
            onClick={() => {
              const cur = Math.max(1, parseInt(String(config?.batchSize ?? "1"), 10) || 1);
              onUpdateConfig("batchSize", String(Math.max(1, cur - 1)));
            }}
          >
            <span className="text-sm font-medium">−</span>
          </Button>
          <Input
            type="number"
            min="1"
            disabled={disabled}
            value={(config?.batchSize as string) ?? "1"}
            onChange={(e) => onUpdateConfig("batchSize", e.target.value)}
            className="h-8 text-xs text-center rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            className="h-8 w-8 rounded-l-none border-l-0 shrink-0"
            onClick={() => {
              const cur = parseInt(String(config?.batchSize ?? "1"), 10) || 1;
              onUpdateConfig("batchSize", String(cur + 1));
            }}
          >
            <span className="text-sm font-medium">+</span>
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Items are split into batches of this size. Connect the &quot;batch&quot; output to processing nodes and &quot;done&quot; to continue.
        </p>
      </div>
    </div>
  );
}

// ── Split Out config component ──

function SplitOutFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  useEffect(() => {
    if (config?.includeOtherFields === undefined) onUpdateConfig("includeOtherFields", "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Field to Split</Label>
        <TemplateBadgeInput
          disabled={disabled}
          placeholder="e.g. rows, data.items, names"
          value={(config?.fieldPath as string) || ""}
          onChange={(val) => onUpdateConfig("fieldPath", val)}
        />
        <p className="text-[10px] text-muted-foreground">
          Path to the array field to explode into individual items.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeOtherFields"
          disabled={disabled}
          checked={(config?.includeOtherFields as string) !== "false"}
          onChange={(e) => onUpdateConfig("includeOtherFields", e.target.checked ? "true" : "false")}
          className="h-4 w-4 rounded border"
        />
        <Label htmlFor="includeOtherFields" className="text-xs cursor-pointer">
          Include other fields from parent item
        </Label>
      </div>
    </div>
  );
}

// ── Limit config component ──

function LimitFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  useEffect(() => {
    if (config?.maxItems === undefined) onUpdateConfig("maxItems", "1");
    if (!config?.from) onUpdateConfig("from", "beginning");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Max Items</Label>
        <div className="flex items-center gap-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || Number(config?.maxItems ?? 1) <= 0}
            className="h-8 w-8 rounded-r-none border-r-0 shrink-0"
            onClick={() => {
              const cur = Math.max(0, parseInt(String(config?.maxItems ?? "1"), 10) || 1);
              onUpdateConfig("maxItems", String(Math.max(0, cur - 1)));
            }}
          >
            <span className="text-sm font-medium">−</span>
          </Button>
          <Input
            type="number"
            min="0"
            disabled={disabled}
            value={(config?.maxItems as string) ?? "1"}
            onChange={(e) => onUpdateConfig("maxItems", e.target.value)}
            className="h-8 text-xs text-center rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            className="h-8 w-8 rounded-l-none border-l-0 shrink-0"
            onClick={() => {
              const cur = parseInt(String(config?.maxItems ?? "1"), 10) || 1;
              onUpdateConfig("maxItems", String(cur + 1));
            }}
          >
            <span className="text-sm font-medium">+</span>
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>From</Label>
        <Select
          disabled={disabled}
          value={(config?.from as string) || "beginning"}
          onValueChange={(v) => onUpdateConfig("from", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginning"><span className="text-xs">Beginning</span></SelectItem>
            <SelectItem value="end"><span className="text-xs">End</span></SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ── Aggregate config component ──

const AGG_OPERATIONS = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "average", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "groupBy", label: "Group By" },
] as const;

function AggregateFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  const operation = (config?.operation as string) || "count";

  useEffect(() => {
    if (!config?.operation) onUpdateConfig("operation", "count");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Operation</Label>
        <Select
          disabled={disabled}
          value={operation}
          onValueChange={(v) => onUpdateConfig("operation", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGG_OPERATIONS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                <span className="text-xs">{op.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {operation !== "count" && (
        <div className="space-y-1.5">
          <Label>{operation === "groupBy" ? "Group By Field" : "Field"}</Label>
          <TemplateBadgeInput
            disabled={disabled}
            placeholder="e.g. amount, price, category"
            value={(operation === "groupBy" ? (config?.groupByField as string) : (config?.field as string)) || ""}
            onChange={(val) => onUpdateConfig(operation === "groupBy" ? "groupByField" : "field", val)}
          />
        </div>
      )}

      {operation === "groupBy" && (
        <p className="text-[10px] text-muted-foreground">
          Items will be grouped by the specified field value. Output: groups object with arrays of items.
        </p>
      )}
    </div>
  );
}

// ── Switch config component ──

const SWITCH_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not Contains" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less or Equal" },
  { value: "regex", label: "Regex Match" },
] as const;

type SwitchRule = {
  output: string;
  operator: string;
  value: string;
};

function SwitchFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  const switchMode = (config?.switchMode as string) || "rules";

  let rules: SwitchRule[] = [];
  try {
    rules = JSON.parse((config?.rules as string) || "[]");
  } catch {
    rules = [];
  }
  if (rules.length === 0) {
    rules = [{ output: "case_1", operator: "equals", value: "" }];
  }

  useEffect(() => {
    if (!config?.switchMode) onUpdateConfig("switchMode", "rules");
    if (!config?.rules) onUpdateConfig("rules", JSON.stringify(rules));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (newRules: SwitchRule[]) => {
    onUpdateConfig("rules", JSON.stringify(newRules));
  };

  const updateRule = (idx: number, key: keyof SwitchRule, val: string) => {
    const updated = [...rules];
    updated[idx] = { ...updated[idx], [key]: val };
    update(updated);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Mode</Label>
        <Select
          disabled={disabled}
          value={switchMode}
          onValueChange={(v) => onUpdateConfig("switchMode", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rules"><span className="text-xs">Rules</span></SelectItem>
            <SelectItem value="expression"><span className="text-xs">Expression</span></SelectItem>
          </SelectContent>
        </Select>
      </div>

      {switchMode === "expression" ? (
        <>
          <div className="space-y-1.5">
            <Label>Output Expression</Label>
            <TemplateBadgeInput
              disabled={disabled}
              placeholder="Use @ to return output name or index (e.g. 0, 1, 2)"
              value={(config?.outputExpression as string) || ""}
              onChange={(val) => onUpdateConfig("outputExpression", val)}
            />
            <p className="text-[10px] text-muted-foreground">
              Expression should resolve to an output index (0, 1, 2...) or output name. Use @ to reference previous nodes.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Number of Outputs</Label>
            <div className="flex items-center gap-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled || Number(config?.numberOutputs ?? 4) <= 2}
                className="h-8 w-8 rounded-r-none border-r-0 shrink-0"
                onClick={() => {
                  const cur = parseInt(String(config?.numberOutputs ?? "4"), 10) || 4;
                  onUpdateConfig("numberOutputs", String(Math.max(2, cur - 1)));
                }}
              >
                <span className="text-sm font-medium">−</span>
              </Button>
              <Input
                type="number"
                min="2"
                disabled={disabled}
                value={(config?.numberOutputs as string) ?? "4"}
                onChange={(e) => onUpdateConfig("numberOutputs", e.target.value)}
                className="h-8 text-xs text-center rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled}
                className="h-8 w-8 rounded-l-none border-l-0 shrink-0"
                onClick={() => {
                  const cur = parseInt(String(config?.numberOutputs ?? "4"), 10) || 4;
                  onUpdateConfig("numberOutputs", String(cur + 1));
                }}
              >
                <span className="text-sm font-medium">+</span>
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label>Value to Match</Label>
            <TemplateBadgeInput
              disabled={disabled}
              placeholder="Use @ to reference a previous node's output"
              value={(config?.switchValue as string) || ""}
              onChange={(val) => onUpdateConfig("switchValue", val)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Rules</Label>
            <div className="space-y-2">
              {rules.map((rule, idx) => (
                <div key={idx} className="rounded-md border p-2 space-y-1.5 bg-muted/30">
                  <div className="flex items-center gap-1.5">
                    <Input
                      disabled={disabled}
                      placeholder="output_name"
                      value={rule.output}
                      onChange={(e) => updateRule(idx, "output", e.target.value)}
                      className="flex-1 h-7 text-xs font-mono"
                    />
                    <Select
                      disabled={disabled}
                      value={rule.operator}
                      onValueChange={(v) => updateRule(idx, "operator", v)}
                    >
                      <SelectTrigger className="w-28 h-7 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SWITCH_OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            <span className="text-xs">{op.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {rules.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={disabled}
                        onClick={() => update(rules.filter((_, i) => i !== idx))}
                      >
                        <span className="text-sm">×</span>
                      </Button>
                    )}
                  </div>
                  <TemplateBadgeInput
                    disabled={disabled}
                    placeholder="Match value"
                    value={rule.value}
                    onChange={(val) => updateRule(idx, "value", val)}
                  />
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => update([...rules, { output: `case_${rules.length + 1}`, operator: "equals", value: "" }])}
              className="w-full gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Rule
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Rules are evaluated in order. First match wins. Unmatched routes to &quot;default&quot;.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ── DateTime config component ──

const DT_OPERATIONS = [
  { value: "getCurrent", label: "Get Current Date" },
  { value: "format", label: "Format Date" },
  { value: "addSubtract", label: "Add/Subtract Time" },
  { value: "compare", label: "Compare Dates" },
  { value: "parse", label: "Parse Date" },
] as const;

const DT_FORMATS = [
  { value: "ISO", label: "ISO 8601" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD HH:mm:ss", label: "YYYY-MM-DD HH:mm:ss" },
  { value: "unix", label: "Unix Timestamp (seconds)" },
  { value: "ms", label: "Unix Timestamp (ms)" },
] as const;

const DT_UNITS = [
  { value: "seconds", label: "Seconds" },
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
] as const;

function DateTimeFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  const operation = (config?.operation as string) || "getCurrent";

  useEffect(() => {
    if (!config?.operation) onUpdateConfig("operation", "getCurrent");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Operation</Label>
        <Select
          disabled={disabled}
          value={operation}
          onValueChange={(v) => onUpdateConfig("operation", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DT_OPERATIONS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                <span className="text-xs">{op.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Value (not needed for getCurrent) */}
      {operation !== "getCurrent" && (
        <div className="space-y-1.5">
          <Label>Date Value</Label>
          <TemplateBadgeInput
            disabled={disabled}
            placeholder="Use @ or enter a date string"
            value={(config?.dateValue as string) || ""}
            onChange={(val) => onUpdateConfig("dateValue", val)}
          />
        </div>
      )}

      {/* Output Format (for format, getCurrent, parse, addSubtract) */}
      {(operation === "format" || operation === "getCurrent" || operation === "parse" || operation === "addSubtract") && (
        <div className="space-y-1.5">
          <Label>Output Format</Label>
          <Select
            disabled={disabled}
            value={(config?.outputFormat as string) || "ISO"}
            onValueChange={(v) => onUpdateConfig("outputFormat", v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DT_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  <span className="text-xs">{f.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Add/Subtract fields */}
      {operation === "addSubtract" && (
        <>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                disabled={disabled}
                value={(config?.amount as string) || "0"}
                onChange={(e) => onUpdateConfig("amount", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Unit</Label>
              <Select
                disabled={disabled}
                value={(config?.unit as string) || "days"}
                onValueChange={(v) => onUpdateConfig("unit", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DT_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      <span className="text-xs">{u.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <Select
              disabled={disabled}
              value={(config?.direction as string) || "add"}
              onValueChange={(v) => onUpdateConfig("direction", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add"><span className="text-xs">Add</span></SelectItem>
                <SelectItem value="subtract"><span className="text-xs">Subtract</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Compare fields */}
      {operation === "compare" && (
        <>
          <div className="space-y-1.5">
            <Label>Second Date</Label>
            <TemplateBadgeInput
              disabled={disabled}
              placeholder="Use @ or enter a date string"
              value={(config?.secondDate as string) || ""}
              onChange={(val) => onUpdateConfig("secondDate", val)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Comparison</Label>
            <Select
              disabled={disabled}
              value={(config?.comparison as string) || "difference"}
              onValueChange={(v) => onUpdateConfig("comparison", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before"><span className="text-xs">Is Before</span></SelectItem>
                <SelectItem value="after"><span className="text-xs">Is After</span></SelectItem>
                <SelectItem value="same"><span className="text-xs">Is Same</span></SelectItem>
                <SelectItem value="difference"><span className="text-xs">Difference (ms)</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}

// ── Wait config component ──

const WAIT_UNITS = [
  { value: "seconds", label: "Seconds" },
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
] as const;

function WaitFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  // Initialize defaults on first render if not set
  useEffect(() => {
    if (config?.waitAmount === undefined || config?.waitAmount === null) onUpdateConfig("waitAmount", "0");
    if (!config?.waitUnit) onUpdateConfig("waitUnit", "seconds");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="waitAmount">Wait Amount</Label>
        <div className="flex items-center gap-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || Number(config?.waitAmount ?? 0) <= 0}
            className="h-8 w-8 rounded-r-none border-r-0 shrink-0"
            onClick={() => {
              const cur = Math.max(0, parseInt(String(config?.waitAmount ?? "0"), 10) || 0);
              onUpdateConfig("waitAmount", String(Math.max(0, cur - 1)));
            }}
          >
            <span className="text-sm font-medium">−</span>
          </Button>
          <Input
            id="waitAmount"
            type="number"
            min="0"
            step="1"
            disabled={disabled}
            value={(config?.waitAmount as string) ?? "0"}
            onChange={(e) => onUpdateConfig("waitAmount", e.target.value)}
            className="h-8 text-xs text-center rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            className="h-8 w-8 rounded-l-none border-l-0 shrink-0"
            onClick={() => {
              const cur = parseInt(String(config?.waitAmount ?? "0"), 10) || 0;
              onUpdateConfig("waitAmount", String(cur + 1));
            }}
          >
            <span className="text-sm font-medium">+</span>
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="waitUnit">Wait Unit</Label>
        <Select
          disabled={disabled}
          value={(config?.waitUnit as string) || "seconds"}
          onValueChange={(v) => onUpdateConfig("waitUnit", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WAIT_UNITS.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                <span className="text-xs">{u.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ── Set Fields config component ──

type ConditionalBranch = {
  condition: string;
  value: string;
  mode: "fixed" | "expression";
};

type SetFieldRow = {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "json" | "array";
  mode: "fixed" | "expression";
  value: string;
  conditional?: boolean;
  branches?: ConditionalBranch[];
  elseValue?: string;
  elseMode?: "fixed" | "expression";
  /** @deprecated legacy single-condition field */
  condition?: string;
};

function migrateLegacyRow(row: SetFieldRow): SetFieldRow {
  if (row.conditional && row.condition && !row.branches) {
    return {
      ...row,
      branches: [{ condition: row.condition, value: row.value, mode: row.mode }],
      condition: undefined,
    };
  }
  return row;
}

const DEFAULT_BRANCH: ConditionalBranch = { condition: "", value: "", mode: "fixed" };

const SET_FIELD_TYPES = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "json", label: "JSON" },
  { value: "array", label: "Array" },
] as const;

function SetFieldValueInput({
  field,
  mode,
  fieldValue,
  disabled,
  onChangeValue,
  onChangeMode,
  placeholder,
}: {
  field: SetFieldRow;
  mode: "fixed" | "expression";
  fieldValue: string;
  disabled: boolean;
  onChangeValue: (val: string) => void;
  onChangeMode: (mode: "fixed" | "expression") => void;
  placeholder?: string;
}) {
  return (
    <>
      <div>
        {mode === "expression" ? (
          <TemplateBadgeInput
            disabled={disabled}
            placeholder={placeholder ?? "Use @ to reference previous nodes"}
            value={fieldValue}
            onChange={onChangeValue}
          />
        ) : field.type === "boolean" ? (
          <Select
            disabled={disabled}
            value={fieldValue || "false"}
            onValueChange={onChangeValue}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">
                <span className="text-xs">true</span>
              </SelectItem>
              <SelectItem value="false">
                <span className="text-xs">false</span>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            disabled={disabled}
            placeholder={
              field.type === "number"
                ? "0"
                : field.type === "date"
                  ? "2026-01-15"
                  : field.type === "json"
                    ? '{"key": "value"}'
                    : field.type === "array"
                      ? '["a", "b"]'
                      : "value"
            }
            value={fieldValue}
            onChange={(e) => onChangeValue(e.target.value)}
            className="h-8 text-xs"
          />
        )}
      </div>
      <div className="flex shrink-0 rounded-md border overflow-hidden h-7 w-fit">
        <button
          type="button"
          disabled={disabled}
          className={`px-2.5 text-[10px] font-medium transition-colors ${
            mode === "fixed"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          onClick={() => onChangeMode("fixed")}
        >
          Fixed
        </button>
        <button
          type="button"
          disabled={disabled}
          className={`px-2.5 text-[10px] font-medium transition-colors ${
            mode === "expression"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          onClick={() => onChangeMode("expression")}
        >
          Expression
        </button>
      </div>
    </>
  );
}

function SetFieldsFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  let fields: SetFieldRow[] = [];
  try {
    fields = (JSON.parse((config?.fields as string) || "[]") as SetFieldRow[]).map(migrateLegacyRow);
  } catch {
    fields = [];
  }

  if (fields.length === 0) {
    fields = [{ name: "", type: "string", mode: "fixed", value: "" }];
  }

  const update = (newFields: SetFieldRow[]) => {
    onUpdateConfig("fields", JSON.stringify(newFields));
  };

  const updateRow = (index: number, patch: Partial<SetFieldRow>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...patch };
    if ("type" in patch && patch.type !== fields[index].type) {
      updated[index].value = "";
      updated[index].elseValue = "";
      if (updated[index].branches) {
        updated[index].branches = updated[index].branches!.map((b) => ({ ...b, value: "" }));
      }
    }
    update(updated);
  };

  const updateBranch = (rowIdx: number, branchIdx: number, patch: Partial<ConditionalBranch>) => {
    const updated = [...fields];
    const branches = [...(updated[rowIdx].branches || [])];
    branches[branchIdx] = { ...branches[branchIdx], ...patch };
    updated[rowIdx] = { ...updated[rowIdx], branches };
    update(updated);
  };

  const addBranch = (rowIdx: number) => {
    const updated = [...fields];
    const branches = [...(updated[rowIdx].branches || [])];
    branches.push({ ...DEFAULT_BRANCH });
    updated[rowIdx] = { ...updated[rowIdx], branches };
    update(updated);
  };

  const removeBranch = (rowIdx: number, branchIdx: number) => {
    const updated = [...fields];
    const branches = [...(updated[rowIdx].branches || [])];
    if (branches.length <= 1) return;
    branches.splice(branchIdx, 1);
    updated[rowIdx] = { ...updated[rowIdx], branches };
    update(updated);
  };

  const addRow = () => {
    update([...fields, { name: "", type: "string", mode: "fixed", value: "" }]);
  };

  const removeRow = (index: number) => {
    if (fields.length <= 1) return;
    update(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>Fields to Set</Label>
      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div
            key={idx}
            className="rounded-md border p-3 space-y-2 bg-muted/30"
          >
            {/* Row 1: Name + Type */}
            <div className="flex items-center gap-2">
              <Input
                disabled={disabled}
                placeholder="field_name"
                value={field.name}
                onChange={(e) => updateRow(idx, { name: e.target.value })}
                className="flex-1 h-8 text-xs font-mono"
              />
              <Select
                disabled={disabled}
                value={field.type}
                onValueChange={(v) => updateRow(idx, { type: v as SetFieldRow["type"] })}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SET_FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="text-xs">{t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fields.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={disabled}
                  onClick={() => removeRow(idx)}
                >
                  <span className="text-sm">×</span>
                </Button>
              )}
            </div>

            {/* Conditional toggle + collapsible section */}
            <Collapsible defaultOpen={!!field.conditional}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`conditional-${idx}`}
                  disabled={disabled}
                  checked={!!field.conditional}
                  onChange={(e) => {
                    const on = e.target.checked;
                    updateRow(idx, {
                      conditional: on,
                      branches: on ? (field.branches?.length ? field.branches : [{ ...DEFAULT_BRANCH }]) : field.branches,
                      elseValue: on ? (field.elseValue ?? "") : field.elseValue,
                      elseMode: on ? (field.elseMode ?? "fixed") : field.elseMode,
                    });
                  }}
                  className="h-3.5 w-3.5 rounded border"
                />
                <Label
                  htmlFor={`conditional-${idx}`}
                  className="text-[10px] cursor-pointer text-muted-foreground"
                >
                  Conditional
                </Label>
                {field.conditional && (
                  <CollapsibleTrigger className="ml-auto flex items-center gap-1 group cursor-pointer text-muted-foreground hover:text-foreground">
                    <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                  </CollapsibleTrigger>
                )}
              </div>

              {field.conditional ? (
                <CollapsibleContent className="space-y-2 pt-2">
                  {/* Branches: IF / ELSE IF ... */}
                  {(field.branches || []).map((branch, bIdx) => (
                    <Collapsible key={bIdx} defaultOpen={bIdx === 0}>
                      <div className="rounded-md border border-dashed bg-background/50 overflow-hidden">
                        <div className="flex items-center justify-between px-2.5 py-1.5">
                          <CollapsibleTrigger className="flex items-center gap-1.5 group cursor-pointer">
                            <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {bIdx === 0 ? "If" : "Else If"}
                            </span>
                          </CollapsibleTrigger>
                          {(field.branches?.length ?? 0) > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                              disabled={disabled}
                              onClick={() => removeBranch(idx, bIdx)}
                            >
                              <span className="text-xs">×</span>
                            </Button>
                          )}
                        </div>
                        <CollapsibleContent className="px-2.5 pb-2.5 space-y-2">
                          <ConditionBuilderInline
                            disabled={disabled}
                            value={branch.condition}
                            onChange={(val) => updateBranch(idx, bIdx, { condition: val })}
                          />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Then
                          </span>
                          <SetFieldValueInput
                            field={field}
                            mode={branch.mode}
                            fieldValue={branch.value}
                            disabled={disabled}
                            onChangeValue={(val) => updateBranch(idx, bIdx, { value: val })}
                            onChangeMode={(m) => updateBranch(idx, bIdx, { mode: m })}
                          />
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}

                  {/* Add branch button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => addBranch(idx)}
                    className="w-full gap-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Branch
                  </Button>

                  {/* ELSE fallback */}
                  <Collapsible defaultOpen>
                    <div className="rounded-md border border-dashed bg-background/50 overflow-hidden">
                      <div className="px-2.5 py-1.5">
                        <CollapsibleTrigger className="flex items-center gap-1.5 group cursor-pointer">
                          <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Else
                          </span>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="px-2.5 pb-2.5 space-y-2">
                        <SetFieldValueInput
                          field={field}
                          mode={field.elseMode || "fixed"}
                          fieldValue={field.elseValue || ""}
                          disabled={disabled}
                          onChangeValue={(val) => updateRow(idx, { elseValue: val })}
                          onChangeMode={(m) => updateRow(idx, { elseMode: m })}
                          placeholder="Default value when no condition matches"
                        />
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </CollapsibleContent>
              ) : (
                <>
                  {/* Non-conditional: value + mode toggle (original layout) */}
                  <SetFieldValueInput
                    field={field}
                    mode={field.mode}
                    fieldValue={field.value}
                    disabled={disabled}
                    onChangeValue={(val) => updateRow(idx, { value: val })}
                    onChangeMode={(m) => updateRow(idx, { mode: m })}
                  />
                </>
              )}
            </Collapsible>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={addRow}
        className="w-full gap-1.5 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Field
      </Button>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="includeInputFields"
          disabled={disabled}
          checked={(config?.includeInputFields as string) !== "false"}
          onChange={(e) => onUpdateConfig("includeInputFields", e.target.checked ? "true" : "false")}
          className="h-4 w-4 rounded border"
        />
        <Label htmlFor="includeInputFields" className="text-xs cursor-pointer">
          Include other input fields
        </Label>
      </div>
      <p className="text-[10px] text-muted-foreground">
        When enabled, all fields from the input item are kept and the fields above are added/overwritten.
      </p>
    </div>
  );
}

// System actions that don't have plugins
const SYSTEM_ACTIONS: Array<{ id: string; label: string }> = [
  { id: "HTTP Request", label: "HTTP Request" },
  { id: "Database Query", label: "Database Query" },
  { id: "Condition", label: "Condition" },
  { id: "Set Fields", label: "Set Fields" },
  { id: "Wait", label: "Wait" },
  { id: "Code", label: "Code" },
  { id: "Switch", label: "Switch" },
  { id: "Filter", label: "Filter" },
  { id: "DateTime", label: "DateTime" },
  { id: "Split Out", label: "Split Out" },
  { id: "Limit", label: "Limit" },
  { id: "Aggregate", label: "Aggregate" },
  { id: "Merge", label: "Merge" },
  { id: "Sort", label: "Sort" },
  { id: "Remove Duplicates", label: "Remove Duplicates" },
  { id: "Loop Over Batches", label: "Loop Over Batches" },
];

const SYSTEM_ACTION_IDS = SYSTEM_ACTIONS.map((a) => a.id);

// System actions that need integrations (not in plugin registry)
const SYSTEM_ACTION_INTEGRATIONS: Record<string, IntegrationType> = {
  "Database Query": "database",
};

// Build category mapping dynamically from plugins + System
function useCategoryData() {
  return useMemo(() => {
    const pluginCategories = getActionsByCategory();

    // Build category map including System with both id and label
    const allCategories: Record<
      string,
      Array<{ id: string; label: string }>
    > = {
      System: SYSTEM_ACTIONS,
    };

    for (const [category, actions] of Object.entries(pluginCategories)) {
      allCategories[category] = actions.map((a) => ({
        id: a.id,
        label: a.label,
      }));
    }

    return allCategories;
  }, []);
}

// Get category for an action type (supports both new IDs, labels, and legacy labels)
function getCategoryForAction(actionType: string): string | null {
  // Check system actions first
  if (SYSTEM_ACTION_IDS.includes(actionType)) {
    return "System";
  }

  // Use findActionById which handles legacy labels from plugin registry
  const action = findActionById(actionType);
  if (action?.category) {
    return action.category;
  }

  return null;
}

// Normalize action type to new ID format (handles legacy labels via findActionById)
function normalizeActionType(actionType: string): string {
  // Check system actions first - they use their label as ID
  if (SYSTEM_ACTION_IDS.includes(actionType)) {
    return actionType;
  }

  // Use findActionById which handles legacy labels and returns the proper ID
  const action = findActionById(actionType);
  if (action) {
    return action.id;
  }

  return actionType;
}

export function ActionConfig({
  config,
  onUpdateConfig,
  onBatchUpdateConfig,
  disabled,
  isOwner = true,
}: ActionConfigProps) {
  const actionType = (config?.actionType as string) || "";
  const categories = useCategoryData();
  const integrations = useMemo(() => getAllIntegrations(), []);

  const selectedCategory = actionType ? getCategoryForAction(actionType) : null;
  const [category, setCategory] = useState<string>(selectedCategory || "");
  const setIntegrationsVersion = useSetAtom(integrationsVersionAtom);
  const globalIntegrations = useAtomValue(integrationsAtom);
  const { push } = useOverlay();

  // AI Gateway managed keys state
  const aiGatewayStatus = useAtomValue(aiGatewayStatusAtom);

  // Sync category state when actionType changes (e.g., when switching nodes)
  useEffect(() => {
    const newCategory = actionType ? getCategoryForAction(actionType) : null;
    setCategory(newCategory || "");
  }, [actionType]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    // Auto-select the first action in the new category
    const firstAction = categories[newCategory]?.[0];
    if (firstAction) {
      onUpdateConfig("actionType", firstAction.id);
    }
  };

  const handleActionTypeChange = (value: string) => {
    onUpdateConfig("actionType", value);
  };

  // Adapter for plugin config components that expect (key, value: unknown)
  const handlePluginUpdateConfig = (key: string, value: unknown) => {
    onUpdateConfig(key, String(value));
  };

  // Get dynamic config fields for plugin actions
  const pluginAction = actionType ? findActionById(actionType) : null;

  // Determine the integration type for the current action
  const integrationType: IntegrationType | undefined = useMemo(() => {
    if (!actionType) {
      return;
    }

    // Check system actions first
    if (SYSTEM_ACTION_INTEGRATIONS[actionType]) {
      return SYSTEM_ACTION_INTEGRATIONS[actionType];
    }

    // Check plugin actions
    const action = findActionById(actionType);
    return action?.integration as IntegrationType | undefined;
  }, [actionType]);

  // Check if AI Gateway managed keys should be offered (user can have multiple for different teams)
  const shouldUseManagedKeys =
    integrationType === "ai-gateway" &&
    aiGatewayStatus?.enabled &&
    aiGatewayStatus?.isVercelUser;

  // Check if there are existing connections for this integration type
  const hasExistingConnections = useMemo(() => {
    if (!integrationType) return false;
    return globalIntegrations.some((i) => i.type === integrationType);
  }, [integrationType, globalIntegrations]);

  const handleConsentSuccess = (integrationId: string) => {
    onUpdateConfig("integrationId", integrationId);
    setIntegrationsVersion((v) => v + 1);
  };

  const openConnectionOverlay = () => {
    if (integrationType) {
      push(ConfigureConnectionOverlay, {
        type: integrationType,
        onSuccess: (integrationId: string) => {
          setIntegrationsVersion((v) => v + 1);
          onUpdateConfig("integrationId", integrationId);
        },
      });
    }
  };

  const handleAddSecondaryConnection = () => {
    if (shouldUseManagedKeys) {
      push(AiGatewayConsentOverlay, {
        onConsent: handleConsentSuccess,
        onManualEntry: openConnectionOverlay,
      });
    } else {
      openConnectionOverlay();
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="ml-1" htmlFor="actionCategory">
            Service
          </Label>
          <Select
            disabled={disabled}
            onValueChange={handleCategoryChange}
            value={category || undefined}
          >
            <SelectTrigger className="w-full" id="actionCategory">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="System">
                <div className="flex items-center gap-2">
                  <Settings className="size-4" />
                  <span>System</span>
                </div>
              </SelectItem>
              <SelectSeparator />
              {integrations.map((integration) => (
                <SelectItem key={integration.type} value={integration.label}>
                  <div className="flex items-center gap-2">
                    <IntegrationIcon
                      className="size-4"
                      integration={integration.type}
                    />
                    <span>{integration.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="ml-1" htmlFor="actionType">
            Action
          </Label>
          <Select
            disabled={disabled || !category}
            onValueChange={handleActionTypeChange}
            value={normalizeActionType(actionType) || undefined}
          >
            <SelectTrigger className="w-full" id="actionType">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {category &&
                categories[category]?.map((action) => (
                  <SelectItem key={action.id} value={action.id}>
                    {action.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {integrationType && isOwner && (
        <div className="space-y-2">
          <div className="ml-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label>Connection</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="size-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>API key or OAuth credentials for this service</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {hasExistingConnections && (
              <Button
                className="size-6"
                disabled={disabled}
                onClick={handleAddSecondaryConnection}
                size="icon"
                variant="ghost"
              >
                <Plus className="size-4" />
              </Button>
            )}
          </div>
          <IntegrationSelector
            disabled={disabled}
            integrationType={integrationType}
            onChange={(id) => onUpdateConfig("integrationId", id)}
            value={(config?.integrationId as string) || ""}
          />
        </div>
      )}

      {/* System actions - hardcoded config fields */}
      <SystemActionFields
        actionType={(config?.actionType as string) || ""}
        config={config}
        disabled={disabled}
        onUpdateConfig={onUpdateConfig}
        onBatchUpdateConfig={onBatchUpdateConfig}
      />

      {/* Plugin actions - declarative config fields */}
      {pluginAction && !SYSTEM_ACTION_IDS.includes(actionType) && (
        <ActionConfigRenderer
          config={config}
          disabled={disabled}
          fields={pluginAction.configFields}
          onUpdateConfig={handlePluginUpdateConfig}
        />
      )}
    </>
  );
}
