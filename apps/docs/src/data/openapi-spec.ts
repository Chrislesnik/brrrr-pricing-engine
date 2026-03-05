import { API_ENDPOINTS, groupEndpoints } from "./api-endpoints";
import type { ApiEndpoint, ParamDef } from "./api-endpoints";

interface OpenApiInfo {
  title: string;
  version: string;
  description: string;
}

interface OpenApiServer {
  url: string;
  description: string;
}

interface OpenApiParameter {
  name: string;
  in: "path" | "query";
  required: boolean;
  description: string;
  schema: { type: string };
}

interface OpenApiRequestBody {
  required: boolean;
  content: {
    "application/json": {
      schema: { type: string; example: Record<string, unknown> };
    };
  };
}

interface OpenApiResponse {
  description: string;
  content: {
    "application/json": {
      schema: { type: string; example: Record<string, unknown> | unknown[] };
    };
  };
}

interface OpenApiOperation {
  operationId: string;
  summary: string;
  description: string;
  tags: string[];
  security: Array<Record<string, string[]>>;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
}

interface OpenApiPathItem {
  [method: string]: OpenApiOperation;
}

interface OpenApiTag {
  name: string;
  description: string;
}

interface OpenApiSpec {
  openapi: string;
  info: OpenApiInfo;
  servers: OpenApiServer[];
  tags: OpenApiTag[];
  paths: Record<string, OpenApiPathItem>;
  components: {
    securitySchemes: {
      bearerAuth: {
        type: string;
        scheme: string;
        bearerFormat: string;
        description: string;
      };
    };
  };
}

function paramToOpenApi(p: ParamDef, location: "path" | "query"): OpenApiParameter {
  return {
    name: p.name,
    in: location,
    required: p.required,
    description: p.description,
    schema: { type: p.type },
  };
}

function endpointToOperation(ep: ApiEndpoint): OpenApiOperation {
  const op: OpenApiOperation = {
    operationId: ep.id,
    summary: ep.summary,
    description: ep.description,
    tags: [ep.tag],
    security: [{ bearerAuth: [] }],
    responses: {
      "200": {
        description: "Successful response",
        content: {
          "application/json": {
            schema: {
              type: Array.isArray(ep.responseExample) ? "array" : "object",
              example: ep.responseExample,
            },
          },
        },
      },
    },
  };

  const params: OpenApiParameter[] = [
    ...ep.pathParams.map((p) => paramToOpenApi(p, "path")),
    ...ep.queryParams.map((p) => paramToOpenApi(p, "query")),
  ];
  if (params.length > 0) op.parameters = params;

  if (ep.requestBody) {
    op.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            example: ep.requestBody,
          },
        },
      },
    };
  }

  return op;
}

export function getOpenApiSpec(
  baseUrl = "https://api.example.com"
): OpenApiSpec {
  const groups = groupEndpoints();

  const tags: OpenApiTag[] = groups.map((g) => ({
    name: g.tag,
    description: g.description,
  }));

  const paths: Record<string, OpenApiPathItem> = {};

  for (const ep of API_ENDPOINTS) {
    const pathKey = ep.path;
    if (!paths[pathKey]) paths[pathKey] = {};
    paths[pathKey][ep.method.toLowerCase()] = endpointToOperation(ep);
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "dscr.ai API",
      version: "1.0.0",
      description:
        "REST API for managing deals, loans, borrowers, entities, scenarios, and more within the dscr.ai platform.",
    },
    servers: [{ url: baseUrl, description: "API server" }],
    tags,
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API Key",
          description:
            "Use your organization API key secret as the bearer token: Authorization: Bearer <api_key_secret>",
        },
      },
    },
  };
}
