/**
 * Generates an OpenAPI 3.0.3 specification from the API endpoint registry.
 * The spec is filtered to only include endpoints matching the given scopes.
 */

import {
  API_ENDPOINTS,
  type ApiEndpoint,
  type JsonSchemaObject,
  type JsonSchemaProperty,
} from "./api-endpoint-registry"

interface OpenApiInfo {
  title: string
  description: string
  version: string
}

interface OpenApiSpec {
  openapi: string
  info: OpenApiInfo
  servers: Array<{ url: string; description: string }>
  paths: Record<string, Record<string, unknown>>
  components: {
    securitySchemes: Record<string, unknown>
  }
  security: Array<Record<string, string[]>>
  tags: Array<{ name: string; description?: string }>
}

function toOpenApiSchema(
  schema: JsonSchemaObject | JsonSchemaProperty,
): Record<string, unknown> {
  const result: Record<string, unknown> = { type: schema.type }

  if ("description" in schema && schema.description) {
    result.description = schema.description
  }
  if ("format" in schema && schema.format) {
    result.format = schema.format
  }
  if ("enum" in schema && schema.enum) {
    result.enum = schema.enum
  }
  if ("nullable" in schema && schema.nullable) {
    result.nullable = true
  }
  if ("example" in schema && schema.example !== undefined) {
    result.example = schema.example
  }
  if ("required" in schema && schema.required) {
    result.required = schema.required
  }
  if ("items" in schema && schema.items) {
    result.items = toOpenApiSchema(schema.items)
  }
  if ("properties" in schema && schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, val]) => [
        key,
        toOpenApiSchema(val),
      ]),
    )
  }
  if ("oneOf" in schema && schema.oneOf) {
    result.oneOf = schema.oneOf.map(toOpenApiSchema)
  }

  return result
}

function buildOperation(endpoint: ApiEndpoint): Record<string, unknown> {
  const operation: Record<string, unknown> = {
    summary: endpoint.summary,
    description: endpoint.description,
    tags: endpoint.tags,
    operationId: `${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[/{}]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")}`,
  }

  const parameters: Array<Record<string, unknown>> = []

  if (endpoint.pathParams) {
    for (const p of endpoint.pathParams) {
      parameters.push({
        name: p.name,
        in: "path",
        required: true,
        description: p.description,
        schema: { type: "string" },
        example: p.example,
      })
    }
  }

  if (endpoint.queryParams) {
    for (const q of endpoint.queryParams) {
      parameters.push({
        name: q.name,
        in: "query",
        required: q.required ?? false,
        description: q.description,
        schema: { type: "string" },
        ...(q.example ? { example: q.example } : {}),
      })
    }
  }

  if (parameters.length > 0) {
    operation.parameters = parameters
  }

  if (endpoint.requestBody) {
    operation.requestBody = {
      required: true,
      ...(endpoint.requestBody.description
        ? { description: endpoint.requestBody.description }
        : {}),
      content: {
        "application/json": {
          schema: toOpenApiSchema(endpoint.requestBody.schema),
          example: endpoint.requestBody.example,
        },
      },
    }
  }

  const statusCode = String(endpoint.response.status ?? 200)
  operation.responses = {
    [statusCode]: {
      description: endpoint.response.description,
      content: {
        "application/json": {
          schema: toOpenApiSchema(endpoint.response.schema),
          example: endpoint.response.example,
        },
      },
    },
    "401": {
      description: "Unauthorized — missing or invalid API key",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          example: { error: "Unauthorized" },
        },
      },
    },
    "403": {
      description: "Forbidden — API key lacks required scope",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          example: { error: "Missing required scope: read:deals" },
        },
      },
    },
  }

  return operation
}

export function generateOpenApiSpec(options: {
  baseUrl: string
  scopes?: string[]
  orgName?: string
}): OpenApiSpec {
  const { baseUrl, scopes, orgName } = options

  const endpoints = scopes
    ? API_ENDPOINTS.filter((ep) => scopes.includes(ep.scope))
    : API_ENDPOINTS

  const paths: Record<string, Record<string, unknown>> = {}

  for (const endpoint of endpoints) {
    const openApiPath = endpoint.path.replace(
      /\/api\//,
      "/api/",
    )

    if (!paths[openApiPath]) {
      paths[openApiPath] = {}
    }

    paths[openApiPath]![endpoint.method.toLowerCase()] =
      buildOperation(endpoint)
  }

  const tagSet = new Set<string>()
  for (const ep of endpoints) {
    for (const t of ep.tags) tagSet.add(t)
  }

  return {
    openapi: "3.0.3",
    info: {
      title: orgName
        ? `${orgName} — Pricing Engine API`
        : "Pricing Engine API",
      description:
        "REST API for the Pricing Engine platform. Authenticate with a Clerk API key using Bearer token authentication.\n\n" +
        (scopes
          ? `This spec is scoped to the following permissions: ${scopes.join(", ")}`
          : "This spec includes all available endpoints."),
      version: "1.0.0",
    },
    servers: [
      {
        url: baseUrl,
        description: "Production",
      },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description:
            "Clerk API key. Pass as `Authorization: Bearer <api_key_secret>`.",
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: Array.from(tagSet).map((name) => ({ name })),
  }
}
