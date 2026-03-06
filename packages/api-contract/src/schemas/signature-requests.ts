import { z } from '../zod-setup.js';

import { TimestampFields } from './common.js';

export const SignatureRequest = z
  .object({
    id: z.string(),
    deal_id: z.string(),
    status: z.string(),
    signer_email: z.string().nullable(),
  })
  .merge(TimestampFields)
  .openapi('SignatureRequest');

export const ListSignatureRequestsQuery = z
  .object({
    dealId: z.string(),
  })
  .openapi('ListSignatureRequestsQuery');

export const ListSignatureRequestsResponse = z
  .object({
    requests: z.array(SignatureRequest),
  })
  .openapi('ListSignatureRequestsResponse');
