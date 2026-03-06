# Repo Scaffolding Tree

This file defines the intended directory and file structure for the DSCR developer documentation system. Cursor should follow this structure unless a repo-specific naming conflict requires a small adjustment.

## Target monorepo structure

```txt
apps/
  pricing-engine/                      # existing Next.js app
  resources/                           # existing or new Next.js app
  api-reference/                       # Next.js app for Scalar

docs/
  mintlify/                            # Mintlify docs workspace
  internal/                            # planning, standards, audit notes

packages/
  api-contract/                        # source of truth for public API contracts
  brand-tokens/                        # semantic token bridge for docs/api-reference
  generated-sdks/
    typescript/
    python/
```

---

## `apps/api-reference`

```txt
apps/api-reference/
  app/
    page.tsx
    reference/
      page.tsx
    openapi/
      route.ts
  lib/
    scalar-config.ts
  public/
  styles/
  package.json
  tsconfig.json
```

### Notes
- `app/page.tsx` can redirect to `/reference` or render a minimal landing page.
- `app/reference/page.tsx` renders Scalar.
- `app/openapi/route.ts` serves the generated OpenAPI spec from `packages/api-contract/dist/openapi.json`.
- `lib/scalar-config.ts` contains Scalar configuration, tag grouping, branding, auth behavior, and layout options.

---

## `docs/mintlify`

```txt
docs/mintlify/
  docs.json
  introduction.mdx
  quickstart.mdx
  authentication.mdx
  api-overview.mdx

  concepts/
    errors.mdx
    versioning.mdx
    rate-limits.mdx
    idempotency.mdx

  guides/
    create-first-pricing-run.mdx
    authenticate-with-api-key.mdx
    handle-errors.mdx

  sdks/
    typescript.mdx
    python.mdx

  changelog/
    2026-03.mdx

  images/
  snippets/
  styles/
    custom.css
```

### Notes
- Mintlify is responsible for guides, concepts, onboarding, SDK usage pages, and changelog.
- Mintlify should not become a duplicate full endpoint explorer.
- `api-overview.mdx` should point readers into Scalar for the canonical interactive reference.

---

## `docs/internal`

```txt
docs/internal/
  dev-docs-implementation-plan.md
  dev-docs-repo-audit.md
  dev-docs-routing-and-deployment.md
  dev-docs-standards.md
```

### Notes
- These are internal planning and authoring docs, not public developer docs.
- Keep them concise and operational.

---

## `packages/api-contract`

```txt
packages/api-contract/
  src/
    index.ts

    schemas/
      common.ts
      auth.ts
      errors.ts
      pricing-runs.ts
      pricing-models.ts
      organizations.ts

    routes/
      auth.ts
      pricing-runs.ts
      pricing-models.ts
      organizations.ts
      coverage.md

    examples/
      auth-token.request.json
      auth-token.response.json
      pricing-run.create.request.json
      pricing-run.create.response.json
      pricing-run.get.response.json
      pricing-models.list.response.json
      error.validation.response.json
      error.standard.response.json

    openapi/
      registry.ts
      generate.ts

  dist/
    openapi.json
    openapi.yaml

  package.json
  tsconfig.json
```

### Notes
- This package is the single source of truth for the public API contract.
- Explicit route registration only. No primary reliance on route scanning.
- All public operation metadata belongs here:
  - tags
  - summaries
  - descriptions
  - operationIds
  - request schemas
  - response schemas
  - examples
  - security metadata

---

## `packages/brand-tokens`

```txt
packages/brand-tokens/
  src/
    index.ts
    docs-theme.ts
    scalar-theme.ts
  package.json
  tsconfig.json
```

### Notes
- This package should export semantic tokens, not raw app implementation details.
- It is a translation layer for:
  - Mintlify custom CSS/theme config
  - Scalar custom theming/config
- Do not attempt to mirror the entire app design system here.

---

## `packages/generated-sdks`

```txt
packages/generated-sdks/
  typescript/
    README.md
    # generated client files

  python/
    README.md
    # generated client files
```

### Notes
- Only TypeScript and Python in v1.
- Generated code may be committed for now.
- Do not publish automatically until API stability improves.

---

## Root-level script expectations

These files may already exist and should be updated as needed:

```txt
package.json
turbo.json
pnpm-workspace.yaml
```

### Expected script behavior
At the root, support commands equivalent to:

```txt
docs:openapi
docs:sdks
docs:mintlify
docs:scalar
docs:dev
docs:build
```

### Expected Turbo task behavior
Tasks should cover at least:

```txt
build:openapi
build:sdks
build:api-reference
build:docs
```

Dependency order should be:

```txt
build:openapi
  -> build:sdks
  -> build:api-reference
  -> build:docs
```

Adjust exact dependency graph if docs build also depends on generated SDK artifacts or copied snippets.

---

## Navigation and content structure expectations

### Mintlify top-level IA
Use this shape:

```txt
Overview
Concepts
Guides
SDKs
API
Changelog
```

### Scalar tag groups
Use stable tag groups such as:

```txt
auth
pricing-runs
pricing-models
organizations
webhooks
```

### Operation IDs
Use stable camelCase names such as:

```txt
authenticateWithApiKey
createPricingRun
getPricingRun
listPricingModels
```

### Schema names
Use PascalCase names such as:

```txt
PricingRun
CreatePricingRunRequest
ValidationErrorResponse
```

---

## What should not be added

Do not add any of the following unless explicitly needed later:

- a second standalone OpenAPI spec for Mintlify
- a giant custom docs Next.js app replacing Mintlify
- shared shadcn component imports inside Mintlify
- more than two generated SDK language targets in v1
- automatic SDK publishing workflows in v1
- automatic route-file scanning as the primary spec source

---

## Minimal expected artifact list for first successful milestone

A first milestone is successful when the repo contains at least:

```txt
apps/api-reference/app/reference/page.tsx
apps/api-reference/app/openapi/route.ts
apps/api-reference/lib/scalar-config.ts

docs/mintlify/docs.json
docs/mintlify/introduction.mdx
docs/mintlify/quickstart.mdx
docs/mintlify/authentication.mdx
docs/mintlify/api-overview.mdx

packages/api-contract/src/openapi/generate.ts
packages/api-contract/src/openapi/registry.ts
packages/api-contract/src/routes/auth.ts
packages/api-contract/src/routes/pricing-runs.ts
packages/api-contract/src/schemas/errors.ts
packages/api-contract/dist/openapi.json
packages/api-contract/dist/openapi.yaml

packages/brand-tokens/src/index.ts

packages/generated-sdks/typescript/README.md
packages/generated-sdks/python/README.md

docs/internal/dev-docs-repo-audit.md
docs/internal/dev-docs-standards.md
docs/internal/dev-docs-routing-and-deployment.md
```

---

## Preferred ownership model

- `packages/api-contract` owns the public API contract.
- `apps/pricing-engine` owns handler implementation.
- `apps/api-reference` owns interactive API reference rendering.
- `docs/mintlify` owns docs IA and written documentation.
- `packages/brand-tokens` owns the semantic visual bridge.
- `packages/generated-sdks` owns generated client outputs.

Keep those boundaries clean.
