import { z } from '../zod-setup';

import { TimestampFields } from './common';

export const CreditReport = z
  .object({
    id: z.string(),
    borrower_id: z.string(),
    provider: z.string(),
    pulled_at: z.string().datetime(),
  })
  .merge(TimestampFields)
  .openapi('CreditReport');

export const ListCreditReportsQuery = z
  .object({
    borrowerId: z.string(),
  })
  .openapi('ListCreditReportsQuery');

export const ListCreditReportsResponse = z
  .object({
    documents: z.array(CreditReport),
  })
  .openapi('ListCreditReportsResponse');
