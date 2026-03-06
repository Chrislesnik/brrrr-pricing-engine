import { z } from '../zod-setup';

import { PaginationParams, TimestampFields } from './common';

export const Deal = z
  .object({
    id: z.string(),
    heading: z.string().nullable(),
    status: z.string().nullable(),
  })
  .merge(TimestampFields)
  .openapi('Deal');

const DealInputType = z.enum(['text', 'number', 'select', 'date', 'boolean']);

const DealInput = z.object({
  input_id: z.string(),
  input_type: DealInputType,
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

export const CreateDealRequest = z
  .object({
    deal_inputs: z.array(DealInput),
  })
  .openapi('CreateDealRequest');

export const CreateDealResponse = z
  .object({
    ok: z.literal(true),
    deal: z.object({
      id: z.string(),
    }),
  })
  .openapi('CreateDealResponse');

export const ListDealsQuery = PaginationParams.extend({
  status: z.string().optional(),
}).openapi('ListDealsQuery');

export const ListDealsResponse = z
  .object({
    deals: z.array(Deal),
  })
  .openapi('ListDealsResponse');
