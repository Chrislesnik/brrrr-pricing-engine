import "server-only";

import { type StepInput, withStepLogging } from "@/components/workflow-builder/lib/steps/step-handler";
import { getErrorMessage } from "@/components/workflow-builder/lib/utils";
import { getSupabaseClient } from "./_client";

type StorageResult =
  | { success: true; data: { result: unknown } }
  | { success: false; error: { message: string } };

export type SupabaseStorageInput = StepInput & {
  integrationId?: string;
  operation: "list" | "upload" | "download" | "remove";
  bucket: string;
  path?: string;
  fileContent?: string;
};

async function stepHandler(input: SupabaseStorageInput): Promise<StorageResult> {
  if (!input.bucket?.trim()) {
    return { success: false, error: { message: "Bucket name is required" } };
  }

  try {
    const client = await getSupabaseClient(input.integrationId);
    const storage = client.storage.from(input.bucket.trim());

    switch (input.operation) {
      case "list": {
        const folder = input.path?.trim() || "";
        const { data, error } = await storage.list(folder, { limit: 100 });
        if (error) return { success: false, error: { message: `List failed: ${error.message}` } };
        return {
          success: true,
          data: {
            result: (data ?? []).map((f) => ({
              name: f.name,
              id: f.id,
              createdAt: f.created_at,
              size: f.metadata?.size,
              mimetype: f.metadata?.mimetype,
            })),
          },
        };
      }

      case "upload": {
        if (!input.path?.trim()) {
          return { success: false, error: { message: "File path is required for upload" } };
        }
        if (!input.fileContent) {
          return { success: false, error: { message: "File content is required for upload" } };
        }

        // Convert base64 or text content to buffer
        let fileBody: Blob | string = input.fileContent;
        if (input.fileContent.startsWith("data:")) {
          // Handle data URL (base64)
          const base64 = input.fileContent.split(",")[1];
          const buffer = Buffer.from(base64, "base64");
          fileBody = new Blob([buffer]);
        }

        const { data, error } = await storage.upload(input.path.trim(), fileBody, {
          upsert: true,
        });
        if (error) return { success: false, error: { message: `Upload failed: ${error.message}` } };
        return { success: true, data: { result: { path: data.path, fullPath: data.fullPath } } };
      }

      case "download": {
        if (!input.path?.trim()) {
          return { success: false, error: { message: "File path is required" } };
        }
        const { data } = storage.getPublicUrl(input.path.trim());
        return { success: true, data: { result: { publicUrl: data.publicUrl } } };
      }

      case "remove": {
        if (!input.path?.trim()) {
          return { success: false, error: { message: "File path is required for deletion" } };
        }
        const { error } = await storage.remove([input.path.trim()]);
        if (error) return { success: false, error: { message: `Delete failed: ${error.message}` } };
        return { success: true, data: { result: { deleted: true, path: input.path.trim() } } };
      }

      default:
        return { success: false, error: { message: `Unknown operation: ${input.operation}` } };
    }
  } catch (error) {
    return { success: false, error: { message: `Storage operation failed: ${getErrorMessage(error)}` } };
  }
}

export async function supabaseStorageStep(input: SupabaseStorageInput): Promise<StorageResult> {
  "use step";
  return withStepLogging(input, () => stepHandler(input));
}
supabaseStorageStep.maxRetries = 0;

export const _integrationType = "supabase";
