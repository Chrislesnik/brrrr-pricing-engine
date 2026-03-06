"use client";

import * as React from "react";
import {
  LayoutGrid,
  List,
  FolderArchive,
  Search,
  ChevronRight,
  Folder,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Separator } from "@repo/ui/shadcn/separator";
import { cn } from "@repo/lib/cn";
import { FileCard } from "./file-card";
import { FileTree } from "./file-tree";
import type { StorageFile } from "@/lib/storage";

interface FileTreeFolder {
  name: string;
  path: string;
  children?: FileTreeFolder[];
}

interface FileGalleryProps {
  files: StorageFile[];
  folders: FileTreeFolder[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onDownload: (file: StorageFile) => void;
}

export function FileGallery({
  files,
  folders,
  currentPath,
  onNavigate,
  onDownload,
}: FileGalleryProps) {
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [search, setSearch] = React.useState("");

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  const breadcrumbs = currentPath
    ? currentPath.split("/").map((part, index, arr) => ({
        name: part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        path: arr.slice(0, index + 1).join("/"),
      }))
    : [];

  return (
    <div className="flex h-full gap-0">
      {/* Sidebar file tree */}
      <div className="hidden w-64 shrink-0 border-r lg:block">
        <div className="sticky top-0 p-4">
          <div className="mb-3 flex items-center gap-2">
            <FolderArchive className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Folders</h3>
          </div>
          <FileTree
            folders={folders}
            selectedPath={currentPath}
            onSelect={onNavigate}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm">
            <button
              onClick={() => onNavigate("")}
              className={cn(
                "transition-colors hover:text-foreground",
                currentPath ? "text-muted-foreground" : "font-medium text-foreground"
              )}
            >
              Documents
            </button>
            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.path}>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <button
                  onClick={() => onNavigate(crumb.path)}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    crumb.path === currentPath
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 rounded-md border bg-transparent pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Separator orientation="vertical" className="h-4" />

            {/* View toggle */}
            <div className="flex items-center rounded-md border">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7 rounded-r-none"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7 rounded-l-none"
                onClick={() => setView("list")}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Files */}
        <div className="p-6">
          {/* Subfolder chips (for mobile and visual convenience) */}
          {folders.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Folders
              </h4>
              <div className="flex flex-wrap gap-2">
                {folders
                  .filter((f) => {
                    if (!currentPath) return f.path.split("/").length === 1;
                    return (
                      f.path.startsWith(currentPath + "/") &&
                      f.path.replace(currentPath + "/", "").split("/").length === 1
                    );
                  })
                  .map((folder) => (
                    <button
                      key={folder.path}
                      onClick={() => onNavigate(folder.path)}
                      className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-all hover:border-primary/30 hover:bg-accent"
                    >
                      <Folder className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">
                        {folder.name
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* File grid/list */}
          {filteredFiles.length > 0 ? (
            <>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Files ({filteredFiles.length})
              </h4>
              <div
                className={cn(
                  view === "grid"
                    ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "space-y-2"
                )}
              >
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    view={view}
                    onDownload={onDownload}
                  />
                ))}
              </div>
            </>
          ) : search ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No files matching &ldquo;{search}&rdquo;
              </p>
            </div>
          ) : (
            files.length === 0 &&
            folders.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <FolderArchive className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold">
                  No documents yet
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Upload documents to the &ldquo;resource-documents&rdquo;
                  bucket in Supabase Storage to make them available here.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
