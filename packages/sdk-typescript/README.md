# @repo/sdk-typescript

TypeScript SDK for the dscr.ai API.

## Usage

```typescript
import { DscrClient } from '@repo/sdk-typescript';

const client = new DscrClient({
  apiKey: 'your-api-key',
});

const deals = await client.listDeals({ status: 'active' });
```

## Regeneration

After API contract changes, regenerate the SDK:

```bash
pnpm --filter @repo/api-contract build:openapi
pnpm --filter @repo/sdk-typescript generate
```
