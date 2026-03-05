"use client";

import * as React from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { cn } from "@repo/lib/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/shadcn/collapsible";

interface FileTreeFolder {
  name: string;
  path: string;
  children?: FileTreeFolder[];
}

interface FileTreeProps {
  folders: FileTreeFolder[];
  selectedPath: string;
  onSelect: (path: string) => void;
}

export function FileTree({ folders, selectedPath, onSelect }: FileTreeProps) {
  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelect("")}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
          selectedPath === ""
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Folder className="h-4 w-4 shrink-0" />
        All Documents
      </button>
      {folders.map((folder) => (
        <FileTreeNode
          key={folder.path}
          folder={folder}
          selectedPath={selectedPath}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
}

function FileTreeNode({
  folder,
  selectedPath,
  onSelect,
  depth,
}: {
  folder: FileTreeFolder;
  selectedPath: string;
  onSelect: (path: string) => void;
  depth: number;
}) {
  const isSelected = selectedPath === folder.path;
  const isChildSelected = selectedPath.startsWith(folder.path + "/");
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <Collapsible defaultOpen={isSelected || isChildSelected}>
      <div
        className={cn("flex items-center rounded-md transition-colors")}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                isSelected
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => onSelect(folder.path)}
            >
              <ChevronRight className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90 [[data-state=open]>&]:rotate-90" />
              {isSelected || isChildSelected ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Folder className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{formatFolderName(folder.name)}</span>
            </button>
          </CollapsibleTrigger>
        ) : (
          <button
            className={cn(
              "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              isSelected
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => onSelect(folder.path)}
          >
            <span className="h-3 w-3 shrink-0" />
            {isSelected ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Folder className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">{formatFolderName(folder.name)}</span>
          </button>
        )}
      </div>

      {hasChildren && (
        <CollapsibleContent>
          {folder.children!.map((child) => (
            <FileTreeNode
              key={child.path}
              folder={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function formatFolderName(name: string): string {
  return name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
