"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
import { Separator } from "@repo/ui/shadcn/separator";
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
  LayoutList,
  FolderOpen,
  Search,
  GripVertical,
  ListFilter,
  Download,
  CheckCircle,
  Pencil,
  Archive,
} from "lucide-react";
import { Label } from "@repo/ui/shadcn/label";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
  document_type_id: number | null;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  storage_path: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
  created_at: string;
  document_file_id: number | null;
  has_file: boolean;
  storage_bucket: string | null;
  document_file_uuid: string | null;
  document_category_id: number | null;
  document_status_id: number | null;
  uploaded_by_name: string | null;
  uploaded_by_avatar: string | null;
}

interface DealDocumentOverride {
  id: number;
  deal_id: string;
  document_type_id: number;
  is_visible_override: boolean | null;
  is_required_override: boolean | null;
}

interface DocumentStatusItem {
  id: number;
  code: string;
  label: string;
  color: string | null;
  is_default: boolean;
  display_order: number;
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
  const router = useRouter();

  /* ----- State ----- */
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [dealDocuments, setDealDocuments] = useState<DealDocument[]>([]);
  const [overrides, setOverrides] = useState<DealDocumentOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequiredOnly, setShowRequiredOnly] = useState(false);
  const [showNotUploadedOnly, setShowNotUploadedOnly] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"category" | "files">("category");
  const [searchQuery, setSearchQuery] = useState("");
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatusItem[]>([]);
  const [isInternalOrg, setIsInternalOrg] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Set<number>>(new Set());

  /* ----- Document logic engine ----- */
  const { hiddenDocTypes, requiredDocTypes, loading: logicLoading } =
    useDocumentLogicEngine(dealInputs);

  /* ----- Fetch all data in parallel ----- */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, typesRes, docsRes, overridesRes, statusesRes] = await Promise.all([
        fetch("/api/document-categories"),
        fetch("/api/document-types"),
        fetch(`/api/deals/${dealId}/deal-documents`),
        fetch(`/api/deals/${dealId}/deal-document-overrides`),
        fetch("/api/document-statuses"),
      ]);

      const catsJson = await catsRes.json().catch(() => []);
      const typesJson = await typesRes.json().catch(() => []);
      const docsJson = await docsRes.json().catch(() => ({ documents: [], is_internal_org: false }));
      const overridesJson = await overridesRes
        .json()
        .catch(() => ({ overrides: [] }));
      const statusesJson = await statusesRes.json().catch(() => []);

      setCategories(Array.isArray(catsJson) ? catsJson : []);
      setDocumentTypes(Array.isArray(typesJson) ? typesJson : []);
      setDealDocuments(
        Array.isArray(docsJson.documents) ? docsJson.documents : []
      );
      setOverrides(
        Array.isArray(overridesJson.overrides) ? overridesJson.overrides : []
      );
      setDocumentStatuses(Array.isArray(statusesJson) ? statusesJson : []);
      setIsInternalOrg(docsJson.is_internal_org === true);
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

  /* ----- Status helpers ----- */
  const statusMap = useMemo(() => {
    const map = new Map<number, DocumentStatusItem>();
    for (const s of documentStatuses) {
      map.set(s.id, s);
    }
    return map;
  }, [documentStatuses]);

  const handleStatusChange = useCallback(
    async (docId: number, documentFileId: number, newStatusId: number) => {
      // Optimistic update
      setDealDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, document_status_id: newStatusId } : d
        )
      );
      try {
        const res = await fetch(`/api/deals/${dealId}/deal-documents/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_file_id: documentFileId,
            document_status_id: newStatusId,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast({
            title: "Error",
            description: err.error || "Failed to update status",
            variant: "destructive",
          });
          await fetchAll();
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
        await fetchAll();
      }
    },
    [dealId, fetchAll],
  );

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
      if (doc.document_type_id != null) {
        const list = map.get(doc.document_type_id) ?? [];
        list.push(doc);
        map.set(doc.document_type_id, list);
      }
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

  /* ----- Upload progress tracking ----- */
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { fileName: string; docTypeId: number | null }>>(new Map());

  /* ----- File upload handler (uploads to Supabase Storage) ----- */
  const handleFileSelect = useCallback(
    async (docTypeId: number, file: File) => {
      const uploadKey = `${docTypeId}-${file.name}-${Date.now()}`;
      setUploadingFiles((prev) => {
        const next = new Map(prev);
        next.set(uploadKey, { fileName: file.name, docTypeId });
        return next;
      });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentTypeId", String(docTypeId));

        const res = await fetch(`/api/deals/${dealId}/deal-documents`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to upload document");
        }

        const data = await res.json();
        setDealDocuments((prev) => [...prev, data.document]);

        toast({
          title: "File uploaded",
          description: `"${file.name}" has been uploaded successfully.`,
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload document",
          variant: "destructive",
        });
      } finally {
        setUploadingFiles((prev) => {
          const next = new Map(prev);
          next.delete(uploadKey);
          return next;
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

  /* ----- Download document handler ----- */
  const handleDownloadDocument = useCallback(
    async (docId: number, fileName: string) => {
      try {
        const res = await fetch(
          `/api/deals/${dealId}/deal-documents/${docId}/url`
        );
        if (!res.ok) {
          throw new Error("Failed to get download URL");
        }
        const data = await res.json();
        // Open in new tab or trigger download
        const link = document.createElement("a");
        link.href = data.url;
        link.download = data.fileName || fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to download document",
          variant: "destructive",
        });
      }
    },
    [dealId]
  );

  /* ----- Rename document handler ----- */
  const handleRenameDocument = useCallback(
    async (docId: number, newName: string) => {
      try {
        const res = await fetch(`/api/deals/${dealId}/deal-documents`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: docId, file_name: newName }),
        });

        if (!res.ok) {
          throw new Error("Failed to rename document");
        }

        setDealDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, file_name: newName } : d))
        );

        toast({
          title: "Renamed",
          description: "Document name updated.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to rename document",
          variant: "destructive",
        });
      }
    },
    [dealId]
  );

  /* ----- View document handler ----- */
  const handleViewDocument = useCallback(
    (docId: number) => {
      router.push(`/deals/${dealId}/documents/${docId}`);
    },
    [dealId, router]
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
          if (showNotUploadedOnly && (docsByType.get(dt.id)?.length ?? 0) > 0) return false;
          if (statusFilters.size > 0) {
            const files = docsByType.get(dt.id) ?? [];
            if (!files.some((f) => f.document_status_id != null && statusFilters.has(f.document_status_id))) return false;
          }
          return true;
        }).length;
        return visibleCount > 0;
      })
      .map(({ category }) => String(category.id));
    setOpenCategories(withDocs);
  }, [categoriesWithTypes, showRequiredOnly, showNotUploadedOnly, statusFilters, isDocTypeVisible, isDocTypeRequired, docsByType]);

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
        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 rounded-md border bg-background px-8 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed gap-1.5">
                <ListFilter className="h-3.5 w-3.5" />
                Filters
                {(showNotUploadedOnly || showRequiredOnly || statusFilters.size > 0) && (
                  <>
                    <Separator orientation="vertical" className="mx-1 h-4" />
                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                      {(showNotUploadedOnly ? 1 : 0) + (showRequiredOnly ? 1 : 0) + statusFilters.size}
                    </Badge>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <div className="p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Document Filters</p>
                <label className="flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-muted transition-colors cursor-pointer">
                  <Checkbox
                    checked={showNotUploadedOnly}
                    onCheckedChange={(v) => setShowNotUploadedOnly(v === true)}
                  />
                  <span className="text-sm">Not uploaded</span>
                </label>
                <label className="flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-muted transition-colors cursor-pointer">
                  <Checkbox
                    checked={showRequiredOnly}
                    onCheckedChange={(v) => setShowRequiredOnly(v === true)}
                  />
                  <span className="text-sm">Required only</span>
                </label>
              </div>
              <Separator />
              <div className="p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Document Status</p>
                {documentStatuses.map((s) => {
                  const isSelected = statusFilters.has(s.id);
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => {
                          setStatusFilters((prev) => {
                            const next = new Set(prev);
                            if (isSelected) next.delete(s.id);
                            else next.add(s.id);
                            return next;
                          });
                        }}
                      />
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.color ?? "#94a3b8" }}
                      />
                      <span className="text-sm">{s.label}</span>
                    </label>
                  );
                })}
              </div>
              {(showNotUploadedOnly || showRequiredOnly || statusFilters.size > 0) && (
                <>
                  <Separator />
                  <div className="p-1.5">
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-xs text-center hover:bg-muted transition-colors"
                      onClick={() => {
                        setShowNotUploadedOnly(false);
                        setShowRequiredOnly(false);
                        setStatusFilters(new Set());
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                </>
              )}
            </PopoverContent>
          </Popover>

          {/* View mode toggle */}
          <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
            <Button
              variant={viewMode === "category" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 gap-1.5"
              onClick={() => setViewMode("category")}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="text-xs">Categories</span>
            </Button>
            <Button
              variant={viewMode === "files" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 gap-1.5"
              onClick={() => setViewMode("files")}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span className="text-xs">Files</span>
            </Button>
          </div>

        </div>
      </div>

      {/* View content */}
      {viewMode === "files" ? (
        <FileManagerView
          dealId={dealId}
          dealDocuments={dealDocuments}
          setDealDocuments={setDealDocuments}
          documentTypes={documentTypes}
          categories={categories}
          categoriesWithTypes={categoriesWithTypes}
          onDeleteDocument={handleDeleteDocument}
          onDownloadDocument={handleDownloadDocument}
          onRenameDocument={handleRenameDocument}
          onViewDocument={handleViewDocument}
          isDocTypeRequired={isDocTypeRequired}
          statusMap={statusMap}
          allStatuses={documentStatuses}
          isInternalOrg={isInternalOrg}
          onStatusChange={handleStatusChange}
          statusFilters={statusFilters}
        />
      ) : (
        <>
          {/* Categories (existing view) */}
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
                  if (showNotUploadedOnly && (docsByType.get(dt.id)?.length ?? 0) > 0) return false;
                  if (statusFilters.size > 0) {
                    const files = docsByType.get(dt.id) ?? [];
                    const hasMatchingStatus = files.some(
                      (f) => f.document_status_id != null && statusFilters.has(f.document_status_id)
                    );
                    if (!hasMatchingStatus) return false;
                  }
                  if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const nameMatch = dt.document_name.toLowerCase().includes(q);
                    const fileMatch = (docsByType.get(dt.id) ?? []).some(
                      (f) => f.file_name.toLowerCase().includes(q)
                    );
                    if (!nameMatch && !fileMatch) return false;
                  }
                  return true;
                });

                if (visibleTypes.length === 0 && searchQuery) return null;

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
                              onDownloadDocument={handleDownloadDocument}
                              onRenameDocument={handleRenameDocument}
                              onViewDocument={handleViewDocument}
                              onSetOverride={handleSetOverride}
                              uploadingFileNames={[...uploadingFiles.values()]
                                .filter((v) => v.docTypeId === docType.id)
                                .map((v) => v.fileName)}
                              statusMap={statusMap}
                              allStatuses={documentStatuses}
                              isInternalOrg={isInternalOrg}
                              onStatusChange={handleStatusChange}
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
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DeleteFileButton                                                           */
/* -------------------------------------------------------------------------- */

function DeleteFileButton({
  fileName,
  onConfirm,
  className,
}: {
  fileName: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={className ?? "h-5 w-5 p-0 shrink-0 opacity-0 group-hover/file:opacity-100 hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"}
        onClick={() => setOpen(true)}
        title="Archive"
      >
        <Archive className="h-3 w-3" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Archive document"
        desc={
          <>
            Are you sure you want to archive{" "}
            <span className="font-semibold">&quot;{fileName}&quot;</span>? This
            will archive the file. It can be restored later.
          </>
        }
        confirmText="Archive"
        destructive
        handleConfirm={() => {
          onConfirm();
          setOpen(false);
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  InlineEditFileName                                                         */
/* -------------------------------------------------------------------------- */

function InlineEditFileName({
  fileName,
  onRename,
}: {
  fileName: string;
  onRename: (newName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(fileName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(fileName);
  }, [fileName]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== fileName) {
      onRename(trimmed);
    } else {
      setValue(fileName);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setValue(fileName);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-xs font-medium flex-1 min-w-0 bg-transparent border-b border-primary outline-none px-0 py-0"
      />
    );
  }

  return (
    <button
      type="button"
      className="text-xs truncate flex-1 font-medium text-left hover:underline cursor-text group/name inline-flex items-center gap-1 min-w-0"
      onClick={() => setEditing(true)}
      title="Click to rename"
    >
      <span className="truncate">{fileName}</span>
      <Pencil className="h-2.5 w-2.5 text-muted-foreground shrink-0 opacity-0 group-hover/name:opacity-100 transition-opacity" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  DocumentStatusBadge                                                        */
/* -------------------------------------------------------------------------- */

function DocumentStatusBadge({
  doc,
  statusMap,
  allStatuses,
  isInternalOrg,
  onStatusChange,
}: {
  doc: DealDocument;
  statusMap: Map<number, DocumentStatusItem>;
  allStatuses: DocumentStatusItem[];
  isInternalOrg: boolean;
  onStatusChange: (docId: number, documentFileId: number, newStatusId: number) => void;
}) {
  const status = doc.document_status_id ? statusMap.get(doc.document_status_id) : null;
  if (!status) return null;

  const badgeEl = (
    <Badge
      variant="outline"
      className="shrink-0 whitespace-nowrap capitalize"
      style={{
        backgroundColor: status.color ? status.color + "18" : undefined,
        color: status.color ?? undefined,
        borderColor: status.color ? status.color + "30" : undefined,
      }}
    >
      {status.label}
    </Badge>
  );

  if (!isInternalOrg || !doc.document_file_id) return badgeEl;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
          {badgeEl}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5 pr-3" align="end">
        <div className="flex flex-col gap-0.5">
          {allStatuses.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors hover:bg-muted ${
                s.id === doc.document_status_id ? "bg-muted" : ""
              }`}
              onClick={() => {
                if (s.id !== doc.document_status_id && doc.document_file_id) {
                  onStatusChange(doc.id, doc.document_file_id, s.id);
                }
              }}
            >
              <Badge
                variant="outline"
                className="capitalize text-[10px] px-1.5 py-0 h-5"
                style={{
                  backgroundColor: s.color ? s.color + "18" : undefined,
                  color: s.color ?? undefined,
                  borderColor: s.color ? s.color + "30" : undefined,
                }}
              >
                {s.label}
              </Badge>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
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
  onDownloadDocument: (docId: number, fileName: string) => void;
  onRenameDocument: (docId: number, newName: string) => void;
  onViewDocument: (docId: number) => void;
  onSetOverride: (
    docTypeId: number,
    data: {
      is_visible_override?: boolean | null;
      is_required_override?: boolean | null;
    }
  ) => void;
  uploadingFileNames: string[];
  statusMap: Map<number, DocumentStatusItem>;
  allStatuses: DocumentStatusItem[];
  isInternalOrg: boolean;
  onStatusChange: (docId: number, documentFileId: number, newStatusId: number) => void;
}

function DocumentTypeRow({
  docType,
  isRequired,
  hasVisibilityOverride,
  hasRequiredOverride,
  files,
  onFileSelect,
  onDeleteDocument,
  onDownloadDocument,
  onRenameDocument,
  onViewDocument,
  onSetOverride,
  uploadingFileNames,
  statusMap,
  allStatuses,
  isInternalOrg,
  onStatusChange,
}: DocumentTypeRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDragOver, setModalDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      for (let i = 0; i < selectedFiles.length; i++) {
        onFileSelect(docType.id, selectedFiles[i]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      for (let i = 0; i < selectedFiles.length; i++) {
        onFileSelect(docType.id, selectedFiles[i]);
      }
    }
    if (modalFileInputRef.current) modalFileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      for (let i = 0; i < droppedFiles.length; i++) {
        onFileSelect(docType.id, droppedFiles[i]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleModalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      for (let i = 0; i < droppedFiles.length; i++) {
        onFileSelect(docType.id, droppedFiles[i]);
      }
    }
  };

  return (
    <div className="flex rounded-lg border bg-background shadow-sm overflow-hidden">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.tif,.tiff"
      />

      {/* Left: Upload zone (~22%) - drag & drop + click opens modal */}
      <div
        className={`w-[22%] min-w-[140px] flex-shrink-0 border-r border-dashed flex flex-col items-center justify-center gap-2 p-4 cursor-pointer transition-colors ${
          isDragOver
            ? "bg-primary/10 border-primary"
            : "bg-muted/20 hover:bg-muted/40"
        }`}
        onClick={() => setModalOpen(true)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className={`h-5 w-5 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
        <span className={`text-xs font-medium ${isDragOver ? "text-primary" : "text-muted-foreground"}`}>
          {isDragOver ? "Drop here" : "Upload"}
        </span>
        {!isDragOver && files.length > 0 && (
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
              <DropdownMenuItem
                onClick={() =>
                  onSetOverride(docType.id, { is_visible_override: false })
                }
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Hide from this deal
              </DropdownMenuItem>
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

        {/* File list + uploading placeholders */}
        {files.length > 0 || uploadingFileNames.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            {files.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 group/file"
              >
                {doc.has_file ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                ) : (
                  <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <InlineEditFileName
                  fileName={doc.file_name}
                  onRename={(newName) => onRenameDocument(doc.id, newName)}
                />
                {doc.has_file && doc.file_type === "application/pdf" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 shrink-0 opacity-0 group-hover/file:opacity-100 transition-opacity"
                    onClick={() => onViewDocument(doc.id)}
                    title="View"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                {doc.has_file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 shrink-0 opacity-0 group-hover/file:opacity-100 transition-opacity"
                    onClick={() => onDownloadDocument(doc.id, doc.file_name)}
                    title="Download"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
                <DeleteFileButton
                  fileName={doc.file_name}
                  onConfirm={() => onDeleteDocument(doc.id)}
                />
                {doc.file_size && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatFileSize(doc.file_size)}
                  </span>
                )}
                <DocumentStatusBadge
                  doc={doc}
                  statusMap={statusMap}
                  allStatuses={allStatuses}
                  isInternalOrg={isInternalOrg}
                  onStatusChange={onStatusChange}
                />
              </div>
            ))}
            {/* Per-file uploading placeholders */}
            {uploadingFileNames.map((name, i) => (
              <div
                key={`uploading-${i}`}
                className="flex items-center gap-2 rounded-md border border-dashed border-primary/30 bg-primary/5 px-3 py-2 animate-pulse"
              >
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                <span className="text-xs font-medium text-primary truncate">
                  Uploading {name}…
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-2">
            No files uploaded
          </p>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl p-8 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Upload — {docType.document_name}</DialogTitle>
            <DialogDescription>
              {docType.document_description || "Drag and drop files or click to browse"}
            </DialogDescription>
          </DialogHeader>

          {/* Hidden file input for modal */}
          <input
            ref={modalFileInputRef}
            type="file"
            hidden
            multiple
            onChange={handleModalFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.tif,.tiff"
          />

          {/* Large drag & drop zone */}
          <div
            className={`rounded-lg border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
              modalDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
            }`}
            onClick={() => modalFileInputRef.current?.click()}
            onDrop={handleModalDrop}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setModalDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setModalDragOver(false); }}
          >
            <Upload className={`h-8 w-8 ${modalDragOver ? "text-primary" : "text-muted-foreground"}`} />
            <div className="text-center">
              <p className={`text-sm font-medium ${modalDragOver ? "text-primary" : "text-foreground"}`}>
                {modalDragOver ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              PDF, DOC, XLS, CSV, PNG, JPG, GIF, TIFF
            </p>
          </div>

          {/* Files already uploaded + uploading placeholders for this doc type */}
          {(files.length > 0 || uploadingFileNames.length > 0) && (
            <div className="space-y-2 mt-4 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                {files.length} file{files.length !== 1 ? "s" : ""} uploaded
                {uploadingFileNames.length > 0 &&
                  `, ${uploadingFileNames.length} uploading`}
              </p>
              <div className="space-y-1.5 max-h-48 overflow-auto min-w-0">
                {files.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 group/file min-w-0 overflow-hidden"
                  >
                    {doc.has_file ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <InlineEditFileName
                      fileName={doc.file_name}
                      onRename={(newName) => onRenameDocument(doc.id, newName)}
                    />
                    {doc.has_file && doc.file_type === "application/pdf" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 shrink-0 opacity-0 group-hover/file:opacity-100 hover:opacity-100 transition-opacity"
                        onClick={() => onViewDocument(doc.id)}
                        title="View"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    {doc.has_file && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 shrink-0 opacity-0 group-hover/file:opacity-100 hover:opacity-100 transition-opacity"
                        onClick={() => onDownloadDocument(doc.id, doc.file_name)}
                        title="Download"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                    <DeleteFileButton
                      fileName={doc.file_name}
                      onConfirm={() => onDeleteDocument(doc.id)}
                    />
                    {doc.file_size && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatFileSize(doc.file_size)}
                      </span>
                    )}
                    <DocumentStatusBadge
                      doc={doc}
                      statusMap={statusMap}
                      allStatuses={allStatuses}
                      isInternalOrg={isInternalOrg}
                      onStatusChange={onStatusChange}
                    />
                  </div>
                ))}
                {/* Per-file uploading placeholders in modal */}
                {uploadingFileNames.map((name, i) => (
                  <div
                    key={`uploading-modal-${i}`}
                    className="flex items-center gap-2 rounded-md border border-dashed border-primary/30 bg-primary/5 px-3 py-2 animate-pulse"
                  >
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                    <span className="text-xs font-medium text-primary truncate">
                      Uploading {name}…
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FileManagerView                                                            */
/* -------------------------------------------------------------------------- */

type FileFilter = "required" | "unclassified" | "classified";

interface FileManagerViewProps {
  dealId: string;
  dealDocuments: DealDocument[];
  setDealDocuments: React.Dispatch<React.SetStateAction<DealDocument[]>>;
  documentTypes: DocumentType[];
  categories: DocumentCategory[];
  categoriesWithTypes: { category: DocumentCategory; types: DocumentType[] }[];
  onDeleteDocument: (docId: number) => void;
  onDownloadDocument: (docId: number, fileName: string) => void;
  onRenameDocument: (docId: number, newName: string) => void;
  onViewDocument: (docId: number) => void;
  isDocTypeRequired: (docTypeId: number) => boolean;
  statusMap: Map<number, DocumentStatusItem>;
  allStatuses: DocumentStatusItem[];
  isInternalOrg: boolean;
  onStatusChange: (docId: number, documentFileId: number, newStatusId: number) => void;
  statusFilters: Set<number>;
}

function FileManagerView({
  dealId,
  dealDocuments,
  setDealDocuments,
  documentTypes,
  categories,
  categoriesWithTypes,
  onDeleteDocument,
  onDownloadDocument,
  onRenameDocument,
  onViewDocument,
  isDocTypeRequired,
  statusMap,
  allStatuses,
  isInternalOrg,
  onStatusChange,
  statusFilters,
}: FileManagerViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [openSidebarCategories, setOpenSidebarCategories] = useState<string[]>(
    []
  );
  const [dragOverDocId, setDragOverDocId] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<FileFilter>>(
    new Set()
  );
  const [sidebarTagFilters, setSidebarTagFilters] = useState<
    Set<"required" | "not_uploaded">
  >(new Set());

  const toggleSidebarTagFilter = useCallback(
    (filter: "required" | "not_uploaded") => {
      setSidebarTagFilters((prev) => {
        const next = new Set(prev);
        if (next.has(filter)) {
          next.delete(filter);
        } else {
          next.add(filter);
        }
        return next;
      });
    },
    []
  );

  const toggleFilter = useCallback((filter: FileFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  }, []);

  /* ----- Lookup maps ----- */
  const typeMap = useMemo(() => {
    const map = new Map<number, DocumentType>();
    for (const dt of documentTypes) map.set(dt.id, dt);
    return map;
  }, [documentTypes]);

  const categoryMap = useMemo(() => {
    const map = new Map<number, DocumentCategory>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  /* ----- Sorted & filtered documents A-Z by file_name ----- */
  const sortedDocs = useMemo(() => {
    let docs = [...dealDocuments];

    // Apply filters (OR logic: show files matching ANY active filter)
    if (activeFilters.size > 0) {
      docs = docs.filter((doc) => {
        if (
          activeFilters.has("unclassified") &&
          doc.document_type_id == null
        ) {
          return true;
        }
        if (
          activeFilters.has("classified") &&
          doc.document_type_id != null
        ) {
          return true;
        }
        if (
          activeFilters.has("required") &&
          doc.document_type_id != null &&
          isDocTypeRequired(doc.document_type_id)
        ) {
          return true;
        }
        return false;
      });
    }

    // Apply document status filter
    if (statusFilters.size > 0) {
      docs = docs.filter(
        (doc) => doc.document_status_id != null && statusFilters.has(doc.document_status_id)
      );
    }

    return docs.sort((a, b) =>
      a.file_name.localeCompare(b.file_name, undefined, {
        sensitivity: "base",
      })
    );
  }, [dealDocuments, activeFilters, isDocTypeRequired, statusFilters]);

  /* ----- Count files per document type (for sidebar chips) ----- */
  const fileCountByType = useMemo(() => {
    const map = new Map<number, number>();
    for (const doc of dealDocuments) {
      if (doc.document_type_id) {
        map.set(
          doc.document_type_id,
          (map.get(doc.document_type_id) ?? 0) + 1
        );
      }
    }
    return map;
  }, [dealDocuments]);

  /* ----- Upload state: track individual files being uploaded ----- */
  const [uploadingFileNames, setUploadingFileNames] = useState<Map<string, string>>(new Map());

  /* ----- Upload handler (unclassified files) ----- */
  const handleUpload = useCallback(
    async (files: FileList) => {
      // Register all files as uploading first
      const keys: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const key = `${files[i].name}-${Date.now()}-${i}`;
        keys.push(key);
        setUploadingFileNames((prev) => {
          const next = new Map(prev);
          next.set(key, files[i].name);
          return next;
        });
      }

      const uploaded: DealDocument[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const formData = new FormData();
          formData.append("file", file);
          // No documentTypeId = unclassified upload

          const res = await fetch(`/api/deals/${dealId}/deal-documents`, {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error();
          const data = await res.json();
          uploaded.push(data.document);

          // Immediately add to documents & remove from uploading
          setDealDocuments((prev) => [...prev, data.document]);
        } catch {
          toast({
            title: "Error",
            description: `Failed to upload "${file.name}"`,
            variant: "destructive",
          });
        } finally {
          setUploadingFileNames((prev) => {
            const next = new Map(prev);
            next.delete(keys[i]);
            return next;
          });
        }
      }
      if (uploaded.length > 0) {
        toast({
          title: "Files uploaded",
          description: `${uploaded.length} file${uploaded.length !== 1 ? "s" : ""} uploaded to storage`,
        });
      }
    },
    [dealId, setDealDocuments]
  );

  /* ----- Assign document type via PATCH ----- */
  const handleAssignType = useCallback(
    async (docId: number, docTypeId: number) => {
      try {
        const res = await fetch(`/api/deals/${dealId}/deal-documents`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: docId, document_type_id: docTypeId }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDealDocuments((prev) =>
          prev.map((d) => (d.id === docId ? data.document : d))
        );
        const typeName = typeMap.get(docTypeId)?.document_name ?? "Unknown";
        toast({
          title: "Tagged",
          description: `File tagged as "${typeName}"`,
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to assign document type",
          variant: "destructive",
        });
      }
    },
    [dealId, setDealDocuments, typeMap]
  );

  /* ----- Remove tag (set document_type_id to null) ----- */
  const handleRemoveTag = useCallback(
    async (docId: number) => {
      try {
        const res = await fetch(`/api/deals/${dealId}/deal-documents`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: docId, document_type_id: null }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDealDocuments((prev) =>
          prev.map((d) => (d.id === docId ? data.document : d))
        );
      } catch {
        toast({
          title: "Error",
          description: "Failed to remove tag",
          variant: "destructive",
        });
      }
    },
    [dealId, setDealDocuments]
  );

  /* ----- Drag handlers for sidebar chips ----- */
  const handleChipDragStart = useCallback(
    (e: React.DragEvent, docTypeId: number) => {
      e.dataTransfer.setData(
        "application/x-doc-type-id",
        String(docTypeId)
      );
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  /* ----- Drop handlers for file rows ----- */
  const handleFileDragOver = useCallback(
    (e: React.DragEvent, docId: number) => {
      if (e.dataTransfer.types.includes("application/x-doc-type-id")) {
        e.preventDefault();
        e.stopPropagation();
        setDragOverDocId(docId);
      }
    },
    []
  );

  const handleFileDragLeave = useCallback(() => {
    setDragOverDocId(null);
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent, docId: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverDocId(null);
      const typeIdStr = e.dataTransfer.getData("application/x-doc-type-id");
      if (typeIdStr) {
        handleAssignType(docId, Number(typeIdStr));
      }
    },
    [handleAssignType]
  );

  /* ----- Filter sidebar categories by search ----- */
  const filteredCategories = useMemo(() => {
    return categoriesWithTypes
      .map(({ category, types }) => ({
        category,
        types: types.filter((t) => {
          // Text search
          if (sidebarSearch.trim()) {
            const q = sidebarSearch.toLowerCase();
            if (!t.document_name.toLowerCase().includes(q)) return false;
          }
          // Tag filters (AND logic — must pass all active filters)
          if (sidebarTagFilters.has("required") && !isDocTypeRequired(t.id)) {
            return false;
          }
          if (
            sidebarTagFilters.has("not_uploaded") &&
            (fileCountByType.get(t.id) ?? 0) > 0
          ) {
            return false;
          }
          return true;
        }),
      }))
      .filter(({ types }) => types.length > 0);
  }, [
    categoriesWithTypes,
    sidebarSearch,
    sidebarTagFilters,
    isDocTypeRequired,
    fileCountByType,
  ]);

  /* ----- Auto-open all sidebar categories ----- */
  useEffect(() => {
    setOpenSidebarCategories(
      filteredCategories.map(({ category }) => String(category.id))
    );
  }, [filteredCategories]);

  return (
    <div className="flex gap-4 min-h-[400px] h-full">
      {/* ---- Left panel: Upload zone + file list ---- */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Upload zone */}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.tif,.tiff"
          onChange={(e) => {
            if (e.target.files?.length) handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
        <div
          className={`rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            uploadDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setUploadDragOver(false);
            if (e.dataTransfer.files.length > 0) {
              handleUpload(e.dataTransfer.files);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setUploadDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setUploadDragOver(false);
          }}
        >
          <Upload
            className={`h-6 w-6 ${uploadDragOver ? "text-primary" : "text-muted-foreground"}`}
          />
          <p
            className={`text-sm font-medium ${uploadDragOver ? "text-primary" : ""}`}
          >
            {uploadDragOver
              ? "Drop files here"
              : "Drop files here or click to browse"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Upload multiple files — assign document types by dragging tags from
            the sidebar
          </p>
          {uploadingFileNames.size > 0 && (
            <div className="flex items-center gap-2 text-xs text-primary mt-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Uploading {uploadingFileNames.size} file{uploadingFileNames.size !== 1 ? "s" : ""}...</span>
            </div>
          )}
        </div>

        {/* File list header with filter */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-medium text-muted-foreground">
            {sortedDocs.length} file{sortedDocs.length !== 1 ? "s" : ""}
            {activeFilters.size > 0 && ` (filtered)`} — sorted A–Z
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={activeFilters.size > 0 ? "default" : "outline"}
                size="sm"
                className="h-7 gap-1.5 text-xs"
              >
                <ListFilter className="h-3.5 w-3.5" />
                Filter
                {activeFilters.size > 0 && (
                  <span className="ml-0.5 rounded-full bg-primary-foreground/20 px-1.5 text-[10px] font-bold">
                    {activeFilters.size}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1">
                  Filter files by
                </p>
                <label className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={activeFilters.has("required")}
                    onCheckedChange={() => toggleFilter("required")}
                  />
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs font-medium">Required</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={activeFilters.has("classified")}
                    onCheckedChange={() => toggleFilter("classified")}
                  />
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">Classified</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={activeFilters.has("unclassified")}
                    onCheckedChange={() => toggleFilter("unclassified")}
                  />
                  <div className="flex items-center gap-1.5">
                    <File className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">Unclassified</span>
                  </div>
                </label>
                {activeFilters.size > 0 && (
                  <>
                    <div className="border-t my-1" />
                    <button
                      className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1 text-left"
                      onClick={() => setActiveFilters(new Set())}
                    >
                      Clear all filters
                    </button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* File list */}
        {sortedDocs.length === 0 && uploadingFileNames.size === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <File className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {activeFilters.size > 0
                ? "No files match the selected filters"
                : "No files uploaded yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeFilters.size > 0
                ? "Try adjusting your filters"
                : "Upload files above to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Per-file uploading placeholders at top */}
            {[...uploadingFileNames.entries()].map(([key, name]) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 animate-pulse"
              >
                <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-primary truncate block">
                    Uploading {name}…
                  </span>
                </div>
              </div>
            ))}
            {sortedDocs.map((doc) => {
              const docType = doc.document_type_id
                ? typeMap.get(doc.document_type_id)
                : null;
              const category = docType
                ? categoryMap.get(docType.document_category_id)
                : null;
              const isDropTarget = dragOverDocId === doc.id;
              const fileIsRequired =
                doc.document_type_id != null &&
                isDocTypeRequired(doc.document_type_id);

              return (
                <div
                  key={doc.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 group/file transition-colors ${
                    isDropTarget
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "bg-background hover:bg-muted/30"
                  }`}
                  onDragOver={(e) => handleFileDragOver(e, doc.id)}
                  onDragLeave={handleFileDragLeave}
                  onDrop={(e) => handleFileDrop(e, doc.id)}
                >
                  {doc.has_file ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <InlineEditFileName
                      fileName={doc.file_name}
                      onRename={(newName) => onRenameDocument(doc.id, newName)}
                    />
                    <div className="flex items-center gap-1.5 mt-1">
                      {fileIsRequired && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                        >
                          Required
                        </Badge>
                      )}
                      {docType && category ? (
                        <>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => handleRemoveTag(doc.id)}
                          >
                            {category.name}
                            <X className="ml-1 h-2.5 w-2.5" />
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => handleRemoveTag(doc.id)}
                          >
                            {docType.document_name}
                            <X className="ml-1 h-2.5 w-2.5" />
                          </Badge>
                        </>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 text-muted-foreground border-dashed"
                        >
                          Unclassified
                        </Badge>
                      )}
                    </div>
                  </div>
                  {doc.has_file && doc.file_type === "application/pdf" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover/file:opacity-100 hover:opacity-100 transition-opacity"
                      onClick={() => onViewDocument(doc.id)}
                      title="View"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {doc.has_file && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover/file:opacity-100 hover:opacity-100 transition-opacity"
                      onClick={() => onDownloadDocument(doc.id, doc.file_name)}
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <DeleteFileButton
                    fileName={doc.file_name}
                    onConfirm={() => onDeleteDocument(doc.id)}
                    className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover/file:opacity-100 hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  />
                  {doc.file_size != null && doc.file_size > 0 && (
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {formatFileSize(doc.file_size)}
                    </span>
                  )}
                  <DocumentStatusBadge
                    doc={doc}
                    statusMap={statusMap}
                    allStatuses={allStatuses}
                    isInternalOrg={isInternalOrg}
                    onStatusChange={onStatusChange}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Right sidebar: Draggable document type chips ---- */}
      <div
        className="w-[280px] shrink-0 rounded-lg border bg-muted/20 flex flex-col sticky top-0 self-start"
        style={{ maxHeight: "calc(100vh - 300px)" }}
      >
        <div className="p-3 border-b space-y-2">
          <p className="text-sm font-semibold">Document Types</p>
          <p className="text-[10px] text-muted-foreground">
            Drag a type onto a file to tag it
          </p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search types..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full rounded-md border bg-background px-8 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {sidebarSearch && (
              <button
                onClick={() => setSidebarSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          {/* Sidebar tag filters */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => toggleSidebarTagFilter("required")}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors ${
                sidebarTagFilters.has("required")
                  ? "bg-destructive/10 border-destructive/40 text-destructive"
                  : "bg-background border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <ShieldCheck className="h-2.5 w-2.5" />
              Required
            </button>
            <button
              onClick={() => toggleSidebarTagFilter("not_uploaded")}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors ${
                sidebarTagFilters.has("not_uploaded")
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Upload className="h-2.5 w-2.5" />
              Not uploaded
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <Accordion
            type="multiple"
            value={openSidebarCategories}
            onValueChange={setOpenSidebarCategories}
          >
            {filteredCategories.map(({ category, types }) => (
              <AccordionItem
                key={category.id}
                value={String(category.id)}
                className="border-none"
              >
                <AccordionTrigger className="py-1.5 px-1 text-xs font-semibold hover:no-underline">
                  {category.name}
                </AccordionTrigger>
                <AccordionContent className="pb-2 pt-0 px-1">
                  <div className="flex flex-wrap gap-1.5">
                    {types.map((dt) => {
                      const count = fileCountByType.get(dt.id) ?? 0;
                      const required = isDocTypeRequired(dt.id);
                      return (
                        <div
                          key={dt.id}
                          draggable
                          onDragStart={(e) => handleChipDragStart(e, dt.id)}
                          className={`inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium cursor-grab active:cursor-grabbing hover:bg-muted/50 hover:border-primary/50 transition-colors select-none ${
                            required
                              ? "border-destructive/40"
                              : ""
                          }`}
                          title={`Drag onto a file to tag it as "${dt.document_name}"${required ? " (Required)" : ""}`}
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                          {required && (
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                          )}
                          <span className="truncate max-w-[140px]">
                            {dt.document_name}
                          </span>
                          {count > 0 && (
                            <span className="ml-0.5 rounded-full bg-primary/10 text-primary px-1.5 text-[9px] font-bold">
                              {count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
