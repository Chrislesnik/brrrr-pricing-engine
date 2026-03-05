"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileGallery } from "@/components/documents/file-gallery";
import type { StorageFile } from "@/lib/storage";

interface FileTreeFolder {
  name: string;
  path: string;
  children?: FileTreeFolder[];
}

interface StorageResponse {
  files: StorageFile[];
  folders: string[];
}

export function DocumentsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialFolder = searchParams.get("folder") || "";

  const [currentPath, setCurrentPath] = React.useState(initialFolder);
  const [files, setFiles] = React.useState<StorageFile[]>([]);
  const [folderTree, setFolderTree] = React.useState<FileTreeFolder[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchFiles = React.useCallback(async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/storage/list?folder=${encodeURIComponent(path)}`
      );
      if (res.ok) {
        const data: StorageResponse = await res.json();
        setFiles(data.files);
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFolderTree = React.useCallback(async () => {
    try {
      const res = await fetch("/api/storage/tree");
      if (res.ok) {
        const data: FileTreeFolder[] = await res.json();
        setFolderTree(data);
      }
    } catch (err) {
      console.error("Failed to fetch folder tree:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchFiles(currentPath);
    fetchFolderTree();
  }, [currentPath, fetchFiles, fetchFolderTree]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    const newUrl = path
      ? `/resources/documents?folder=${encodeURIComponent(path)}`
      : "/resources/documents";
    router.push(newUrl, { scroll: false });
    fetchFiles(path);
  };

  const handleDownload = async (file: StorageFile) => {
    try {
      const res = await fetch(
        `/api/storage/download?path=${encodeURIComponent(file.path)}`
      );
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("Failed to download file:", err);
    }
  };

  if (loading && files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <FileGallery
      files={files}
      folders={folderTree}
      currentPath={currentPath}
      onNavigate={handleNavigate}
      onDownload={handleDownload}
    />
  );
}
