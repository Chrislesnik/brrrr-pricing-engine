import { getSupabaseClient } from "./supabase";

export const DOCUMENTS_BUCKET = "resource-documents";

export interface StorageFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  isFolder: boolean;
}

export interface StorageFolder {
  name: string;
  path: string;
  files: StorageFile[];
  subfolders: StorageFolder[];
}

const FILE_ICONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/png": "image",
  "image/jpeg": "image",
  "image/svg+xml": "image",
  "text/plain": "txt",
  "text/csv": "csv",
};

export function getFileTypeLabel(mimeType: string): string {
  return FILE_ICONS[mimeType] || "file";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function listFiles(
  folder: string = ""
): Promise<{ files: StorageFile[]; folders: string[] }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    console.error("Error listing files:", error);
    return { files: [], folders: [] };
  }

  const files: StorageFile[] = [];
  const folders: string[] = [];

  for (const item of data || []) {
    if (item.id === null) {
      folders.push(item.name);
    } else {
      const filePath = folder ? `${folder}/${item.name}` : item.name;
      files.push({
        id: item.id,
        name: item.name,
        path: filePath,
        size: item.metadata?.size || 0,
        mimeType: item.metadata?.mimetype || "application/octet-stream",
        createdAt: item.created_at,
        updatedAt: item.updated_at || item.created_at,
        isFolder: false,
      });
    }
  }

  return { files, folders };
}

export async function getSignedUrl(filePath: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }

  return data.signedUrl;
}

export function getPublicUrl(filePath: string): string {
  const supabase = getSupabaseClient();
  const { data } = supabase.storage
    .from(DOCUMENTS_BUCKET)
    .getPublicUrl(filePath);
  return data.publicUrl;
}

export async function listFolderTree(
  rootFolder: string = ""
): Promise<StorageFolder> {
  const { files, folders } = await listFiles(rootFolder);

  const subfolders: StorageFolder[] = [];
  for (const folderName of folders) {
    const folderPath = rootFolder
      ? `${rootFolder}/${folderName}`
      : folderName;
    const subfolder = await listFolderTree(folderPath);
    subfolders.push(subfolder);
  }

  return {
    name: rootFolder.split("/").pop() || "Documents",
    path: rootFolder,
    files,
    subfolders,
  };
}
