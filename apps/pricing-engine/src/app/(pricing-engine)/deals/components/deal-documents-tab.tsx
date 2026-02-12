"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/shadcn/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@repo/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu";
import {
  Upload,
  FileText,
  MoreHorizontal,
  Loader2,
  X,
  Plus,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldOff,
  File,
} from "lucide-react";
import { Label } from "@repo/ui/shadcn/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useDocumentLogicEngine } from "@/hooks/use-document-logic-engine";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DocumentCategory {
  id: number;
  code: string;
  name: string;
  description: string | null;
  storage_folder: string;
  icon: string | null;
  default_display_order: number | null;
  is_active: boolean;
  is_internal_only: boolean;
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

interface DealDocument {
  id: number;
  deal_id: string;
  document_type_id: number;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  storage_path: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
  created_at: string;
}

interface DealDocumentOverride {
  id: number;
  deal_id: string;
  document_type_id: number;
  is_visible_override: boolean | null;
  is_required_override: boolean | null;
}

interface DealDocumentsTabProps {
  dealId: string;
  dealInputs: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function DealDocumentsTab({ dealId, dealInputs }: DealDocumentsTabProps) {
  /* ----- State ----- */
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [dealDocuments, setDealDocuments] = useState<DealDocument[]>([]);
  const [overrides, setOverrides] = useState<DealDocumentOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequiredOnly, setShowRequiredOnly] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  /* ----- Document logic engine ----- */
  const { hiddenDocTypes, requiredDocTypes, loading: logicLoading } =
    useDocumentLogicEngine(dealInputs);

  /* ----- Fetch all data in parallel ----- */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, typesRes, docsRes, overridesRes] = await Promise.all([
        fetch("/api/document-categories"),
        fetch("/api/document-types"),
        fetch(`/api/deals/${dealId}/deal-documents`),
        fetch(`/api/deals/${dealId}/deal-document-overrides`),
      ]);

      const catsJson = await catsRes.json().catch(() => []);
      const typesJson = await typesRes.json().catch(() => []);
      const docsJson = await docsRes.json().catch(() => ({ documents: [] }));
      const overridesJson = await overridesRes
        .json()
        .catch(() => ({ overrides: [] }));

      setCategories(Array.isArray(catsJson) ? catsJson : []);
      setDocumentTypes(Array.isArray(typesJson) ? typesJson : []);
      setDealDocuments(
        Array.isArray(docsJson.documents) ? docsJson.documents : []
      );
      setOverrides(
        Array.isArray(overridesJson.overrides) ? overridesJson.overrides : []
      );
    } catch (error) {
      console.error("Error fetching document data:", error);
      toast({
        title: "Error",
        description: "Failed to load document data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ----- Override helpers ----- */
  const overrideMap = useMemo(() => {
    const map = new Map<number, DealDocumentOverride>();
    for (const o of overrides) {
      map.set(o.document_type_id, o);
    }
    return map;
  }, [overrides]);

  /** Compute effective visibility for a document type */
  const isDocTypeVisible = useCallback(
    (docTypeId: number): boolean => {
      const override = overrideMap.get(docTypeId);
      if (override?.is_visible_override !== null && override?.is_visible_override !== undefined) {
        return override.is_visible_override;
      }
      // Logic engine: default visible unless hidden
      return !hiddenDocTypes.has(docTypeId);
    },
    [overrideMap, hiddenDocTypes]
  );

  /** Compute effective required for a document type */
  const isDocTypeRequired = useCallback(
    (docTypeId: number): boolean => {
      const override = overrideMap.get(docTypeId);
      if (override?.is_required_override !== null && override?.is_required_override !== undefined) {
        return override.is_required_override;
      }
      return requiredDocTypes.has(docTypeId);
    },
    [overrideMap, requiredDocTypes]
  );

  /** Has an override been set for visibility? */
  const hasVisibilityOverride = useCallback(
    (docTypeId: number): boolean => {
      const override = overrideMap.get(docTypeId);
      return override?.is_visible_override !== null && override?.is_visible_override !== undefined;
    },
    [overrideMap]
  );

  /** Has an override been set for required? */
  const hasRequiredOverride = useCallback(
    (docTypeId: number): boolean => {
      const override = overrideMap.get(docTypeId);
      return override?.is_required_override !== null && override?.is_required_override !== undefined;
    },
    [overrideMap]
  );

  /* ----- Documents by type ----- */
  const docsByType = useMemo(() => {
    const map = new Map<number, DealDocument[]>();
    for (const doc of dealDocuments) {
      const list = map.get(doc.document_type_id) ?? [];
      list.push(doc);
      map.set(doc.document_type_id, list);
    }
    return map;
  }, [dealDocuments]);

  /* ----- Group types by category ----- */
  const categoriesWithTypes = useMemo(() => {
    return categories
      .sort((a, b) => (a.default_display_order ?? 0) - (b.default_display_order ?? 0))
      .map((cat) => ({
        category: cat,
        types: documentTypes
          .filter((dt) => dt.document_category_id === cat.id)
          .sort((a, b) => a.display_order - b.display_order),
      }));
  }, [categories, documentTypes]);

  /* ----- File upload handler (no-op storage, captures metadata) ----- */
  const handleFileSelect = useCallback(
    async (docTypeId: number, file: File) => {
      try {
        const res = await fetch(`/api/deals/${dealId}/deal-documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_type_id: docTypeId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type || null,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save document");
        }

        const data = await res.json();
        setDealDocuments((prev) => [...prev, data.document]);

        toast({
          title: "File captured",
          description: `"${file.name}" has been added. Storage upload will be connected later.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save document metadata",
          variant: "destructive",
        });
      }
    },
    [dealId]
  );

  /* ----- Delete document handler ----- */
  const handleDeleteDocument = useCallback(
    async (docId: number) => {
      try {
        const res = await fetch(`/api/deals/${dealId}/deal-documents`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: docId }),
        });

        if (!res.ok) {
          throw new Error("Failed to delete document");
        }

        setDealDocuments((prev) => prev.filter((d) => d.id !== docId));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove document",
          variant: "destructive",
        });
      }
    },
    [dealId]
  );

  /* ----- Override handler ----- */
  const handleSetOverride = useCallback(
    async (
      docTypeId: number,
      overrideData: {
        is_visible_override?: boolean | null;
        is_required_override?: boolean | null;
      }
    ) => {
      try {
        const res = await fetch(
          `/api/deals/${dealId}/deal-document-overrides`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              document_type_id: docTypeId,
              ...overrideData,
            }),
          }
        );

        if (!res.ok) {
          throw new Error("Failed to update override");
        }

        const data = await res.json();
        setOverrides((prev) => {
          const existing = prev.findIndex(
            (o) => o.document_type_id === docTypeId
          );
          if (existing >= 0) {
            const next = [...prev];
            next[existing] = data.override;
            return next;
          }
          return [...prev, data.override];
        });

        toast({
          title: "Override updated",
          description: "Document requirement has been updated for this deal.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update override",
          variant: "destructive",
        });
      }
    },
    [dealId]
  );

  /* ----- Auto-open/close categories based on visible doc type count ----- */
  useEffect(() => {
    const withDocs = categoriesWithTypes
      .filter(({ types }) => {
        const visibleCount = types.filter((dt) => {
          if (!isDocTypeVisible(dt.id)) return false;
          if (showRequiredOnly && !isDocTypeRequired(dt.id)) return false;
          return true;
        }).length;
        return visibleCount > 0;
      })
      .map(({ category }) => String(category.id));
    setOpenCategories(withDocs);
  }, [categoriesWithTypes, showRequiredOnly, isDocTypeVisible, isDocTypeRequired]);

  /* ----- Loading ----- */
  if (loading || logicLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading documents...
        </span>
      </div>
    );
  }

  /* ----- Render ----- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Documents</h2>
          <p className="text-sm text-muted-foreground">
            Required and optional documents for this deal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="required-filter"
            checked={showRequiredOnly}
            onCheckedChange={setShowRequiredOnly}
          />
          <Label
            htmlFor="required-filter"
            className="text-sm font-medium cursor-pointer select-none"
          >
            Required only
          </Label>
        </div>
      </div>

      {/* Categories */}
      {categoriesWithTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No document categories configured yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set up document categories and types in your organization settings.
          </p>
        </div>
      ) : (
        <Accordion
          type="multiple"
          value={openCategories}
          onValueChange={setOpenCategories}
          className="space-y-3"
        >
          {categoriesWithTypes.map(({ category, types }) => {
            const visibleTypes = types.filter((dt) => {
              if (!isDocTypeVisible(dt.id)) return false;
              if (showRequiredOnly && !isDocTypeRequired(dt.id)) return false;
              return true;
            });

            return (
              <AccordionItem
                key={category.id}
                value={String(category.id)}
                className="rounded-lg border bg-muted/30 shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span>{category.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {visibleTypes.length} document type
                      {visibleTypes.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0">
                  {visibleTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No documents required in this category
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {visibleTypes.map((docType) => (
                        <DocumentTypeRow
                          key={docType.id}
                          docType={docType}
                          isRequired={isDocTypeRequired(docType.id)}
                          hasVisibilityOverride={hasVisibilityOverride(docType.id)}
                          hasRequiredOverride={hasRequiredOverride(docType.id)}
                          files={docsByType.get(docType.id) ?? []}
                          onFileSelect={handleFileSelect}
                          onDeleteDocument={handleDeleteDocument}
                          onSetOverride={handleSetOverride}
                        />
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DocumentTypeRow                                                            */
/* -------------------------------------------------------------------------- */

interface DocumentTypeRowProps {
  docType: DocumentType;
  isRequired: boolean;
  hasVisibilityOverride: boolean;
  hasRequiredOverride: boolean;
  files: DealDocument[];
  onFileSelect: (docTypeId: number, file: File) => void;
  onDeleteDocument: (docId: number) => void;
  onSetOverride: (
    docTypeId: number,
    data: {
      is_visible_override?: boolean | null;
      is_required_override?: boolean | null;
    }
  ) => void;
}

function DocumentTypeRow({
  docType,
  isRequired,
  hasVisibilityOverride,
  hasRequiredOverride,
  files,
  onFileSelect,
  onDeleteDocument,
  onSetOverride,
}: DocumentTypeRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(docType.id, file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex rounded-lg border bg-background shadow-sm overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.tif,.tiff"
      />

      {/* Left: Upload zone (~22%) */}
      <div
        className="w-[22%] min-w-[140px] flex-shrink-0 border-r border-dashed bg-muted/20 flex flex-col items-center justify-center gap-2 p-4 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">
          Upload
        </span>
        {files.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            + Add another
          </span>
        )}
      </div>

      {/* Right: Document info (~78%) */}
      <div className="flex-1 p-4 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-medium text-sm truncate">
              {docType.document_name}
            </span>
            {isRequired && (
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0 h-5 shrink-0"
              >
                Required
              </Badge>
            )}
            {(hasVisibilityOverride || hasRequiredOverride) && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 shrink-0"
              >
                Overridden
              </Badge>
            )}
          </div>

          {/* Three-dot override menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover/row:opacity-100 hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Required overrides */}
              {isRequired ? (
                <DropdownMenuItem
                  onClick={() =>
                    onSetOverride(docType.id, { is_required_override: false })
                  }
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Mark as Not Required
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() =>
                    onSetOverride(docType.id, { is_required_override: true })
                  }
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Mark as Required
                </DropdownMenuItem>
              )}

              {/* Visibility overrides */}
              <DropdownMenuItem
                onClick={() =>
                  onSetOverride(docType.id, { is_visible_override: false })
                }
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Hide from this deal
              </DropdownMenuItem>

              {/* Reset overrides */}
              {(hasVisibilityOverride || hasRequiredOverride) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      onSetOverride(docType.id, {
                        is_visible_override: null,
                        is_required_override: null,
                      })
                    }
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reset to default
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {docType.document_description && (
          <p className="text-xs text-muted-foreground mt-1">
            {docType.document_description}
          </p>
        )}

        {/* File list */}
        {files.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            {files.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 group/file"
              >
                <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs truncate flex-1 font-medium">
                  {doc.file_name}
                </span>
                {doc.file_size && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatFileSize(doc.file_size)}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 shrink-0 opacity-0 group-hover/file:opacity-100 transition-opacity"
                  onClick={() => onDeleteDocument(doc.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-2">
            No files uploaded
          </p>
        )}
      </div>
    </div>
  );
}
