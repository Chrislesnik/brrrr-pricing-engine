## Local setup (Mac, zsh)

1) Create `.env.local` in the project root with your dev keys:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
# Only needed if you call the Clerk webhook route:
CLERK_WEBHOOK_SECRET=whsec_xxx

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# Server-only key (do NOT expose publicly)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

2) Install dependencies and run the dev server (http://localhost:3000):

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm run dev
```

Notes:
- The app uses Clerk and Supabase. Ensure your dev keys are valid and Clerk has `http://localhost:3000` allowed.
- Only use `SUPABASE_SERVICE_ROLE_KEY` on the server; the app does not use a public anon client.
- Restart the dev server after changing env vars.


