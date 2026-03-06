import { z } from '../zod-setup';

import { PaginationParams, TimestampFields } from './common';

export const Application = z
  .object({
    id: z.string(),
    displayId: z.string().nullable(),
    appDisplayId: z.string().nullable(),
    status: z.string(),
    borrowerEntityName: z.string().nullable(),
    propertyAddress: z.string().nullable(),
    signingProgressPct: z.number().nullable(),
  })
  .merge(TimestampFields)
  .openapi('Application');

export const ListApplicationsQuery = PaginationParams.extend({
  status: z.string().optional(),
}).openapi('ListApplicationsQuery');

export const ListApplicationsResponse = z
  .object({
    items: z.array(Application),
  })
  .openapi('ListApplicationsResponse');
