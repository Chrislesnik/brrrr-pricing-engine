"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  GripVertical,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Loader2,
  Workflow,
  X,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Badge } from "@repo/ui/shadcn/badge";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanItem,
  KanbanOverlay,
} from "@/components/ui/kanban";
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
import { DocumentLogicBuilderSheet } from "./document-logic-builder-sheet";
import { DocumentAIPromptsSheet } from "./document-ai-prompts-sheet";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DocumentCategory {
  id: number;
  name: string;
  default_display_order: number;
  created_at: string;
}

interface DocumentType {
  id: number;
  document_category_id: number;
  document_name: string;
  document_description: string | null;
  display_order: number;
  created_at: string;
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function DocumentsSettings() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  // Add document state (per category)
  const [addingDocForCategory, setAddingDocForCategory] = useState<number | null>(null);
  const [newDocName, setNewDocName] = useState("");
  const [newDocDescription, setNewDocDescription] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);

  // Edit category state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Edit document state
  const [editingDocId, setEditingDocId] = useState<number | null>(null);

  // Logic Builder sheet state
  const [logicBuilderOpen, setLogicBuilderOpen] = useState(false);
  const [logicBuilderDocTypeId, setLogicBuilderDocTypeId] = useState<number | null>(null);

  // AI Prompts sheet state
  const [aiPromptsOpen, setAiPromptsOpen] = useState(false);
  const [aiPromptsDocTypeId, setAiPromptsDocTypeId] = useState<number | null>(null);
  const [aiPromptsDocTypeName, setAiPromptsDocTypeName] = useState("");

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "category" | "document";
    id: number;
    name: string;
  }>({ open: false, type: "document", id: 0, name: "" });

  /* ---- Fetch data ---- */

  const fetchData = useCallback(async () => {
    try {
      const [catsRes, docsRes] = await Promise.all([
        fetch("/api/document-categories"),
        fetch("/api/document-types"),
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (docsRes.ok) setDocumentTypes(await docsRes.json());
    } catch (err) {
      console.error("Failed to fetch documents data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkAccessAndFetch() {
      // Check permissions via Supabase (admin/owner in internal org)
      try {
        const accessResponse = await fetch("/api/org/settings-access");
        if (accessResponse.ok) {
          const accessData = await accessResponse.json();
          setCanAccess(accessData.canAccess);

          if (!accessData.canAccess) {
            setLoading(false);
            return;
          }
        } else {
          setCanAccess(false);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to check access:", error);
        setCanAccess(false);
        setLoading(false);
        return;
      }

      await fetchData();
    }

    checkAccessAndFetch();
  }, [fetchData]);

  /* ---- Build Kanban columns (Record<string, DocumentType[]>) ---- */

  const kanbanColumns = buildKanbanColumns(categories, documentTypes);
  const categoryMap = new Map(categories.map((c) => [colKey(c.id), c]));

  /* ---- Category actions ---- */

  const handleStartEditCategory = (cat: DocumentCategory) => {
    setEditingCategoryId(cat.id);
    setEditedCategoryName(cat.name);
  };

  const handleSaveCategory = async () => {
    if (!editingCategoryId || !editedCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const res = await fetch("/api/document-categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCategoryId, name: editedCategoryName.trim() }),
      });
      if (res.ok) {
        setEditingCategoryId(null);
        setEditedCategoryName("");
        await fetchData();
      }
    } finally {
      setSavingCategory(false);
    }
  };

  /* ---- Document CRUD ---- */

  const handleAddDocument = async (categoryId: number) => {
    if (!newDocName.trim()) return;
    setSavingDoc(true);
    try {
      const res = await fetch("/api/document-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_category_id: categoryId,
          document_name: newDocName.trim(),
          document_description: newDocDescription.trim() || null,
        }),
      });
      if (res.ok) {
        resetDocForm();
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to add document:", err.error);
      }
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      await fetch("/api/document-types", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const confirmDelete = async () => {
    if (deleteDialog.type === "document") {
      await handleDeleteDocument(deleteDialog.id);
    }
    setDeleteDialog((prev) => ({ ...prev, open: false }));
  };

  const handleSaveDocEdit = async (doc: DocumentType) => {
    if (!newDocName.trim()) return;
    setSavingDoc(true);
    try {
      const res = await fetch("/api/document-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doc.id,
          document_name: newDocName.trim(),
          document_description: newDocDescription.trim() || null,
        }),
      });
      if (res.ok) {
        resetDocForm();
        setEditingDocId(null);
        await fetchData();
      }
    } finally {
      setSavingDoc(false);
    }
  };

  const resetDocForm = () => {
    setAddingDocForCategory(null);
    setEditingDocId(null);
    setNewDocName("");
    setNewDocDescription("");
  };

  /* ---- Drag and drop handlers ---- */

  const handleKanbanChange = (newColumns: Record<string, DocumentType[]>) => {
    const newColumnKeys = Object.keys(newColumns);
    const oldColumnKeys = categories.map((c) => colKey(c.id));

    // Check if column order changed (category drag)
    const columnOrderChanged =
      newColumnKeys.length === oldColumnKeys.length &&
      newColumnKeys.some((key, i) => key !== oldColumnKeys[i]);

    if (columnOrderChanged) {
      const catById = new Map(categories.map((c) => [colKey(c.id), c]));
      const reorderedCategories = newColumnKeys
        .map((key) => catById.get(key)!)
        .filter(Boolean);
      setCategories(reorderedCategories);

      // Persist category order
      const catReorder = reorderedCategories.map((c, i) => ({
        id: c.id,
        default_display_order: i,
      }));
      fetch("/api/document-categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: catReorder }),
      }).catch(console.error);
    }

    // Always sync document types for the new column layout
    const reorderPayload: { id: number; document_category_id: number; display_order: number }[] = [];
    const newDocs: DocumentType[] = [];

    for (const [key, items] of Object.entries(newColumns)) {
      const categoryId = colId(key);
      items.forEach((item, index) => {
        reorderPayload.push({
          id: item.id,
          document_category_id: categoryId,
          display_order: index,
        });
        newDocs.push({
          ...item,
          document_category_id: categoryId,
          display_order: index,
        });
      });
    }
    setDocumentTypes(newDocs);

    // Only persist document reorder if there are docs and it's not purely a column move
    if (reorderPayload.length > 0 && !columnOrderChanged) {
      fetch("/api/document-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: reorderPayload }),
      }).catch(console.error);
    }
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          You don&apos;t have permission to manage documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define the document types that appear on deal pages. Organize them into categories and drag to reorder.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Coming soon"
        >
          <Plus className="size-4 mr-1.5" />
          Add Category
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLogicBuilderDocTypeId(null);
            setLogicBuilderOpen(true);
          }}
        >
          <Workflow className="size-4 mr-1.5" />
          Logic Builder
        </Button>
      </div>

      {/* Kanban Board */}
      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">No document categories yet.</p>
        </div>
      ) : (
        <Kanban<DocumentType>
          value={kanbanColumns}
          onValueChange={handleKanbanChange}
          getItemValue={(item) => String(item.id)}
        >
          <KanbanBoard>
            {categories.map((cat) => {
              const ck = colKey(cat.id);
              const colDocs = kanbanColumns[ck] ?? [];

              return (
                <KanbanColumn key={ck} value={ck}>
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <KanbanColumnHandle>
                        <GripVertical className="size-4 text-muted-foreground" />
                      </KanbanColumnHandle>
                      {editingCategoryId === cat.id ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={editedCategoryName}
                            onChange={(e) => setEditedCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveCategory();
                              if (e.key === "Escape") {
                                setEditingCategoryId(null);
                                setEditedCategoryName("");
                              }
                            }}
                            className="h-7 text-sm w-40"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-6 p-0 text-green-600 hover:text-green-700"
                            onClick={handleSaveCategory}
                            disabled={savingCategory || !editedCategoryName.trim()}
                          >
                            {savingCategory ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Check className="size-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-6 p-0"
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditedCategoryName("");
                            }}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-semibold text-sm uppercase tracking-wide">
                            {cat.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="pointer-events-none rounded-sm text-xs"
                          >
                            {colDocs.length}
                          </Badge>
                        </>
                      )}
                    </div>
                    {editingCategoryId !== cat.id && (
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleStartEditCategory(cat)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Document items */}
                  <div className="flex flex-col gap-1.5">
                    {colDocs.map((doc) =>
                      editingDocId === doc.id ? (
                        <div key={doc.id} className="space-y-3 rounded-md border bg-card p-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Label *</Label>
                            <Input
                              placeholder="e.g. W-2 Form"
                              value={newDocName}
                              onChange={(e) => setNewDocName(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Description</Label>
                            <Input
                              placeholder="Optional description..."
                              value={newDocDescription}
                              onChange={(e) => setNewDocDescription(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleSaveDocEdit(doc)}
                              disabled={savingDoc || !newDocName.trim()}
                            >
                              {savingDoc ? (
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
                              onClick={resetDocForm}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <KanbanItem
                          key={doc.id}
                          value={String(doc.id)}
                          asHandle
                          asChild
                        >
                          <div className="group flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-xs transition-shadow">
                            <GripVertical className="size-3.5 text-muted-foreground shrink-0" />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-medium truncate">
                                {doc.document_name}
                              </span>
                              {doc.document_description && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {doc.document_description}
                                </span>
                              )}
                            </div>
                            <div className="ml-auto flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAiPromptsDocTypeId(doc.id);
                                  setAiPromptsDocTypeName(doc.document_name);
                                  setAiPromptsOpen(true);
                                }}
                              >
                                <Sparkles className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLogicBuilderDocTypeId(doc.id);
                                  setLogicBuilderOpen(true);
                                }}
                              >
                                <Workflow className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resetDocForm();
                                  setEditingDocId(doc.id);
                                  setNewDocName(doc.document_name);
                                  setNewDocDescription(doc.document_description ?? "");
                                }}
                              >
                                <Pencil className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteDialog({
                                    open: true,
                                    type: "document",
                                    id: doc.id,
                                    name: doc.document_name,
                                  });
                                }}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          </div>
                        </KanbanItem>
                      ),
                    )}
                  </div>

                  {/* Add Document Form */}
                  {addingDocForCategory === cat.id ? (
                    <div className="mt-3 space-y-3 rounded-md border bg-card p-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Label *</Label>
                        <Input
                          placeholder="e.g. W-2 Form"
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Description</Label>
                        <Input
                          placeholder="Optional description..."
                          value={newDocDescription}
                          onChange={(e) => setNewDocDescription(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleAddDocument(cat.id)}
                          disabled={savingDoc || !newDocName.trim()}
                        >
                          {savingDoc ? (
                            <Loader2 className="size-3 animate-spin mr-1" />
                          ) : (
                            <Plus className="size-3 mr-1" />
                          )}
                          Save Document
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={resetDocForm}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full justify-start text-xs text-muted-foreground h-7"
                      onClick={() => {
                        resetDocForm();
                        setAddingDocForCategory(cat.id);
                      }}
                    >
                      <Plus className="size-3 mr-1" />
                      Add Document
                    </Button>
                  )}
                </KanbanColumn>
              );
            })}
          </KanbanBoard>
          <KanbanOverlay>
            <div className="size-full rounded-md bg-primary/10" />
          </KanbanOverlay>
        </Kanban>
      )}

      {/* Logic Builder Sheet */}
      <DocumentLogicBuilderSheet
        open={logicBuilderOpen}
        onOpenChange={setLogicBuilderOpen}
        filterDocumentTypeId={logicBuilderDocTypeId}
      />

      {/* AI Prompts Sheet */}
      <DocumentAIPromptsSheet
        open={aiPromptsOpen}
        onOpenChange={setAiPromptsOpen}
        documentTypeId={aiPromptsDocTypeId}
        documentTypeName={aiPromptsDocTypeName}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deleteDialog.name}&rdquo;
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Prefix numeric IDs so Object.keys() preserves insertion order */
const COL_PREFIX = "col-";
function colKey(id: number): string {
  return `${COL_PREFIX}${id}`;
}
function colId(key: string): number {
  return Number(key.slice(COL_PREFIX.length));
}

function buildKanbanColumns(
  categories: DocumentCategory[],
  documentTypes: DocumentType[],
): Record<string, DocumentType[]> {
  const columns: Record<string, DocumentType[]> = {};
  for (const cat of categories) {
    columns[colKey(cat.id)] = [];
  }
  for (const doc of documentTypes) {
    const key = colKey(doc.document_category_id);
    if (columns[key]) {
      columns[key].push(doc);
    }
  }
  // Sort documents within each column by display_order
  for (const key of Object.keys(columns)) {
    columns[key].sort((a, b) => a.display_order - b.display_order);
  }
  return columns;
}
