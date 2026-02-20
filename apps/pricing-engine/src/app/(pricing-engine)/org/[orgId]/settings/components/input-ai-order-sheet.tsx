"use client";

import { useEffect, useState, useCallback } from "react";
import { GripVertical, Loader2, Sparkles } from "lucide-react";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanItem,
  KanbanOverlay,
} from "@/components/ui/kanban";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AIInputOrderItem {
  ai_input_id: number;
  document_type_id: number;
  document_type_name: string;
  display_order: number;
  ai_prompt: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function InputAIOrderSheet({
  open,
  onOpenChange,
  inputId,
  inputLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputId: string | null;
  inputLabel: string;
}) {
  const [items, setItems] = useState<AIInputOrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---- Fetch data ---- */

  const fetchOrder = useCallback(async () => {
    if (!inputId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/document-type-ai-input-order?input_id=${encodeURIComponent(inputId)}`
      );
      if (res.ok) {
        const data: AIInputOrderItem[] = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch AI input order:", err);
    } finally {
      setLoading(false);
    }
  }, [inputId]);

  useEffect(() => {
    if (open && inputId) {
      fetchOrder();
    }
    if (!open) {
      setItems([]);
    }
  }, [open, inputId, fetchOrder]);

  /* ---- Kanban change handler ---- */

  const handleKanbanChange = useCallback(
    (newColumns: Record<string, AIInputOrderItem[]>) => {
      const reordered = (newColumns["items"] ?? []).map((item, idx) => ({
        ...item,
        display_order: idx + 1,
      }));
      setItems(reordered);

      // Persist to API
      const reorderPayload = reordered.map((item) => ({
        document_type_ai_input_id: item.ai_input_id,
        display_order: item.display_order,
      }));

      fetch("/api/document-type-ai-input-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: reorderPayload }),
      }).catch((err) => console.error("Failed to persist order:", err));
    },
    []
  );

  /* ---- Build single-column kanban data ---- */

  const kanbanColumns: Record<string, AIInputOrderItem[]> = {
    items: items,
  };

  const isDraggable = items.length > 1;

  /* ---- Render ---- */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            AI Extraction Order
          </SheetTitle>
          <SheetDescription>
            {inputLabel
              ? `Drag to reorder the document types that extract "${inputLabel}" via AI. Documents higher in the list take priority.`
              : "Drag to reorder the document types for AI extraction priority."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading...
              </span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-lg border border-dashed">
              <Sparkles className="size-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No document types linked to this input.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add AI extraction prompts to document types first via the
                Documents settings.
              </p>
            </div>
          ) : (
            <Kanban<AIInputOrderItem>
              value={kanbanColumns}
              onValueChange={handleKanbanChange}
              getItemValue={(item) => item.ai_input_id}
            >
              <KanbanBoard className="gap-0">
                <KanbanColumn value="items" className="border-0 bg-transparent p-0">
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
                      <KanbanItem
                        key={item.ai_input_id}
                        value={item.ai_input_id}
                        asHandle={isDraggable}
                        asChild
                      >
                        <div className="flex items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-xs transition-shadow">
                          {isDraggable && (
                            <GripVertical className="size-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium truncate">
                              {item.document_type_name}
                            </span>
                            {item.ai_prompt && (
                              <span className="text-xs text-muted-foreground truncate mt-0.5">
                                {item.ai_prompt}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                            #{item.display_order}
                          </span>
                        </div>
                      </KanbanItem>
                    ))}
                  </div>
                </KanbanColumn>
              </KanbanBoard>
              <KanbanOverlay>
                <div className="size-full rounded-md bg-primary/10" />
              </KanbanOverlay>
            </Kanban>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
