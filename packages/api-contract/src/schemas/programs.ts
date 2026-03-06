import { z } from '../zod-setup';

import { TimestampFields } from './common';

export const Program = z
  .object({
    id: z.string(),
    loan_type: z.string(),
    internal_name: z.string(),
    status: z.string(),
  })
  .merge(TimestampFields)
  .openapi('Program');

export const ListProgramsQuery = z
  .object({
    status: z.string().optional(),
    loan_type: z.string().optional(),
  })
  .openapi('ListProgramsQuery');

export const ListProgramsResponse = z
  .object({
    programs: z.array(Program),
  })
  .openapi('ListProgramsResponse');
