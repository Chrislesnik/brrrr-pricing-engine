import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { z } from '../zod-setup';
import {
  CreateDealRequest,
  CreateDealResponse,
  ListDealsQuery,
  ListDealsResponse,
} from '../schemas/deals';
import {
  ListLoansQuery,
  ListLoansResponse,
  Loan,
  UpdateLoanRequest,
  UpdateLoanResponse,
} from '../schemas/loans';
import {
  CreateBorrowerRequest,
  CreateBorrowerResponse,
  ListBorrowersQuery,
  ListBorrowersResponse,
  SearchBorrowersQuery,
  SearchBorrowersResponse,
} from '../schemas/borrowers';
import {
  CreateEntityRequest,
  CreateEntityResponse,
  ListEntitiesResponse,
  SearchEntitiesQuery,
  SearchEntitiesResponse,
} from '../schemas/entities';
import {
  ArchiveScenarioQuery,
  GetScenarioResponse,
  UpdateScenarioRequest,
  UpdateScenarioResponse,
} from '../schemas/scenarios';
import {
  ListProgramsQuery,
  ListProgramsResponse,
} from '../schemas/programs';
import {
  CreateAppraisalOrderRequest,
  CreateAppraisalOrderResponse,
  ListAppraisalOrdersResponse,
  UpdateAppraisalOrderRequest,
  UpdateAppraisalOrderResponse,
} from '../schemas/appraisals';
import {
  CreateDocumentTemplateRequest,
  CreateDocumentTemplateResponse,
  ListDocumentTemplatesResponse,
} from '../schemas/documents';
import {
  ListCreditReportsQuery,
  ListCreditReportsResponse,
} from '../schemas/credit-reports';
import {
  CreateBackgroundReportRequest,
  CreateBackgroundReportResponse,
  ListBackgroundReportsResponse,
} from '../schemas/background-reports';
import {
  GetPipelineQuery,
  GetPipelineResponse,
} from '../schemas/pipeline';
import {
  ListSignatureRequestsQuery,
  ListSignatureRequestsResponse,
} from '../schemas/signature-requests';
import {
  ListApplicationsQuery,
  ListApplicationsResponse,
} from '../schemas/applications';
import { ErrorResponse, ValidationErrorResponse } from '../schemas/errors';
import { SuccessResponse } from '../schemas/common';

export const registry = new OpenAPIRegistry();

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'API Key',
  description:
    'Use your organization API key secret as the bearer token: Authorization: Bearer <api_key_secret>',
});

function withSecurity() {
  return [{ [bearerAuth.name]: [] }];
}

function errorResponses() {
  return {
    400: {
      description: 'Bad request',
      content: { 'application/json': { schema: ErrorResponse } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponse } },
    },
    422: {
      description: 'Validation error',
      content: { 'application/json': { schema: ValidationErrorResponse } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  } as const;
}

export function registerRoutes() {
  // ── Deals ──────────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/deals',
    operationId: 'listDeals',
    summary: 'List deals',
    description:
      'Returns a paginated list of deals visible to the authenticated API key\'s organization.',
    tags: ['deals'],
    security: withSecurity(),
    request: { query: ListDealsQuery },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: ListDealsResponse } },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/deals',
    operationId: 'createDeal',
    summary: 'Create a deal',
    description:
      'Creates a new deal with the supplied inputs. Each input is identified by its input_id and input_type.',
    tags: ['deals'],
    security: withSecurity(),
    request: {
      body: {
        content: { 'application/json': { schema: CreateDealRequest } },
      },
    },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: CreateDealResponse } },
      },
      ...errorResponses(),
    },
  });

  // ── Loans ──────────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/loans/list',
    operationId: 'listLoans',
    summary: 'List loans',
    description: 'Returns all loans visible to the organization.',
    tags: ['loans'],
    security: withSecurity(),
    request: { query: ListLoansQuery },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: ListLoansResponse } },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/loans/{id}',
    operationId: 'updateLoan',
    summary: 'Update a loan',
    description:
      'Updates an existing loan\'s status or triggers an action (e.g. submit, approve).',
    tags: ['loans'],
    security: withSecurity(),
    request: {
      params: z.object({ id: z.string().openapi({ description: 'Loan ID' }) }),
      body: {
        content: { 'application/json': { schema: UpdateLoanRequest } },
      },
    },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: UpdateLoanResponse } },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/loans/{id}',
    operationId: 'archiveLoan',
    summary: 'Archive a loan',
    description: 'Soft-deletes a loan by moving it to the archive.',
    tags: ['loans'],
    security: withSecurity(),
    request: {
      params: z.object({ id: z.string().openapi({ description: 'Loan ID' }) }),
    },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: SuccessResponse } },
      },
      ...errorResponses(),
    },
  });

  // ── Applications ───────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/applications/list',
    operationId: 'listApplications',
    summary: 'List applications',
    description:
      'Returns all loan applications across the organization pipeline.',
    tags: ['applications'],
    security: withSecurity(),
    request: { query: ListApplicationsQuery },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: ListApplicationsResponse } },
      },
      ...errorResponses(),
    },
  });

  // ── Borrowers ──────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/applicants/borrowers',
    operationId: 'searchBorrowers',
    summary: 'Search borrowers',
    description:
      'Full-text search across borrowers by name, email, or ID. Optionally filter by entity.',
    tags: ['borrowers'],
    security: withSecurity(),
    request: { query: SearchBorrowersQuery },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: SearchBorrowersResponse },
        },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/applicants/borrowers',
    operationId: 'createBorrower',
    summary: 'Create a borrower',
    description:
      'Creates a new borrower profile attached to the organization.',
    tags: ['borrowers'],
    security: withSecurity(),
    request: {
      body: {
        content: { 'application/json': { schema: CreateBorrowerRequest } },
      },
    },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: CreateBorrowerResponse },
        },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/applicants/borrowers/list',
    operationId: 'listBorrowers',
    summary: 'List borrowers',
    description:
      'Returns a pipeline view of all borrowers with summary information.',
    tags: ['borrowers'],
    security: withSecurity(),
    request: { query: ListBorrowersQuery },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: ListBorrowersResponse } },
      },
      ...errorResponses(),
    },
  });

  // ── Entities ───────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/applicants/entities',
    operationId: 'searchEntities',
    summary: 'Search entities',
    description:
      'Full-text search across entities (LLCs, Trusts, etc.).',
    tags: ['entities'],
    security: withSecurity(),
    request: { query: SearchEntitiesQuery },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: SearchEntitiesResponse },
        },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/applicants/entities',
    operationId: 'createEntity',
    summary: 'Create an entity',
    description:
      'Creates a new entity (LLC, Trust, Corporation, etc.) and optionally attaches owners.',
    tags: ['entities'],
    security: withSecurity(),
    request: {
      body: {
        content: { 'application/json': { schema: CreateEntityRequest } },
      },
    },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: CreateEntityResponse },
        },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/applicants/entities/list',
    operationId: 'listEntities',
    summary: 'List entities',
    description:
      'Returns a pipeline view of entities with owner mapping.',
    tags: ['entities'],
    security: withSecurity(),
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: ListEntitiesResponse },
        },
      },
      ...errorResponses(),
    },
  });

  // ── Scenarios ──────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/scenarios/{id}',
    operationId: 'getScenario',
    summary: 'Get a scenario',
    description:
      'Returns a single scenario by ID, including its inputs and outputs.',
    tags: ['scenarios'],
    security: withSecurity(),
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'Scenario ID' }),
      }),
    },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: GetScenarioResponse } },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/scenarios/{id}',
    operationId: 'updateScenario',
    summary: 'Update a scenario',
    description: 'Updates a scenario\'s name, inputs, or outputs.',
    tags: ['scenarios'],
    security: withSecurity(),
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'Scenario ID' }),
      }),
      body: {
        content: { 'application/json': { schema: UpdateScenarioRequest } },
      },
    },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: UpdateScenarioResponse } },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/scenarios/{id}',
    operationId: 'archiveScenario',
    summary: 'Archive a scenario',
    description:
      'Soft-deletes a scenario. Pass action=restore as a query param to unarchive.',
    tags: ['scenarios'],
    security: withSecurity(),
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'Scenario ID' }),
      }),
      query: ArchiveScenarioQuery,
    },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: SuccessResponse } },
      },
      ...errorResponses(),
    },
  });

  // ── Programs ───────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/programs',
    operationId: 'listPrograms',
    summary: 'List programs',
    description:
      'Returns all lending programs configured for the organization.',
    tags: ['programs'],
    security: withSecurity(),
    request: { query: ListProgramsQuery },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: ListProgramsResponse } },
      },
      ...errorResponses(),
    },
  });

  // ── Appraisals ─────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/appraisal-orders',
    operationId: 'listAppraisalOrders',
    summary: 'List appraisal orders',
    description:
      'Returns all appraisal orders for the organization.',
    tags: ['appraisals'],
    security: withSecurity(),
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: ListAppraisalOrdersResponse },
        },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/appraisal-orders',
    operationId: 'createAppraisalOrder',
    summary: 'Create an appraisal order',
    description: 'Creates a new appraisal order for a deal.',
    tags: ['appraisals'],
    security: withSecurity(),
    request: {
      body: {
        content: {
          'application/json': { schema: CreateAppraisalOrderRequest },
        },
      },
    },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: CreateAppraisalOrderResponse },
        },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/appraisal-orders/{id}',
    operationId: 'updateAppraisalOrder',
    summary: 'Update an appraisal order',
    description:
      'Updates an existing appraisal order\'s status, due date, or other fields.',
    tags: ['appraisals'],
    security: withSecurity(),
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'Order ID' }),
      }),
      body: {
        content: {
          'application/json': { schema: UpdateAppraisalOrderRequest },
        },
      },
    },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: UpdateAppraisalOrderResponse },
        },
      },
      ...errorResponses(),
    },
  });

  // ── Documents ──────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/document-templates',
    operationId: 'listDocumentTemplates',
    summary: 'List document templates',
    description:
      'Returns all document templates configured for the organization.',
    tags: ['documents'],
    security: withSecurity(),
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: ListDocumentTemplatesResponse },
        },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/document-templates',
    operationId: 'createDocumentTemplate',
    summary: 'Create a document template',
    description:
      'Creates a new document template with optional HTML content.',
    tags: ['documents'],
    security: withSecurity(),
    request: {
      body: {
        content: {
          'application/json': { schema: CreateDocumentTemplateRequest },
        },
      },
    },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: CreateDocumentTemplateResponse },
        },
      },
      ...errorResponses(),
    },
  });

  // ── Credit Reports ─────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/credit-reports',
    operationId: 'listCreditReports',
    summary: 'List credit reports',
    description:
      'Returns credit report documents for a specific borrower. The borrowerId query parameter is required.',
    tags: ['credit-reports'],
    security: withSecurity(),
    request: { query: ListCreditReportsQuery },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: ListCreditReportsResponse },
        },
      },
      ...errorResponses(),
    },
  });

  // ── Background Reports ─────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/background-reports',
    operationId: 'listBackgroundReports',
    summary: 'List background reports',
    description:
      'Returns all background check reports for the organization.',
    tags: ['background-reports'],
    security: withSecurity(),
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: ListBackgroundReportsResponse },
        },
      },
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/background-reports',
    operationId: 'createBackgroundReport',
    summary: 'Create a background report',
    description:
      'Initiates a background check for a borrower or entity.',
    tags: ['background-reports'],
    security: withSecurity(),
    request: {
      body: {
        content: {
          'application/json': { schema: CreateBackgroundReportRequest },
        },
      },
    },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: CreateBackgroundReportResponse },
        },
      },
      ...errorResponses(),
    },
  });

  // ── Pipeline ───────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/pipeline',
    operationId: 'getPipeline',
    summary: 'Get pipeline data',
    description:
      'Returns pipeline-view data. The shape depends on the view query parameter.',
    tags: ['pipeline'],
    security: withSecurity(),
    request: { query: GetPipelineQuery },
    responses: {
      200: {
        description: 'Successful response',
        content: { 'application/json': { schema: GetPipelineResponse } },
      },
      ...errorResponses(),
    },
  });

  // ── Signature Requests ─────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/signature-requests',
    operationId: 'listSignatureRequests',
    summary: 'List signature requests',
    description:
      'Returns e-signature requests for a deal. The dealId query parameter is required.',
    tags: ['signature-requests'],
    security: withSecurity(),
    request: { query: ListSignatureRequestsQuery },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: ListSignatureRequestsResponse },
        },
      },
      ...errorResponses(),
    },
  });
}
