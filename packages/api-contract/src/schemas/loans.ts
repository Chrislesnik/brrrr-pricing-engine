import { z } from '../zod-setup.js';

import { PaginationParams, TimestampFields } from './common.js';

export const Loan = z
  .object({
    id: z.string(),
    displayId: z.string().nullable(),
    label: z.string().nullable(),
    deal_id: z.string().nullable(),
    status: z.string().nullable(),
    loan_amount: z.number().nullable(),
    interest_rate: z.number().nullable(),
    ltv: z.number().nullable(),
  })
  .merge(TimestampFields)
  .openapi('Loan');

export const UpdateLoanRequest = z
  .object({
    status: z.string().optional(),
    action: z.string().optional(),
    loan_amount: z.number().optional(),
    interest_rate: z.number().optional(),
    ltv: z.number().optional(),
  })
  .openapi('UpdateLoanRequest');

export const UpdateLoanResponse = z
  .object({
    ok: z.literal(true),
  })
  .openapi('UpdateLoanResponse');

export const ListLoansQuery = PaginationParams.extend({
  deal_id: z.string().optional(),
  status: z.string().optional(),
}).openapi('ListLoansQuery');

export const ListLoansResponse = z
  .array(Loan)
  .openapi('ListLoansResponse');
