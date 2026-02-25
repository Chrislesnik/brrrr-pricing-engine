/**
 * API Client adapted for Brrrr Pricing Engine
 * Maps workflow-builder API calls to our /api/automations/ endpoints
 */

import type { IntegrationConfig, IntegrationType } from "./types/integration";
import type { WorkflowEdge, WorkflowNode } from "./workflow-store";

// Workflow data types
export type WorkflowVisibility = "private" | "public";

export type WorkflowData = {
  id?: string;
  name?: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  visibility?: WorkflowVisibility;
};

export type SavedWorkflow = WorkflowData & {
  id: string;
  name: string;
  visibility: WorkflowVisibility;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
};

// API error class
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Helper function to make API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, error.error || "Request failed");
  }

  return response.json();
}

// AI API - uses our /api/ai/generate-workflow endpoint
export const aiApi = {
  generateStream: async (
    prompt: string,
    onUpdate: (data: WorkflowData) => void,
    existingWorkflow?: {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      name?: string;
    },
    availableIntegrations?: string[],
  ): Promise<WorkflowData> => {
    const response = await fetch("/api/ai/generate-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        existingWorkflow: existingWorkflow ?? undefined,
        availableIntegrations: availableIntegrations ?? [],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new ApiError(response.status, err.error || "Failed to generate workflow");
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new ApiError(500, "No response body");
    }

    const decoder = new TextDecoder();
    let accumulated = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        // Try to extract and parse JSON from the accumulated text.
        // The model streams raw JSON text — we attempt to parse the
        // largest valid prefix on each chunk so the UI can update
        // incrementally as nodes arrive.
        const parsed = tryParsePartialWorkflow(accumulated);
        if (parsed) {
          onUpdate(parsed);
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Final parse of the complete response
    const finalJson = extractJson(accumulated);
    if (!finalJson) {
      throw new ApiError(500, "AI did not return valid workflow JSON");
    }

    const workflow = JSON.parse(finalJson) as WorkflowData;
    onUpdate(workflow);
    return workflow;
  },
};

/**
 * Try to parse a partial JSON workflow from accumulated stream text.
 * Closes any unclosed brackets/braces and arrays to get a valid parse.
 */
function tryParsePartialWorkflow(text: string): WorkflowData | null {
  const jsonStart = text.indexOf("{");
  if (jsonStart === -1) return null;

  let json = text.slice(jsonStart);

  // First try direct parse (works when stream is complete)
  try {
    const parsed = JSON.parse(json);
    if (parsed.nodes) return parsed as WorkflowData;
  } catch {
    // Expected for partial JSON — continue with repair
  }

  // Close any open strings, arrays, and objects to make partial JSON parseable
  json = repairPartialJson(json);

  try {
    const parsed = JSON.parse(json);
    if (parsed.nodes && Array.isArray(parsed.nodes)) {
      return parsed as WorkflowData;
    }
  } catch {
    // Still unparseable — wait for more data
  }

  return null;
}

/**
 * Attempt to close unclosed JSON structures so partial output is parseable.
 */
function repairPartialJson(json: string): string {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  // If we're in the middle of a string, close it
  if (inString) {
    json += '"';
  }

  // Remove any trailing comma before closing brackets
  json = json.replace(/,\s*$/, "");

  // Close all open structures in reverse order
  while (stack.length > 0) {
    const closer = stack.pop()!;
    // Remove trailing comma before closing
    json = json.replace(/,\s*$/, "");
    json += closer;
  }

  return json;
}

/**
 * Extract the first complete JSON object from text.
 */
function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  // Find the matching closing brace
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  // No complete JSON found — return the whole thing from start (caller will try to parse)
  return text.slice(start);
}

export type Integration = {
  id: string;
  name: string;
  type: IntegrationType;
  isManaged?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationWithConfig = Integration & {
  config: IntegrationConfig;
};

// AI Gateway types (stubs for now)
export type AiGatewayStatusResponse = {
  enabled: boolean;
  signedIn: boolean;
  isVercelUser: boolean;
  hasManagedKey: boolean;
  managedIntegrationId?: string;
};

export type AiGatewayConsentResponse = {
  success: boolean;
  hasManagedKey: boolean;
  managedIntegrationId?: string;
  error?: string;
};

export type VercelTeam = {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  isPersonal: boolean;
};

export type AiGatewayTeamsResponse = {
  teams: VercelTeam[];
};

// Integration API - backed by /api/workflow-integrations
export const integrationApi = {
  getAll: async (type?: IntegrationType): Promise<Integration[]> => {
    const params = type ? `?type=${encodeURIComponent(type)}` : "";
    const res = await apiCall<{ integrations: Array<{
      id: string;
      name: string;
      type: string;
      config: Record<string, string>;
      createdAt: string;
      updatedAt: string;
    }> }>(`/api/workflow-integrations${params}`);
    return (res.integrations ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      type: i.type as IntegrationType,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));
  },

  get: async (id: string): Promise<IntegrationWithConfig> => {
    const res = await apiCall<{ integration: {
      id: string;
      name: string;
      type: string;
      config: Record<string, string>;
      createdAt: string;
      updatedAt: string;
    } }>(`/api/workflow-integrations?id=${encodeURIComponent(id)}`);
    const i = res.integration;
    return {
      id: i.id,
      name: i.name,
      type: i.type as IntegrationType,
      config: i.config,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  },

  create: async (data: {
    name: string;
    type: IntegrationType;
    config: IntegrationConfig;
  }): Promise<Integration> => {
    const res = await apiCall<{ integration: {
      id: string;
      name: string;
      type: string;
      createdAt: string;
      updatedAt: string;
    } }>("/api/workflow-integrations", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const i = res.integration;
    return {
      id: i.id,
      name: i.name,
      type: i.type as IntegrationType,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  },

  update: async (
    id: string,
    data: { name?: string; config?: IntegrationConfig }
  ): Promise<IntegrationWithConfig> => {
    const res = await apiCall<{ integration: {
      id: string;
      name: string;
      type: string;
      config: Record<string, string>;
      createdAt: string;
      updatedAt: string;
    } }>(`/api/workflow-integrations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    const i = res.integration;
    return {
      id: i.id,
      name: i.name,
      type: i.type as IntegrationType,
      config: i.config,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(
      `/api/workflow-integrations/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },

  testConnection: async (
    integrationId: string
  ): Promise<{ status: "success" | "error"; message: string }> => {
    return apiCall<{ status: "success" | "error"; message: string }>(
      "/api/workflow-integrations/test",
      {
        method: "POST",
        body: JSON.stringify({ integrationId }),
      }
    );
  },

  testCredentials: async (data: {
    type: IntegrationType;
    config: IntegrationConfig;
  }): Promise<{ status: "success" | "error"; message: string }> => {
    return apiCall<{ status: "success" | "error"; message: string }>(
      "/api/workflow-integrations/test",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
};

// User API (stub - we use Clerk)
export const userApi = {
  get: async () => ({
    id: "stub",
    name: "User",
    email: "",
    image: null as string | null,
    isAnonymous: false,
    providerId: null as string | null,
  }),
  update: async (_data: { name?: string; email?: string }) => ({
    success: true,
  }),
};

// Workflow API - maps to our /api/automations/ endpoints
export const workflowApi = {
  getAll: async (): Promise<SavedWorkflow[]> => {
    const res = await apiCall<{ actions: Array<{
      uuid: string;
      name: string;
      description: string | null;
      workflow_data: { nodes?: WorkflowNode[]; edges?: WorkflowEdge[] } | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }> }>("/api/automations");
    return (res.automations ?? []).map((a) => ({
      id: a.uuid,
      name: a.name,
      description: a.description || undefined,
      nodes: a.workflow_data?.nodes ?? [],
      edges: a.workflow_data?.edges ?? [],
      visibility: "private" as WorkflowVisibility,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      isOwner: true,
    }));
  },

  getById: async (id: string): Promise<SavedWorkflow> => {
    const res = await apiCall<{ action: {
      uuid: string;
      name: string;
      description: string | null;
      workflow_data: { nodes?: WorkflowNode[]; edges?: WorkflowEdge[] } | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    } }>(`/api/automations/${id}`);
    const a = res.automation;
    return {
      id: a.uuid,
      name: a.name,
      description: a.description || undefined,
      nodes: a.workflow_data?.nodes ?? [],
      edges: a.workflow_data?.edges ?? [],
      visibility: "private",
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      isOwner: true,
    };
  },

  create: async (workflow: Omit<WorkflowData, "id">): Promise<SavedWorkflow> => {
    const res = await apiCall<{ action: {
      uuid: string;
      name: string;
      description: string | null;
      workflow_data: { nodes?: WorkflowNode[]; edges?: WorkflowEdge[] } | null;
      created_at: string;
      updated_at: string;
    } }>("/api/automations", {
      method: "POST",
      body: JSON.stringify({
        name: workflow.name || "Untitled Action",
        description: workflow.description || null,
      }),
    });
    const a = res.automation;
    return {
      id: a.uuid,
      name: a.name,
      description: a.description || undefined,
      nodes: workflow.nodes,
      edges: workflow.edges,
      visibility: "private",
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      isOwner: true,
    };
  },

  update: async (id: string, workflow: Partial<WorkflowData>): Promise<SavedWorkflow> => {
    const payload: Record<string, unknown> = {};
    if (workflow.name !== undefined) payload.name = workflow.name;
    if (workflow.description !== undefined) payload.description = workflow.description;
    if (workflow.nodes !== undefined || workflow.edges !== undefined) {
      payload.workflow_data = {
        nodes: workflow.nodes ?? [],
        edges: workflow.edges ?? [],
      };
    }

    const triggerNode = (workflow.nodes ?? []).find(
      (n) => n.data.type === "trigger"
    );
    if (triggerNode) {
      const wt = triggerNode.data.config?.webhookType as string | undefined;
      payload.webhook_type = wt || null;
    }

    const res = await apiCall<{ action: {
      uuid: string;
      name: string;
      description: string | null;
      workflow_data: { nodes?: WorkflowNode[]; edges?: WorkflowEdge[] } | null;
      created_at: string;
      updated_at: string;
    } }>(`/api/automations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const a = res.automation;
    return {
      id: a.uuid,
      name: a.name,
      description: a.description || undefined,
      nodes: a.workflow_data?.nodes ?? [],
      edges: a.workflow_data?.edges ?? [],
      visibility: "private",
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      isOwner: true,
    };
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ ok: boolean }>(`/api/automations/${id}`, {
      method: "DELETE",
    }).then(() => ({ success: true }));
  },

  // Stubs for features not yet implemented
  duplicate: async (_id: string): Promise<SavedWorkflow> => {
    throw new ApiError(501, "Not implemented");
  },
  getCurrent: async (): Promise<WorkflowData> => ({ nodes: [], edges: [] }),
  saveCurrent: async (nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<WorkflowData> => ({
    nodes,
    edges,
  }),
  execute: async (id: string, input: Record<string, unknown> = {}) => {
    return apiCall<{ executionId: string; status: string }>(`/api/workflow/${encodeURIComponent(id)}/execute`, {
      method: "POST",
      body: JSON.stringify({ input }),
    });
  },
  triggerWebhook: async (id: string, input: Record<string, unknown> = {}) => {
    return apiCall<{ executionId: string; status: string }>(`/api/workflow/${encodeURIComponent(id)}/execute`, {
      method: "POST",
      body: JSON.stringify({ input }),
    });
  },
  getCode: async (_id: string) => ({
    code: "// Code generation not yet implemented",
    workflowName: "",
  }),
  getExecutions: async (id: string) => {
    return apiCall<Array<{
      id: string;
      workflowId: string;
      userId: string;
      status: string;
      input: unknown;
      output: unknown;
      error: string | null;
      startedAt: Date;
      completedAt: Date | null;
      duration: string | null;
    }>>(`/api/workflows/${encodeURIComponent(id)}/executions`);
  },
  deleteExecutions: async (id: string) => {
    return apiCall<{ success: boolean; deletedCount: number }>(
      `/api/workflows/${encodeURIComponent(id)}/executions`,
      { method: "DELETE" }
    );
  },
  getExecutionLogs: async (executionId: string) => {
    return apiCall<{
      execution: {
        id: string;
        workflowId: string;
        userId: string;
        status: string;
        input: unknown;
        output: unknown;
        error: string | null;
        startedAt: Date;
        completedAt: Date | null;
        duration: string | null;
        workflow: { id: string; name: string; nodes: unknown[]; edges: unknown[] };
      };
      logs: Array<{
        id: string;
        executionId: string;
        nodeId: string;
        nodeName: string;
        nodeType: string;
        status: "pending" | "running" | "success" | "error";
        input: unknown;
        output: unknown;
        error: string | null;
        startedAt: Date;
        completedAt: Date | null;
        duration: string | null;
      }>;
    }>(`/api/workflows/executions/${encodeURIComponent(executionId)}/logs`);
  },
  getExecutionStatus: async (executionId: string) => {
    return apiCall<{
      status: string;
      nodeStatuses: Array<{
        nodeId: string;
        status: "pending" | "running" | "success" | "error";
      }>;
    }>(`/api/workflows/executions/${encodeURIComponent(executionId)}/status`);
  },
  download: async (_id: string) => ({
    success: false,
    error: "Not implemented",
  }),
  autoSaveCurrent: (_nodes: WorkflowNode[], _edges: WorkflowEdge[]): void => {},
  autoSaveWorkflow: (() => {
    let autosaveTimeout: NodeJS.Timeout | null = null;
    const AUTOSAVE_DELAY = 2000;

    return (
      id: string,
      data: Partial<WorkflowData>,
      debounce = true
    ): Promise<SavedWorkflow> | undefined => {
      if (!debounce) {
        return workflowApi.update(id, data);
      }

      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
      }

      autosaveTimeout = setTimeout(() => {
        workflowApi.update(id, data).catch((error) => {
          console.error("Auto-save failed:", error);
        });
      }, AUTOSAVE_DELAY);
    };
  })(),
};

// AI Gateway API (stubs)
export const aiGatewayApi = {
  getStatus: async (): Promise<AiGatewayStatusResponse> => ({
    enabled: false,
    signedIn: false,
    isVercelUser: false,
    hasManagedKey: false,
  }),
  getTeams: async (): Promise<AiGatewayTeamsResponse> => ({ teams: [] }),
  consent: async (_teamId: string, _teamName: string): Promise<AiGatewayConsentResponse> => ({
    success: false,
    hasManagedKey: false,
    error: "Not implemented",
  }),
  revokeConsent: async (): Promise<AiGatewayConsentResponse> => ({
    success: false,
    hasManagedKey: false,
    error: "Not implemented",
  }),
};

// Export all APIs as a single object
export const api = {
  ai: aiApi,
  aiGateway: aiGatewayApi,
  integration: integrationApi,
  user: userApi,
  workflow: workflowApi,
};
