"use client";

import { useReactFlow } from "@xyflow/react";
import { useAtom, useAtomValue } from "jotai";
import { ArrowUp, Loader2, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@repo/ui/shadcn/button";
import { api } from "@/components/workflow-builder/lib/api-client";
import { diffWorkflow } from "@/components/workflow-builder/lib/ai-diff";
import {
  aiProposalAtom,
  currentWorkflowIdAtom,
  currentWorkflowNameAtom,
  edgesAtom,
  isGeneratingAtom,
  nodesAtom,
  selectedNodeAtom,
} from "@/components/workflow-builder/lib/workflow-store";

type AIPromptProps = {
  workflowId?: string;
  onWorkflowCreated?: (workflowId: string) => void;
};

export function AIPrompt({ workflowId, onWorkflowCreated }: AIPromptProps) {
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [prompt, setPrompt] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nodes = useAtomValue(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  const [_nodes, setNodes] = useAtom(nodesAtom);
  const [_currentWorkflowId, setCurrentWorkflowId] = useAtom(currentWorkflowIdAtom);
  const [_currentWorkflowName, setCurrentWorkflowName] = useAtom(currentWorkflowNameAtom);
  const [_selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeAtom);
  const [_proposal, setAiProposal] = useAtom(aiProposalAtom);
  const { fitView } = useReactFlow();

  const realNodes = nodes.filter((node) => node.type !== "add");
  const hasNodes = realNodes.length > 0;

  // Cache available integrations so we don't refetch on every submit
  const integrationsRef = useRef<string[] | null>(null);
  useEffect(() => {
    api.integration
      .getAll()
      .then((list) => {
        integrationsRef.current = list.map((i) => i.type);
      })
      .catch(() => {
        integrationsRef.current = [];
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleFocus = () => {
    setIsExpanded(true);
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsFocused(false);
    if (!prompt.trim()) {
      setIsExpanded(false);
    }
  };

  const handleGenerate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!prompt.trim() || isGenerating) {
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setIsGenerating(true);
      setStreamStatus("Thinking...");

      try {
        const existingWorkflow = hasNodes
          ? { nodes: realNodes, edges, name: _currentWorkflowName }
          : undefined;

        const workflowData = await api.ai.generateStream(
          prompt,
          (partialData) => {
            const nodeCount = (partialData.nodes || []).length;
            const edgeCount = (partialData.edges || []).length;

            if (!hasNodes) {
              // Fresh canvas: show streaming preview directly
              const edgesWithAnimatedType = (partialData.edges || []).map(
                (edge) => ({ ...edge, type: "animated" }),
              );
              setNodes(partialData.nodes || []);
              setEdges(edgesWithAnimatedType);
              if (partialData.name) {
                setCurrentWorkflowName(partialData.name);
              }
              setTimeout(() => fitView({ padding: 0.2, duration: 200 }), 0);
              setStreamStatus(
                nodeCount > 0
                  ? `Building workflow — ${nodeCount} node${nodeCount !== 1 ? "s" : ""}...`
                  : "Thinking...",
              );
            } else {
              // Existing workflow: show progress in the bar
              setStreamStatus(
                nodeCount > 0
                  ? `Analyzing ${nodeCount} node${nodeCount !== 1 ? "s" : ""}, ${edgeCount} connection${edgeCount !== 1 ? "s" : ""}...`
                  : "Analyzing workflow...",
              );
            }
          },
          existingWorkflow,
          integrationsRef.current ?? [],
          controller.signal,
        );

        setStreamStatus("Applying changes...");

        const finalEdges = (workflowData.edges || []).map((edge) => ({
          ...edge,
          type: "animated",
        }));
        const finalNodes = workflowData.nodes || [];

        // Validate completeness
        const incompleteNodes = finalNodes.filter((node) => {
          const nodeType = node.data?.type;
          const config = node.data?.config || {};
          if (nodeType === "trigger") return !config.triggerType;
          if (nodeType === "action") return !config.actionType;
          return false;
        });

        if (incompleteNodes.length > 0) {
          console.error("[AI Prompt] Incomplete nodes:", incompleteNodes.map((n) => n.id));
          toast.error(
            `${incompleteNodes.length} node(s) missing configuration — please review and fill in details.`,
          );
        }

        if (hasNodes && workflowId) {
          // Existing workflow: open review panel with diff
          const { nodeChanges, edgeChanges } = diffWorkflow(
            realNodes,
            edges,
            finalNodes,
            finalEdges,
          );

          if (nodeChanges.length === 0 && edgeChanges.length === 0) {
            toast.info("AI returned the same workflow — no changes detected.");
          } else {
            setAiProposal({
              name: workflowData.name,
              description: workflowData.description,
              nodeChanges,
              edgeChanges,
              proposedNodes: finalNodes,
              proposedEdges: finalEdges,
            });

            setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
            toast.info(
              `${nodeChanges.length} change${nodeChanges.length !== 1 ? "s" : ""} proposed — review before applying.`,
            );
          }
        } else {
          // Fresh canvas: apply directly
          if (!workflowId) {
            const newWorkflow = await api.workflow.create({
              name: workflowData.name || "AI Generated Workflow",
              description: workflowData.description || "",
              nodes: finalNodes,
              edges: finalEdges,
            });

            setCurrentWorkflowId(newWorkflow.id);
            toast.success("Workflow created");

            if (onWorkflowCreated) {
              onWorkflowCreated(newWorkflow.id);
            }
          } else {
            setCurrentWorkflowId(workflowId);
            setNodes(finalNodes);
            setEdges(finalEdges);
            if (workflowData.name) {
              setCurrentWorkflowName(workflowData.name);
            }

            await api.workflow.update(workflowId, {
              name: workflowData.name,
              description: workflowData.description,
              nodes: finalNodes,
              edges: finalEdges,
            });

            toast.success("Workflow generated");
          }
        }

        setPrompt("");
        setIsExpanded(false);
        setIsFocused(false);
        inputRef.current?.blur();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          toast.info("Generation stopped.");
        } else {
          console.error("Failed to generate workflow:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to generate workflow",
          );
        }
      } finally {
        abortRef.current = null;
        setIsGenerating(false);
        setStreamStatus(null);
      }
    },
    [
      prompt,
      isGenerating,
      workflowId,
      hasNodes,
      realNodes,
      edges,
      _currentWorkflowName,
      setIsGenerating,
      setCurrentWorkflowId,
      setNodes,
      setEdges,
      setCurrentWorkflowName,
      setSelectedNodeId,
      setAiProposal,
      onWorkflowCreated,
      fitView,
    ],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const barExpanded = isExpanded || isGenerating;

  return (
    <>
      {/* Always visible prompt input */}
      <div
        ref={containerRef}
        className="pointer-events-auto absolute bottom-4 left-1/2 z-10 -translate-x-1/2 px-4"
        style={{
          width: barExpanded ? "min(100%, 42rem)" : "20rem",
          transition: "width 150ms ease-out",
        }}
      >
        <form
          aria-busy={isGenerating}
          aria-label="AI workflow prompt"
          className={`relative flex items-center gap-2 rounded-lg border bg-background pl-3 pr-2 py-2 shadow-lg cursor-text transition-all duration-200 ${isGenerating ? "border-primary/50 shadow-primary/10 shadow-xl" : ""}`}
          onClick={(e) => {
            if (isGenerating) return;
            if (e.target === e.currentTarget || (e.target as HTMLElement).tagName !== 'BUTTON') {
              inputRef.current?.focus();
            }
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
          onSubmit={handleGenerate}
          role="search"
        >
          {isGenerating ? (
            <div className="flex flex-1 items-center gap-2.5 py-0.5 min-w-0 overflow-hidden">
              <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate text-foreground">
                  {streamStatus || "Thinking..."}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-full">
                  {prompt}
                </p>
              </div>
            </div>
          ) : (
            <textarea
              aria-label="Describe your workflow"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground resize-none h-[22px] min-h-[22px] max-h-[200px] py-0 leading-[22px]"
              disabled={isGenerating}
              onBlur={handleBlur}
              onChange={(e) => {
                setPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onFocus={handleFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate(e as any);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setPrompt("");
                  setIsExpanded(false);
                  setIsFocused(false);
                  inputRef.current?.blur();
                }
              }}
              placeholder={isFocused ? "Describe your workflow with natural language..." : "Ask AI..."}
              ref={inputRef}
              rows={1}
              value={prompt}
            />
          )}
          <div className="sr-only">
            {isGenerating ? "Generating workflow, please wait..." : ""}
          </div>
          <div className="relative size-8 shrink-0 self-end">
            {isGenerating ? (
              <Button
                aria-label="Stop generation"
                className="size-8 shrink-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                size="sm"
                type="button"
                onClick={handleStop}
              >
                <Square aria-hidden="true" className="size-3 fill-current" />
              </Button>
            ) : (
              <>
                <Button
                  aria-label="Focus prompt input (⌘K)"
                  className="absolute inset-0 h-8 px-0 text-xs text-muted-foreground hover:bg-transparent transition-[opacity,filter] ease-out"
                  onClick={() => inputRef.current?.focus()}
                  style={
                    !prompt.trim() && !isFocused
                      ? { opacity: 1, filter: "blur(0px)", pointerEvents: "auto", visibility: "visible" }
                      : { opacity: 0, filter: "blur(2px)", pointerEvents: "none", visibility: "hidden" }
                  }
                  type="button"
                  variant="ghost"
                >
                  <kbd aria-hidden="true" className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
                <Button
                  aria-label="Generate workflow"
                  className="size-8 transition-[opacity,filter] ease-out shrink-0"
                  disabled={!prompt.trim()}
                  size="sm"
                  style={
                    !prompt.trim() && !isFocused
                      ? { opacity: 0, filter: "blur(2px)", pointerEvents: "none", visibility: "hidden" }
                      : { opacity: 1, filter: "blur(0px)", pointerEvents: "auto", visibility: "visible" }
                  }
                  type="submit"
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

