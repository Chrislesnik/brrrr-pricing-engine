import { z } from '../zod-setup';

import { PaginationParams, TimestampFields } from './common';

export const Borrower = z
  .object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email().nullable(),
    phone: z.string().nullable(),
    fico_score: z.number().int().nullable(),
    ssn: z.string().nullable(),
    date_of_birth: z.string().nullable(),
    citizenship: z.string().nullable(),
    marital_status: z.string().nullable(),
    deal_count: z.number().int().optional(),
  })
  .merge(TimestampFields)
  .openapi('Borrower');

export const CreateBorrowerRequest = z
  .object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    fico_score: z.number().int().optional(),
    ssn: z.string().optional(),
    date_of_birth: z.string().optional(),
    citizenship: z.string().optional(),
    marital_status: z.string().optional(),
  })
  .openapi('CreateBorrowerRequest');

export const CreateBorrowerResponse = z
  .object({
    ok: z.literal(true),
    borrower: z.object({
      id: z.string(),
    }),
  })
  .openapi('CreateBorrowerResponse');

export const SearchBorrowersQuery = z
  .object({
    q: z.string().optional(),
    entityId: z.string().optional(),
    includeIds: z.string().optional(),
  })
  .openapi('SearchBorrowersQuery');

export const SearchBorrowersResponse = z
  .object({
    borrowers: z.array(Borrower),
  })
  .openapi('SearchBorrowersResponse');

export const ListBorrowersQuery = PaginationParams.openapi('ListBorrowersQuery');

export const ListBorrowersResponse = z
  .object({
    items: z.array(Borrower),
  })
  .openapi('ListBorrowersResponse');
