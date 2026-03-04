# Monorepo Structure Sync Complete

## ✅ Successfully Synced from UOL Worktree

**Branch:** `sync/monorepo-from-uol`
**Location:** `/Users/aaronkraut/supabase_apps/brrrr-pricing-engine`
**Source:** `/Users/aaronkraut/.cursor/worktrees/brrrr-pricing-engine/uol`

## Structure Now in Place

```
/Users/aaronkraut/supabase_apps/brrrr-pricing-engine/
├── apps/                        ✅ NEW
│   ├── pricing-engine/          ✅ Migrated
│   │   ├── src/app/
│   │   │   ├── (auth)/
│   │   │   ├── (errors)/
│   │   │   ├── (pricing-engine)/  ← Renamed from (dashboard)
│   │   │   │   ├── ai-agent/
│   │   │   │   ├── applicants/
│   │   │   │   ├── applications/
│   │   │   │   ├── brokers/
│   │   │   │   ├── contacts/      ← NEW (from uol)
│   │   │   │   ├── pipeline/
│   │   │   │   ├── pricing/
│   │   │   │   ├── settings/
│   │   │   │   └── users/
│   │   │   └── api/
│   │   ├── ai-chatbot/
│   │   └── supabase/
│   ├── resources/               ✅ NEW
│   └── docs/                    ✅ NEW
├── packages/                    ✅ NEW
│   ├── ui/
│   ├── lib/
│   ├── database/
│   ├── env/
│   ├── test-utils/
│   └── config packages
├── turbo.json                   ✅ NEW
├── pnpm-workspace.yaml          ✅ NEW
└── package.json                 ✅ Updated
```

## What Was Done

### 1. Copied Monorepo Structure
- ✅ Copied root files (turbo.json, pnpm-workspace.yaml, package.json)
- ✅ Copied all 8 shared packages
- ✅ Created apps/ folder
- ✅ Moved src/ → apps/pricing-engine/src/
- ✅ Copied resources and docs app scaffolds

### 2. Route Group Refactoring
- ✅ Renamed (dashboard) → (pricing-engine)
- ✅ Updated all @/app/(dashboard) imports to @/app/(pricing-engine)
- ✅ Contacts page from uol included

### 3. Import Updates
- ✅ Updated @/lib/utils → @repo/lib/cn
- ✅ Updated @/components/ui/* → @repo/ui/shadcn/*
- ✅ Updated custom components → @repo/ui/custom/*
- ✅ Updated providers → @repo/ui/providers/*
- ✅ Updated lib utilities → @repo/lib/*

### 4. Configuration
- ✅ Copied environment variables to apps
- ✅ Archived iOS files
- ✅ Removed old root config files
- ✅ Updated .gitignore and README

### 5. Dependencies
- ✅ Installed all workspace dependencies (782 packages)
- ✅ Peer dependency warnings (expected with React 19)

## Build Status

**Working:**
- ✅ resources app: Builds in ~6s
- ✅ docs app: Builds in ~5s

**Needs Fix:**
- ⚠️ pricing-engine app: Next.js workspace root resolution issue
  - Error: Can't find next/package.json from src/app directory
  - Next.js is installed correctly via pnpm workspace
  - Likely needs turbopack.root configuration adjustment

## Next Steps

### 1. Fix pricing-engine Build Issue

The pricing-engine app can't resolve Next.js. Try:

```typescript
// apps/pricing-engine/next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
    turbo: {
      root: path.resolve(__dirname, "../.."),
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
    domains: ["ui.shadcn.com"],
  },
};

export default nextConfig;
```

### 2. BaseHub Integration (Now Possible!)

**For resources app:**
1. Fork: https://github.com/basehub-ai/nextjs-docs-template
2. Create BaseHub repo: "Lender Resources"
3. Get BASEHUB_TOKEN
4. Add to `apps/resources/.env.local`
5. Update scripts in package.json:
   ```json
   "dev": "basehub dev & next dev --port 3001",
   "build": "basehub && next build"
   ```
6. Install: `cd apps/resources && pnpm add basehub`

**For docs app:**
- Same steps, separate BaseHub repo: "Developer Documentation"
- Different BASEHUB_TOKEN

### 3. Test Development

Once pricing-engine build is fixed:
```bash
pnpm dev
```

Visit:
- http://localhost:3000 (pricing-engine)
- http://localhost:3001 (resources)
- http://localhost:3002 (docs)

## File Structure Now Visible in IDE

You should now see in your file navigator:
- `apps/` folder with 3 apps
- `packages/` folder with shared code
- `turbo.json` at root
- `pnpm-workspace.yaml` at root

**Reload your Cursor window if you don't see the new structure yet!**

## Summary

✅ Monorepo structure successfully synced
✅ Route groups renamed
✅ 2/3 apps building
⚠️ 1 app needs Next.js config fix
✅ BaseHub apps ready for integration
✅ All code and dependencies in place

The structure is now aligned between the uol worktree and your main project location!
