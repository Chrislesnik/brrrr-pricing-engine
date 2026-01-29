# Lender Resources App

A Next.js app integrated with BaseHub for managing lender resources including underwriting guidelines, document templates, and help guides.

## Setup

1. Copy `.env.local.example` to `.env.local`
2. Add your `BASEHUB_TOKEN` from your BaseHub repo
3. Run `pnpm dev` to start development server on port 3001

## BaseHub Integration

This app uses BaseHub for content management. Follow these steps to set up:

1. Fork the BaseHub documentation template: https://github.com/basehub-ai/nextjs-docs-template
2. Create a new BaseHub repo for "Lender Resources"
3. Deploy to Vercel
4. Get `BASEHUB_TOKEN` from repo settings
5. Configure content structure for underwriting guidelines, document templates, help guides

## Development

```bash
pnpm dev    # Start development server on port 3001
pnpm build  # Build for production
pnpm start  # Start production server
```
