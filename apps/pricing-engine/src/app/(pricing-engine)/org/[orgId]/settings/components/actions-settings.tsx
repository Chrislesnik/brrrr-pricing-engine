"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Workflow,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Action {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ActionsSettings() {
  const router = useRouter();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  // New action dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    uuid: string;
    name: string;
  }>({ open: false, uuid: "", name: "" });

  /* ---- Fetch ---- */

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch("/api/actions");
      if (res.ok) {
        const data = await res.json();
        setActions(data.actions ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch actions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  /* ---- Create ---- */

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreateOpen(false);
        setNewName("");
        setNewDescription("");
        // Navigate to the builder
        router.push(
          `/platform-settings/actions/builder?action=${data.action.uuid}`
        );
      }
    } catch (err) {
      console.error("Failed to create action:", err);
    } finally {
      setCreating(false);
    }
  };

  /* ---- Delete ---- */

  const handleDelete = async () => {
    if (!deleteDialog.uuid) return;
    try {
      await fetch(`/api/actions/${deleteDialog.uuid}`, { method: "DELETE" });
      setDeleteDialog({ open: false, uuid: "", name: "" });
      await fetchActions();
    } catch (err) {
      console.error("Failed to delete action:", err);
    }
  };

  /* ---- Navigate to builder ---- */

  const openBuilder = (uuid: string) => {
    router.push(`/platform-settings/actions/builder?action=${uuid}`);
  };

  /* ---- Helpers ---- */

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Create workflow automations that can be attached to tasks.
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-1.5" />
          New Action
        </Button>
      </div>

      {/* Actions list */}
      {actions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <Workflow className="size-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No actions yet</p>
          <p className="text-xs mt-1">
            Create your first workflow action to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {actions.map((action) => (
            <div
              key={action.uuid}
              className="flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors group"
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-primary/10 text-primary shrink-0">
                <Workflow className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => openBuilder(action.uuid)}
                  className="text-sm font-medium hover:underline text-left truncate block"
                >
                  {action.name}
                </button>
                {action.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                {formatDate(action.created_at)}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                  onClick={() => openBuilder(action.uuid)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                  onClick={() =>
                    setDeleteDialog({
                      open: true,
                      uuid: action.uuid,
                      name: action.name,
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Action Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Action</DialogTitle>
            <DialogDescription>
              Create a new workflow action. You&apos;ll be taken to the visual
              builder to design the flow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Send Welcome Email"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) handleCreate();
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional description..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
            >
              {creating && (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              )}
              Create &amp; Open Builder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deleteDialog.name}&rdquo;
              </span>
              ? This will permanently remove the workflow. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
