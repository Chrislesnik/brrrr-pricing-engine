# Shadcnblocks.com - Admin Kit

A premium Shadcn admin dashboard by shadcnblocks.com

## Getting Started

Install dependencies

```bash
pnpm install
```

Start the server

```bash
pnpm run dev
```

## Google Maps Places Autocomplete

To enable address autocomplete in the Pricing Engine:

1) Create an `.env.local` file in the project root with:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

2) In Google Cloud Console, restrict the key:
- Application restrictions: HTTP referrers (web sites)
- API restrictions: Maps JavaScript API and Places API

3) Restart the dev server after adding the env.

## Tech Stack

- shadcn/ui
- TailwindCSS v4
- Next.js
- React 19
- TypeScript
- Eslint v9
- Prettier
