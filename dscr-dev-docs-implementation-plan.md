# DSCR Developer Documentation System Implementation Plan

This document describes the architecture and implementation plan for the
DSCR developer documentation platform using: - Mintlify (developer
documentation) - Scalar (API reference and playground) - OpenAPI (single
source of truth) - Automatic SDK generation - Contract‑first API schema
definitions

The system will live inside the existing Next.js Turborepo monorepo.

------------------------------------------------------------------------

# High-Level Architecture

Monorepo structure:

apps/ pricing-engine/ \# existing Next.js application resources/ \#
existing or new Next.js application api-reference/ \# Next.js app that
hosts Scalar

docs/ mintlify/ \# Mintlify documentation workspace

packages/ api-contract/ \# Zod schemas + OpenAPI generation
brand-tokens/ \# brand token bridge generated-sdks/ typescript/ python/

------------------------------------------------------------------------

# Public URLs

Primary public URLs:

https://dscr.ai/docs → Mintlify developer documentation
https://dscr.ai/api → Scalar API reference

Optional subdomains:

https://docs.dscr.ai https://api.dscr.ai

Canonical URLs should remain:

dscr.ai/docs dscr.ai/api

------------------------------------------------------------------------

# Responsibility Split

pricing-engine - production application - API route handlers - imports
shared schemas from api-contract

api-contract - Zod schemas - OpenAPI route registry - OpenAPI generation
scripts - request/response examples

api-reference - renders Scalar API reference - loads generated OpenAPI
spec

mintlify docs - onboarding documentation - guides - SDK docs -
changelog - links to Scalar API explorer

------------------------------------------------------------------------

# Phase 1 --- Repository Audit

Tasks:

1.  Inspect Turborepo structure
2.  Identify shared theme tokens
3.  Identify fonts and global CSS variables
4.  Inspect existing API routes
5.  Document findings

Create:

docs/internal/dev-docs-implementation-plan.md

Acceptance criteria:

-   repo structure documented
-   shared tokens identified
-   no breaking changes

------------------------------------------------------------------------

# Phase 2 --- Contract-first OpenAPI package

Create package:

packages/api-contract/

Structure:

packages/api-contract/ src/ schemas/ routes/ examples/ openapi/ dist/

Schemas:

schemas/common.ts schemas/auth.ts schemas/errors.ts
schemas/pricing-runs.ts schemas/pricing-models.ts
schemas/organizations.ts

Routes:

routes/auth.ts routes/pricing-runs.ts routes/pricing-models.ts
routes/organizations.ts

Examples:

examples/auth-token.request.json examples/auth-token.response.json
examples/pricing-run.create.request.json
examples/pricing-run.create.response.json

OpenAPI generation:

openapi/registry.ts openapi/generate.ts

Output files:

dist/openapi.json dist/openapi.yaml

Acceptance criteria:

-   OpenAPI spec builds successfully
-   examples included
-   operationIds defined
-   tags defined

------------------------------------------------------------------------

# Phase 3 --- Connect pricing-engine routes

Steps:

1.  Identify public API endpoints
2.  Import schemas from api-contract
3.  Validate request bodies
4.  Align response shapes with contract
5.  Track coverage

Coverage file:

packages/api-contract/src/routes/coverage.md

Acceptance criteria:

-   routes validated with shared schemas
-   responses match spec
-   internal routes not exposed

------------------------------------------------------------------------

# Phase 4 --- Scalar API reference app

Create:

apps/api-reference/

Structure:

apps/api-reference/ app/ page.tsx reference/page.tsx openapi/route.ts
lib/ scalar-config.ts

Responsibilities:

-   load generated OpenAPI spec
-   render Scalar UI
-   support auth testing
-   display examples

Acceptance criteria:

-   Scalar loads correctly
-   endpoints grouped by tags
-   request examples visible
-   auth flow works

------------------------------------------------------------------------

# Phase 5 --- Mintlify docs workspace

Create:

docs/mintlify/

Structure:

docs/mintlify/ docs.json introduction.mdx quickstart.mdx
authentication.mdx api-overview.mdx concepts/ guides/ sdks/ changelog/

Navigation:

Overview Concepts Guides SDKs API Changelog

Mintlify API section links to Scalar explorer.

Acceptance criteria:

-   docs build successfully
-   navigation clean
-   brand styling applied

------------------------------------------------------------------------

# Phase 6 --- Brand token bridge

Create package:

packages/brand-tokens/

Purpose:

translate DSCR design system tokens into: - Mintlify styles - Scalar
styles

Export tokens:

background foreground border primary accent radius font families

Acceptance criteria:

-   docs visually match DSCR brand
-   maintainable styling

------------------------------------------------------------------------

# Phase 7 --- SDK generation pipeline

Output directories:

packages/generated-sdks/ typescript/ python/

Tasks:

1.  generate SDK from OpenAPI
2.  commit generated code
3.  add install docs in Mintlify
4.  defer publishing

Acceptance criteria:

-   TypeScript SDK generated
-   Python SDK generated
-   docs reference SDK usage

------------------------------------------------------------------------

# Phase 8 --- Turbo pipeline

Add tasks:

build:openapi build:sdks build:api-reference build:docs

Pipeline order:

openapi → sdks → api-reference → docs

Acceptance criteria:

-   builds deterministic
-   artifacts synchronized

------------------------------------------------------------------------

# Phase 9 --- Deployment routing

Routes:

/docs → Mintlify /api → Scalar

Document routing rules and canonical URLs.

Acceptance criteria:

-   clear routing strategy
-   no duplicate canonical pages

------------------------------------------------------------------------

# Phase 10 --- Documentation standards

Create:

docs/internal/dev-docs-standards.md

Include:

-   endpoint documentation requirements
-   example payload standards
-   operationId naming rules
-   tag naming rules
-   docs writing guidelines

------------------------------------------------------------------------

# Naming conventions

Tags:

auth pricing-runs pricing-models organizations webhooks

Operation IDs:

createPricingRun getPricingRun listPricingModels

Schema names:

PricingRun CreatePricingRunRequest ValidationErrorResponse

------------------------------------------------------------------------

# Definition of Done

The system is complete when:

-   OpenAPI spec builds from api-contract
-   pricing-engine routes use shared schemas
-   Scalar API reference renders correctly
-   Mintlify docs provide onboarding and guides
-   SDKs generate successfully
-   docs and API reference match DSCR branding
-   local development workflow documented
