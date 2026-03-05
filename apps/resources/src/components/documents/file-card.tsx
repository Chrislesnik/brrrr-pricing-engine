"use client";

import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { cn } from "@repo/lib/cn";
import type { StorageFile } from "@/lib/storage";
import { formatFileSize, getFileTypeLabel } from "@/lib/storage";

interface FileCardProps {
  file: StorageFile;
  view: "grid" | "list";
  onDownload: (file: StorageFile) => void;
  onPreview?: (file: StorageFile) => void;
}

const FILE_TYPE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  image: FileImage,
  txt: FileText,
  file: File,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: "text-red-500 bg-red-500/10",
  doc: "text-blue-500 bg-blue-500/10",
  docx: "text-blue-500 bg-blue-500/10",
  xls: "text-emerald-500 bg-emerald-500/10",
  xlsx: "text-emerald-500 bg-emerald-500/10",
  csv: "text-emerald-500 bg-emerald-500/10",
  image: "text-violet-500 bg-violet-500/10",
  txt: "text-gray-500 bg-gray-500/10",
  file: "text-gray-400 bg-gray-400/10",
};

export function FileCard({ file, view, onDownload, onPreview }: FileCardProps) {
  const typeLabel = getFileTypeLabel(file.mimeType);
  const Icon = FILE_TYPE_ICONS[typeLabel] || File;
  const colorClass = FILE_TYPE_COLORS[typeLabel] || FILE_TYPE_COLORS.file;
  const [iconColor, iconBg] = colorClass.split(" ");

  if (view === "list") {
    return (
      <div className="group flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-all hover:border-primary/20 hover:shadow-sm">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            iconBg
          )}
        >
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} &middot;{" "}
            {typeLabel.toUpperCase()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onPreview && typeLabel === "pdf" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPreview(file)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDownload(file)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-md">
      <div
        className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-xl",
          iconBg
        )}
      >
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>
      <p className="mb-1 truncate text-sm font-semibold" title={file.name}>
        {file.name}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatFileSize(file.size)} &middot; {typeLabel.toUpperCase()}
      </p>
      <div className="mt-3 flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={() => onDownload(file)}
        >
          <Download className="mr-1.5 h-3 w-3" />
          Download
        </Button>
        {onPreview && typeLabel === "pdf" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onPreview(file)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
