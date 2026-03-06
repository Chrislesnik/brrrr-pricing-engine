import { z } from '../zod-setup.js';

import { TimestampFields } from './common.js';

export const BackgroundReport = z
  .object({
    id: z.string(),
    borrower_id: z.string(),
    entity_id: z.string().nullable(),
    report_type: z.string(),
    status: z.string(),
  })
  .merge(TimestampFields)
  .openapi('BackgroundReport');

export const CreateBackgroundReportRequest = z
  .object({
    borrower_id: z.string(),
    entity_id: z.string().nullable().optional(),
    report_type: z.string(),
  })
  .openapi('CreateBackgroundReportRequest');

export const CreateBackgroundReportResponse = z
  .object({
    report: z.object({
      id: z.string(),
    }),
  })
  .openapi('CreateBackgroundReportResponse');

export const ListBackgroundReportsResponse = z
  .object({
    reports: z.array(BackgroundReport),
  })
  .openapi('ListBackgroundReportsResponse');
