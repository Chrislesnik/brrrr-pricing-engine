"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, Upload } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";
import { SignalColorPicker } from "@/components/signal-color-picker";
import { cn } from "@repo/lib/cn";

interface DocumentStatus {
  id: number;
  code: string;
  label: string;
  color: string | null;
  is_default: boolean;
  display_order: number;
  is_active: boolean;
  is_terminal: boolean;
  created_at: string;
}

type DraftStatus = Omit<DocumentStatus, "id" | "code" | "created_at" | "is_active" | "is_terminal"> & {
  _tempId?: string;
  id?: number;
};

export function DocumentStatusesSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [statuses, setStatuses] = useState<DocumentStatus[]>([]);
  const [drafts, setDrafts] = useState<DraftStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/document-statuses");
      if (res.ok) {
        const data: DocumentStatus[] = await res.json();
        setStatuses(data);
        setDrafts(
          data.map((s) => ({
            id: s.id,
            label: s.label,
            color: s.color,
            is_default: s.is_default,
            display_order: s.display_order,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to fetch document statuses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchStatuses();
  }, [open, fetchStatuses]);

  const handleAddStatus = () => {
    const maxOrder = drafts.reduce((max, d) => Math.max(max, d.display_order), 0);
    setDrafts((prev) => [
      ...prev,
      {
        _tempId: `new-${Date.now()}`,
        label: "",
        color: "#64748b",
        is_default: false,
        display_order: maxOrder + 10,
      },
    ]);
  };

  const updateDraft = (index: number, patch: Partial<DraftStatus>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const handleSetDefault = (index: number) => {
    setDrafts((prev) =>
      prev.map((d, i) => ({ ...d, is_default: i === index })),
    );
  };

  const handleRemoveDraft = async (index: number) => {
    const draft = drafts[index];

    if (draft.is_default) return;

    if (draft.id) {
      setDeletingId(draft.id);
      try {
        const res = await fetch("/api/document-statuses", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: draft.id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Failed to delete status:", err.error);
          return;
        }
      } catch (err) {
        console.error("Failed to delete status:", err);
        return;
      } finally {
        setDeletingId(null);
      }
    }

    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const draft of drafts) {
        if (!draft.label.trim()) continue;

        if (draft.id) {
          const original = statuses.find((s) => s.id === draft.id);
          const changed =
            original &&
            (original.label !== draft.label.trim() ||
              original.color !== draft.color ||
              original.is_default !== draft.is_default);

          if (changed) {
            await fetch("/api/document-statuses", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: draft.id,
                label: draft.label.trim(),
                color: draft.color,
                is_default: draft.is_default,
              }),
            });
          }
        } else {
          await fetch("/api/document-statuses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: draft.label.trim(),
              color: draft.color,
              is_default: draft.is_default,
              display_order: draft.display_order,
            }),
          });
        }
      }

      await fetchStatuses();
    } catch (err) {
      console.error("Failed to save statuses:", err);
    } finally {
      setSaving(false);
    }
  };

  const draftKey = (d: DraftStatus, i: number) => d.id ? `status-${d.id}` : d._tempId ?? `idx-${i}`;
  const hasEmptyLabels = drafts.some((d) => !d.id && !d.label.trim());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Document Statuses</SheetTitle>
          <SheetDescription>
            Manage the statuses that can be assigned to documents. The default status is auto-assigned on upload.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {drafts.map((draft, index) => (
                <div
                  key={draftKey(draft, index)}
                  className={cn(
                    "rounded-lg border p-4 space-y-3",
                    draft.is_default && "ring-2 ring-primary/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Status Name</Label>
                      <Input
                        placeholder="e.g. Under Review"
                        value={draft.label}
                        onChange={(e) => updateDraft(index, { label: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive shrink-0 mt-5"
                      onClick={() => handleRemoveDraft(index)}
                      disabled={draft.is_default || deletingId === draft.id}
                      title={draft.is_default ? "Cannot delete the default status" : "Delete status"}
                    >
                      {deletingId === draft.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Color</Label>
                    <SignalColorPicker
                      value={draft.color}
                      onChange={(color) => updateDraft(index, { color })}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors",
                        draft.is_default
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                      onClick={() => handleSetDefault(index)}
                    >
                      <Upload className="size-3" />
                      Default on upload
                    </button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleAddStatus}
              >
                <Plus className="size-4 mr-1.5" />
                Add Status
              </Button>
            </>
          )}
        </div>

        <SheetFooter>
          <Button
            onClick={handleSave}
            disabled={saving || hasEmptyLabels}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : null}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
