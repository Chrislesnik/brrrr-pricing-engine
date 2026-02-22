"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { nanoid } from "nanoid";
import { Provider as JotaiProvider, useSetAtom, useAtom, useAtomValue } from "jotai";
import { Button } from "@repo/ui/shadcn/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/shadcn/alert-dialog";
import { ReactFlowProvider } from "@xyflow/react";
import { OverlayProvider } from "@/components/workflow-builder/overlays/overlay-provider";
import { OverlayContainer } from "@/components/workflow-builder/overlays/overlay-container";
import { NodeConfigPanel } from "@/components/workflow-builder/workflow/node-config-panel";
import {
  nodesAtom,
  edgesAtom,
  currentWorkflowIdAtom,
  currentWorkflowNameAtom,
  hasUnsavedChangesAtom,
} from "@/components/workflow-builder/lib/workflow-store";
import { api } from "@/components/workflow-builder/lib/api-client";

function ActionBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionId = searchParams.get("action");

  const setNodes = useSetAtom(nodesAtom);
  const setEdges = useSetAtom(edgesAtom);
  const setCurrentWorkflowId = useSetAtom(currentWorkflowIdAtom);
  const setCurrentWorkflowName = useSetAtom(currentWorkflowNameAtom);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useAtom(hasUnsavedChangesAtom);
  const nodes = useAtomValue(nodesAtom);
  const edges = useAtomValue(edgesAtom);
  const actionName = useAtomValue(currentWorkflowNameAtom);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);

  // Warn on browser tab close / refresh when there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const guardedNavigate = useCallback(
    (navigate: () => void) => {
      if (hasUnsavedChanges) {
        pendingNavRef.current = navigate;
        setShowLeaveDialog(true);
      } else {
        navigate();
      }
    },
    [hasUnsavedChanges]
  );

  // Load action data
  useEffect(() => {
    if (!actionId) {
      setLoading(false);
      return;
    }

    const loadAction = async () => {
      try {
        const workflow = await api.workflow.getById(actionId);
        setCurrentWorkflowId(actionId);
        setCurrentWorkflowName(workflow.name || "Untitled Action");
        if (workflow.nodes?.length) {
          setNodes(workflow.nodes);
        } else {
          // Auto-create an initial trigger node for empty workflows
          setNodes([
            {
              id: nanoid(),
              type: "trigger",
              position: { x: 0, y: 0 },
              data: {
                label: "",
                description: "Trigger",
                type: "trigger",
                config: {},
                status: "idle",
              },
            },
          ]);
        }
        if (workflow.edges?.length) {
          setEdges(workflow.edges);
        }
      } catch (err) {
        console.error("Failed to load action:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAction();
  }, [actionId, setNodes, setEdges, setCurrentWorkflowId, setCurrentWorkflowName]);

  // Save
  const handleSave = useCallback(async () => {
    if (!actionId) return;
    setSaving(true);
    try {
      await api.workflow.update(actionId, { nodes, edges });
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  }, [actionId, nodes, edges, setHasUnsavedChanges]);

  // Save & Exit
  const handleSaveAndExit = useCallback(async () => {
    await handleSave();
    router.back();
  }, [handleSave, router]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!actionId) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">No action specified.</p>
      </div>
    );
  }

  // Dynamically import the WorkflowCanvas to avoid SSR issues
  const WorkflowCanvasLazy = require("@/components/workflow-builder/workflow/workflow-canvas").WorkflowCanvas;

  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden" data-layout="fixed">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-background flex-none">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => guardedNavigate(() => router.back())}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>
          <div className="h-5 w-px bg-border" />
          <div>
            <h3 className="text-sm font-medium">{actionName || "Untitled Action"}</h3>
            <p className="text-xs text-muted-foreground">
              Workflow Builder
              {hasUnsavedChanges && (
                <span className="ml-1.5 text-amber-500">(unsaved changes)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Save className="size-4 mr-1.5" />
            )}
            Save
          </Button>
          <Button size="sm" onClick={handleSaveAndExit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
            Save &amp; Exit
          </Button>
        </div>
      </div>

      {/* Canvas + Right Panel */}
      <div className="flex flex-1 min-h-0 relative">
        <WorkflowCanvasLazy />
        <NodeConfigPanel />
      </div>

      {/* Overlay renderer */}
      <OverlayContainer />

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you leave this page.
              Are you sure you want to leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { pendingNavRef.current = null; }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const nav = pendingNavRef.current;
                pendingNavRef.current = null;
                setHasUnsavedChanges(false);
                nav?.();
              }}
            >
              Leave without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ActionBuilderPage() {
  return (
    <JotaiProvider>
      <ReactFlowProvider>
        <OverlayProvider>
          <ActionBuilderInner />
        </OverlayProvider>
      </ReactFlowProvider>
    </JotaiProvider>
  );
}
