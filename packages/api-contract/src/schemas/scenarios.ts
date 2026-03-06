import { z } from '../zod-setup';

import { TimestampFields } from './common';

export const Scenario = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    loan_id: z.string().nullable(),
    primary: z.boolean(),
  })
  .merge(TimestampFields)
  .openapi('Scenario');

export const GetScenarioResponse = z
  .object({
    scenario: Scenario,
  })
  .openapi('GetScenarioResponse');

export const UpdateScenarioRequest = z
  .object({
    name: z.string().optional(),
    inputs: z.record(z.string(), z.unknown()).optional(),
  })
  .openapi('UpdateScenarioRequest');

export const UpdateScenarioResponse = z
  .object({
    scenario: Scenario,
  })
  .openapi('UpdateScenarioResponse');

export const ArchiveScenarioQuery = z
  .object({
    action: z.enum(['restore']).optional(),
  })
  .openapi('ArchiveScenarioQuery');
