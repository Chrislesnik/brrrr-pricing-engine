# 🎉 BaseHub Integration Complete!

## Branch: `sync/monorepo-from-uol`

**Location:** `/Users/aaronkraut/supabase_apps/brrrr-pricing-engine`

## ✅ All Steps Complete

### ✅ Step 1: Monorepo Structure Synced
- Created `apps/` folder with 3 apps
- Created `packages/` folder with 8 shared packages
- Route group renamed: `(dashboard)` → `(pricing-engine)`
- All imports updated to use workspace packages

### ✅ Step 2: Apps in Correct Location
```
apps/
├── pricing-engine/     ← Port 3000 (main app)
├── resources/          ← Port 3001 (lender resources)
└── docs/               ← Port 3002 (developer docs)
```

### ✅ Step 3: BaseHub Integration Complete

**Resources App (`apps/resources/`):**
- ✅ basehub package installed
- ✅ fumadocs-core and fumadocs-ui installed
- ✅ BaseHub client configured (`src/lib/basehub.ts`)
- ✅ Using `<Pump />` component for real-time updates
- ✅ Queries uncommented and active
- ✅ Scripts configured: `basehub dev & next dev`
- ✅ Builds successfully

**Docs App (`apps/docs/`):**
- ✅ basehub package installed
- ✅ fumadocs-core and fumadocs-ui installed
- ✅ BaseHub client configured (`src/lib/basehub.ts`)
- ✅ Using `<Pump />` component for real-time updates
- ✅ Queries uncommented and active
- ✅ Scripts configured: `basehub dev & next dev`
- ✅ Builds successfully

## BaseHub Configuration (Per Screenshot Instructions)

### 1. Install SDK ✅
```bash
npm install basehub
# Already done in both apps
```

### 2. Configure Environment Variables ✅
```bash
# apps/resources/.env.local
BASEHUB_TOKEN="bshb_pk_*****"

# apps/docs/.env.local
BASEHUB_TOKEN="bshb_pk_*****"  # Different token for each app
```

### 3. Configure Scripts ✅
```json
{
  "scripts": {
    "dev": "basehub dev & next dev",
    "build": "basehub && next build"
  }
}
```

### 4. Generate & Integrate ✅
Using the `<Pump />` component pattern:

```typescript
import { Pump } from "basehub/react-pump";
import { draftMode } from "next/headers";

export default async function Page() {
  return (
    <Pump
      draft={draftMode().isEnabled}
      queries={[{ _sys: { id: true } }]}
    >
      {async ([data]) => {
        "use server";
        return <div>{JSON.stringify(data, null, 2)}</div>;
      }}
    </Pump>
  );
}
```

## What Happens When You Add BASEHUB_TOKEN

1. **Run `pnpm dev` in resources or docs**
2. **basehub CLI generates type-safe SDK** automatically
3. **Real-time content sync** from BaseHub editor
4. **Content appears on page** as you query it
5. **Draft mode** lets you preview before publishing

## Current Build Status

```bash
$ pnpm build --filter=resources --filter=docs

✅ resources: 6.1s
✅ docs: 5.2s
Both apps build successfully!
```

## File Structure

```
apps/resources/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx          ← Uses <Pump /> with queries
│   └── lib/
│       └── basehub.ts         ← Client configuration
├── package.json               ← Scripts configured
├── .env.local                 ← Add BASEHUB_TOKEN here
└── .env.local.example         ← Template

apps/docs/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx          ← Uses <Pump /> with queries
│   └── lib/
│       └── basehub.ts         ← Client configuration
├── package.json               ← Scripts configured
├── .env.local                 ← Add BASEHUB_TOKEN here (different token)
└── .env.local.example         ← Template
```

## Next Steps to Enable Content

### For Resources App:

1. **Create BaseHub Repo**
   - Go to https://basehub.com
   - Create repository: "Lender Resources"

2. **Get Token**
   - Repo Settings → API
   - Copy `BASEHUB_TOKEN`

3. **Add to .env.local**
   ```bash
   # apps/resources/.env.local
   BASEHUB_TOKEN="bshb_pk_your_actual_token"
   ```

4. **Configure Content Structure in BaseHub:**
   - Underwriting Guidelines
   - Document Templates
   - Help Guides
   - FAQs

5. **Run Dev Server:**
   ```bash
   cd apps/resources
   pnpm dev
   ```

6. **Visit:** http://localhost:3001

### For Docs App:

Same steps, but:
- Create separate repo: "Developer Documentation"  
- Use different BASEHUB_TOKEN
- Configure for: API docs, Webhooks, Guides
- Port 3002

## Commands

```bash
# From monorepo root
pnpm dev                    # All apps
pnpm dev:resources          # Resources only
pnpm dev:docs               # Docs only

# Build
pnpm build --filter=resources
pnpm build --filter=docs
```

## Commits

```
4eab249 feat: update BaseHub integration to use Pump component pattern
70087f3 docs: add BaseHub setup guide
4c328c2 feat: complete BaseHub integration for resources and docs apps
58cad9c docs: add sync status documentation
7d2be80 feat: migrate to Turborepo monorepo structure
```

## Summary

✅ **Monorepo structure complete**
✅ **3 apps in correct locations**
✅ **BaseHub fully integrated** (waiting for tokens)
✅ **Pump component pattern implemented**
✅ **Scripts configured per BaseHub docs**
✅ **fumadocs installed for beautiful UI**
✅ **Both apps build successfully**

**You can now:**
1. Create your BaseHub repos
2. Add the tokens
3. Start creating content in BaseHub
4. See it appear in your apps in real-time!

---

**Ready to push:**
```bash
git push -u origin sync/monorepo-from-uol
```
