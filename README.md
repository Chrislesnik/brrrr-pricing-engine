# BRRRR Pricing Engine Monorepo

A Turborepo monorepo for the BRRRR pricing engine platform.

## Apps

- **pricing-engine** (`:3000`) - Main pricing engine application with loan calculation, pipeline management, broker management, and AI agent features
- **resources** (`:3001`) - Lender resources hub powered by BaseHub (underwriting guidelines, document templates, help guides)
- **docs** (`:3002`) - Developer documentation powered by BaseHub (API docs, webhooks, technical guides)

## Packages

- **@repo/ui** - Shared UI components (shadcn/ui + custom), theme providers, global styles
- **@repo/lib** - Shared utilities (cn, filter-countries, google-maps), hooks
- **@repo/database** - Supabase types and client re-exports
- **@repo/env** - Environment variable validation with Zod
- **@repo/test-utils** - Shared Playwright utilities for E2E testing
- **@repo/eslint-config** - Shared ESLint configuration
- **@repo/typescript-config** - Shared TypeScript configuration (base, nextjs, react-library)
- **@repo/tailwind-config** - Shared Tailwind configuration with CSS variables
- **@repo/prettier-config** - Shared Prettier configuration

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 9.0.0

### Installation

Install dependencies from the root:

```bash
pnpm install
```

### Development

Run all apps in development mode:

```bash
pnpm dev
```

Run a specific app:

```bash
pnpm dev:pricing    # Pricing Engine on :3000
pnpm dev:resources  # Resources on :3001
pnpm dev:docs       # Docs on :3002
```

Or navigate to an app and run directly:

```bash
cd apps/pricing-engine
pnpm dev
```

### Building

Build all apps:

```bash
pnpm build
```

Build a specific app:

```bash
pnpm build:pricing
```

### Testing

Run E2E tests:

```bash
pnpm test:e2e
```

### Environment Variables

#### Root `.env.local` (shared variables)

Create a `.env.local` file in the root with shared Supabase, Clerk, and Turbo variables:

```bash
# Shared Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Shared Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Turbo Remote Caching
TURBO_TOKEN=
TURBO_TEAM=
```

#### App-specific environment variables

**`apps/pricing-engine/.env.local`:**

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
SVIX_TOKEN=
```

**`apps/resources/.env.local`:**

```bash
BASEHUB_TOKEN=
```

**`apps/docs/.env.local`:**

```bash
BASEHUB_TOKEN=
```

## Tech Stack

- **Turborepo** - Monorepo build system with task orchestration and caching
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v3** - Styling with CSS variables for theming
- **shadcn/ui** - Component library (multiple registries support)
- **Supabase** - Database and backend
- **Clerk** - Authentication
- **BaseHub** - Headless CMS (resources & docs apps)
- **Playwright** - E2E testing
- **Changesets** - Version management

## Project Structure

```
brrrr-pricing-engine/
├── apps/
│   ├── pricing-engine/      # Main application
│   ├── resources/            # Lender resources hub (BaseHub)
│   └── docs/                 # Developer documentation (BaseHub)
├── packages/
│   ├── ui/                   # Shared UI components
│   ├── lib/                  # Shared utilities
│   ├── database/             # Supabase integration
│   ├── env/                  # Environment validation
│   ├── test-utils/           # Testing utilities
│   ├── eslint-config/        # ESLint configuration
│   ├── typescript-config/    # TypeScript configuration
│   ├── tailwind-config/      # Tailwind configuration
│   └── prettier-config/      # Prettier configuration
├── supabase/
│   └── migrations/           # Database migrations
├── turbo.json                # Turborepo configuration
├── pnpm-workspace.yaml       # pnpm workspace definition
└── package.json              # Root package with scripts
```

## Useful Commands

```bash
# Development
pnpm dev              # Run all apps
pnpm dev:pricing      # Run pricing-engine only
pnpm dev:resources    # Run resources only
pnpm dev:docs         # Run docs only

# Building
pnpm build            # Build all apps and packages
pnpm build:pricing    # Build pricing-engine only

# Code Quality
pnpm lint             # Lint all apps
pnpm lint:fix         # Fix linting issues
pnpm format           # Check formatting
pnpm format:fix       # Fix formatting
pnpm check-types      # Type check all apps

# Testing
pnpm test:e2e         # Run E2E tests

# Maintenance
pnpm clean            # Clean build artifacts
pnpm reset            # Clean and reinstall dependencies
```

## Google Maps Places Autocomplete

To enable address autocomplete in the Pricing Engine:

1. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `apps/pricing-engine/.env.local`
2. In Google Cloud Console, restrict the key to Maps JavaScript API and Places API
3. Restart the dev server

## BaseHub Integration

The `resources` and `docs` apps use BaseHub for content management.

### Setup Steps

1. Fork the BaseHub documentation template: <https://github.com/basehub-ai/nextjs-docs-template>
2. Create separate BaseHub repos for:
   - Lender Resources (underwriting guidelines, templates, help)
   - Developer Documentation (API docs, webhooks, guides)
3. Deploy each to Vercel
4. Get `BASEHUB_TOKEN` from each repo's settings
5. Add tokens to respective app `.env.local` files
6. Run `basehub dev` for real-time content sync during development

## Deployment

Each app deploys as a separate Vercel project:

### Pricing Engine

- Build command: `cd ../.. && pnpm install && pnpm build --filter=pricing-engine`
- Root directory: `apps/pricing-engine`
- Output directory: `.next`

### Resources

- Build command: `cd ../.. && pnpm install && pnpm build --filter=resources`
- Root directory: `apps/resources`
- Output directory: `.next`

### Docs

- Build command: `cd ../.. && pnpm install && pnpm build --filter=docs`
- Root directory: `apps/docs`
- Output directory: `.next`

**Important**: Add `TURBO_TOKEN` and `TURBO_TEAM` to all Vercel projects for remote caching.

## Architecture Reference

This monorepo follows patterns from:

- <https://github.com/vercel/turborepo/tree/main/examples/basic>
- <https://github.com/Brrrr-Loans/brrrr-loans-1-app>

## License

See [LICENSE](LICENSE)
