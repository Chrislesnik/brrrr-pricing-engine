# Cursor Execution Checklist

This file breaks the DSCR developer documentation implementation into sane, bounded execution chunks so Cursor does not create one giant blast radius.

## Working rules for the agent

- Make changes in small phases.
- Do not refactor unrelated code.
- Do not invent alternate architecture.
- Do not create a second OpenAPI spec.
- Do not document internal endpoints unless explicitly marked public.
- Do not try to import existing shadcn React components into Mintlify.
- Keep a running notes file of assumptions, blockers, and follow-ups.

---

## Commit 1 — Repository audit and implementation notes

### Objective
Understand the current monorepo before changing anything material.

### Tasks
1. Inspect root `package.json`, `turbo.json`, workspace config, and existing app/package layout.
2. Identify:
   - current package naming conventions
   - existing shared UI/theme/token packages
   - font setup
   - global CSS variable sources
   - existing API route locations inside `apps/pricing-engine`
3. Create:
   - `docs/internal/dev-docs-implementation-plan.md` if not already present
   - `docs/internal/dev-docs-repo-audit.md`
4. In the audit doc, record:
   - existing apps and packages
   - where DSCR theme tokens live today
   - where app router API routes live
   - potential conflicts with Mintlify or Scalar integration
   - unresolved questions for later phases

### Constraints
- No production logic changes.
- No dependency installs yet unless needed for inspection tooling already present.

### Expected output
- audit doc committed
- implementation notes committed

### Commit message
`docs: add repo audit and implementation notes for developer docs system`

---

## Commit 2 — Scaffold `packages/api-contract`

### Objective
Create the contract-first package that will become the single source of truth for the public API.

### Tasks
1. Create:
   - `packages/api-contract/package.json`
   - `packages/api-contract/tsconfig.json`
   - `packages/api-contract/src/index.ts`
2. Create folders:
   - `src/schemas`
   - `src/routes`
   - `src/examples`
   - `src/openapi`
3. Add initial files:
   - `src/schemas/common.ts`
   - `src/schemas/auth.ts`
   - `src/schemas/errors.ts`
   - `src/schemas/pricing-runs.ts`
   - `src/schemas/pricing-models.ts`
   - `src/schemas/organizations.ts`
   - `src/routes/auth.ts`
   - `src/routes/pricing-runs.ts`
   - `src/routes/pricing-models.ts`
   - `src/routes/organizations.ts`
   - `src/routes/coverage.md`
   - `src/openapi/registry.ts`
   - `src/openapi/generate.ts`
4. Add dependencies for:
   - Zod
   - OpenAPI generation
   - YAML serialization
   - TS execution for generator script
5. Add package script:
   - `build:openapi`

### Constraints
- Package can start with placeholder schemas and routes, but structure must be correct.
- Use explicit route registration, not route file scanning.

### Expected output
- `api-contract` scaffolding committed
- package builds at least structurally

### Commit message
`feat(api-contract): scaffold contract-first OpenAPI package`

---

## Commit 3 — Build initial schemas, examples, and OpenAPI generator

### Objective
Get a real spec generated from explicit contracts.

### Tasks
1. Implement shared schemas:
   - identifiers
   - timestamps
   - pagination if needed
   - standard error envelope
   - validation error envelope
2. Implement first real route contracts for:
   - auth
   - pricing-runs
   - pricing-models
3. Add realistic JSON examples for:
   - auth token request/response
   - create pricing run request/response
   - get pricing run response
   - list pricing models response
   - standard error response
   - validation error response
4. Register:
   - API metadata
   - tags
   - security schemes
   - server definitions
   - routes
5. Generate:
   - `dist/openapi.json`
   - `dist/openapi.yaml`

### Constraints
- Operation IDs must be explicit and stable.
- Examples must be domain-relevant, not filler junk.

### Expected output
- valid generated spec artifacts
- spec checked into repo if that matches repo conventions

### Commit message
`feat(api-contract): generate initial OpenAPI spec with examples`

---

## Commit 4 — Connect first slice of real pricing-engine routes to contracts

### Objective
Make the spec reflect real code, not fantasy docs.

### Tasks
1. Identify a small first slice of actual endpoints in `apps/pricing-engine`.
2. Refactor selected handlers to import and use schemas from `packages/api-contract`.
3. Ensure request validation and response shapes match the documented contract.
4. Update `coverage.md` to mark:
   - documented public routes
   - internal routes
   - pending routes

### Constraints
- Limit this commit to a small, safe route slice.
- Do not attempt full API migration at once.

### Expected output
- 2–4 routes aligned with contract package
- coverage file updated

### Commit message
`feat(pricing-engine): align initial public routes with api-contract`

---

## Commit 5 — Scaffold `apps/api-reference`

### Objective
Create the Scalar app that will serve the canonical interactive API reference.

### Tasks
1. Create:
   - `apps/api-reference/package.json`
   - `apps/api-reference/tsconfig.json`
   - `apps/api-reference/app/page.tsx`
   - `apps/api-reference/app/reference/page.tsx`
   - `apps/api-reference/app/openapi/route.ts`
   - `apps/api-reference/lib/scalar-config.ts`
2. Wire the app to load the generated spec from `packages/api-contract/dist/openapi.json`.
3. Add a simple landing redirect or landing page if appropriate.
4. Confirm the spec route serves current content without copying files manually.

### Constraints
- No duplicate spec files.
- Scalar is the canonical endpoint explorer.

### Expected output
- app boots
- spec can be loaded by the UI

### Commit message
`feat(api-reference): scaffold Scalar reference app`

---

## Commit 6 — Apply DSCR brand styling to Scalar

### Objective
Make the API reference feel like DSCR, not generic Scalar.

### Tasks
1. Add DSCR-aligned configuration:
   - logo
   - title
   - fonts if supported
   - color overrides
   - radius feel
   - code block tone
2. Tune layout for:
   - tag grouping
   - readable request/response examples
   - auth visibility
   - server selection if needed
3. Make sure the styling is maintainable and isolated.

### Constraints
- Do not try to recreate the entire app shell.
- Prioritize brand alignment over pixel-perfect duplication.

### Expected output
- branded Scalar reference

### Commit message
`style(api-reference): apply DSCR brand styling to Scalar`

---

## Commit 7 — Scaffold `docs/mintlify`

### Objective
Create the Mintlify docs workspace inside the monorepo.

### Tasks
1. Create:
   - `docs/mintlify/docs.json`
   - `docs/mintlify/introduction.mdx`
   - `docs/mintlify/quickstart.mdx`
   - `docs/mintlify/authentication.mdx`
   - `docs/mintlify/api-overview.mdx`
   - `docs/mintlify/concepts/errors.mdx`
   - `docs/mintlify/concepts/versioning.mdx`
   - `docs/mintlify/concepts/rate-limits.mdx`
   - `docs/mintlify/concepts/idempotency.mdx`
   - `docs/mintlify/guides/create-first-pricing-run.mdx`
   - `docs/mintlify/guides/authenticate-with-api-key.mdx`
   - `docs/mintlify/guides/handle-errors.mdx`
   - `docs/mintlify/sdks/typescript.mdx`
   - `docs/mintlify/sdks/python.mdx`
   - `docs/mintlify/changelog/2026-03.mdx`
   - `docs/mintlify/styles/custom.css`
2. Configure top-level IA:
   - Overview
   - Concepts
   - Guides
   - SDKs
   - API
   - Changelog
3. Ensure the API area links clearly to Scalar as the canonical reference.

### Constraints
- Mintlify should not become a duplicate endpoint catalog.
- Keep content polished but concise enough for v1.

### Expected output
- docs workspace builds
- IA is in place

### Commit message
`feat(docs): scaffold Mintlify developer docs workspace`

---

## Commit 8 — Create `packages/brand-tokens`

### Objective
Create a semantic token bridge for docs and API reference surfaces.

### Tasks
1. Create:
   - `packages/brand-tokens/package.json`
   - `packages/brand-tokens/tsconfig.json`
   - `packages/brand-tokens/src/index.ts`
   - `packages/brand-tokens/src/docs-theme.ts`
   - `packages/brand-tokens/src/scalar-theme.ts`
2. Export semantic values for:
   - background
   - foreground
   - border
   - primary
   - accent
   - success
   - warning
   - destructive
   - radius
   - font families
3. Map those tokens conceptually to:
   - Mintlify custom CSS
   - Scalar custom theming

### Constraints
- This is a translation layer, not full UI package reuse.

### Expected output
- shared semantic token package
- docs/api-reference theming notes or exports connected

### Commit message
`feat(brand): add semantic token bridge for docs and api reference`

---

## Commit 9 — Generate TypeScript and Python SDKs

### Objective
Create the first SDK generation pipeline from the same OpenAPI spec.

### Tasks
1. Create:
   - `packages/generated-sdks/typescript`
   - `packages/generated-sdks/python`
2. Add scripts to generate SDKs from the OpenAPI spec.
3. Add README or minimal docs in each generated package:
   - install
   - auth
   - first request example
4. Update Mintlify SDK pages to reflect generated SDK usage.

### Constraints
- Only TypeScript and Python in v1.
- Do not publish packages automatically yet.

### Expected output
- generated SDKs committed
- docs reflect them accurately

### Commit message
`feat(sdks): add generated TypeScript and Python SDKs`

---

## Commit 10 — Wire Turbo tasks and local dev workflow

### Objective
Make the system runnable and reproducible.

### Tasks
1. Update `turbo.json` with tasks:
   - `build:openapi`
   - `build:sdks`
   - `build:api-reference`
   - `build:docs`
2. Add root scripts:
   - `docs:openapi`
   - `docs:sdks`
   - `docs:mintlify`
   - `docs:scalar`
   - `docs:dev`
   - `docs:build`
3. Add notes to implementation docs describing:
   - local dev commands
   - build order
   - artifact locations

### Constraints
- Keep commands simple and deterministic.
- Make sure spec generation precedes SDK/API docs build.

### Expected output
- local workflow documented
- pipeline runs in correct order

### Commit message
`build(docs): wire turbo tasks and local developer workflow`

---

## Commit 11 — Routing and deployment notes

### Objective
Document how this will actually ship at `/docs` and `/api`.

### Tasks
1. Create:
   - `docs/internal/dev-docs-routing-and-deployment.md`
2. Document:
   - local URLs
   - deployed URLs
   - canonical URL strategy
   - `/docs` -> Mintlify
   - `/api` -> Scalar
   - optional subdomains
3. Include notes on how to avoid duplicate canonical ownership.

### Expected output
- deployment/routing strategy documented

### Commit message
`docs: add routing and deployment plan for docs and api reference`

---

## Commit 12 — Authoring standards and follow-up list

### Objective
Prevent future docs drift and garbage entropy.

### Tasks
1. Create:
   - `docs/internal/dev-docs-standards.md`
2. Define:
   - page title conventions
   - summary conventions
   - guide vs concept vs changelog rules
   - endpoint documentation requirements
   - example quality rules
   - operationId naming rules
   - tag naming rules
3. Add a follow-up backlog section in implementation notes for:
   - remaining undocumented public endpoints
   - package publishing later
   - deeper auth examples
   - webhooks docs
   - sandbox/prod server strategy

### Expected output
- standards doc committed
- next steps documented

### Commit message
`docs: add developer docs authoring standards and follow-up backlog`

---

## Final validation pass

Before declaring complete, verify all of the following:

- `packages/api-contract` builds and emits `openapi.json` and `openapi.yaml`
- selected real routes in `pricing-engine` align with the contract package
- `apps/api-reference` renders Scalar from the generated spec
- `docs/mintlify` has working IA and links to the Scalar reference
- TypeScript and Python SDKs generate successfully
- docs and API reference are visually aligned with DSCR branding
- local dev commands are documented and reproducible
- no duplicate competing API reference has been created inside Mintlify

---

## Suggested order if the agent gets stuck

If anything blocks progress, preserve this priority order:

1. repo audit
2. api-contract scaffolding
3. spec generation
4. first real route alignment
5. Scalar app
6. Mintlify workspace
7. brand token bridge
8. SDK generation
9. turbo wiring
10. standards and deployment notes
