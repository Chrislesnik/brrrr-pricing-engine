"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, FileText, Check } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog";
import { Input } from "@repo/ui/shadcn/input";
import { cn } from "@repo/lib/cn";

interface DocumentTemplate {
  id: string;
  name: string;
  updated_at: string;
}

interface Props {
  existingTemplateIds: string[];
  onAdded: () => void;
}

export function AddTermSheetDialog({ existingTemplateIds, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/document-templates");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setTemplates(data.templates ?? []);
          }
        }
      } catch {
        if (!cancelled) setTemplates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTemplates();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setError(null);
      setSearch("");
    }
  }, [open]);

  const existingSet = useMemo(() => new Set(existingTemplateIds), [existingTemplateIds]);

  const availableTemplates = useMemo(() => {
    return templates.filter((t) => !existingSet.has(t.id));
  }, [templates, existingSet]);

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return availableTemplates;
    const q = search.toLowerCase();
    return availableTemplates.filter((t) => t.name.toLowerCase().includes(q));
  }, [availableTemplates, search]);

  const handleSubmit = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/pe-term-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_template_id: selectedId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to add term sheet");
      }
      setOpen(false);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="whitespace-nowrap">
        Add Term Sheet
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add Term Sheet</DialogTitle>
            <DialogDescription>
              Select a document template to use as a term sheet.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-shrink-0 px-1">
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="size-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {availableTemplates.length === 0
                    ? "All templates are already linked, or no templates exist."
                    : "No templates match your search."}
                </p>
              </div>
            ) : (
              <div className="grid gap-2 py-2">
                {filteredTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedId(tmpl.id === selectedId ? null : tmpl.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50",
                      tmpl.id === selectedId
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border"
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <FileText className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tmpl.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {new Date(tmpl.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    {tmpl.id === selectedId && (
                      <Check className="size-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center px-1">{error}</p>
          )}

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedId || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Term Sheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
