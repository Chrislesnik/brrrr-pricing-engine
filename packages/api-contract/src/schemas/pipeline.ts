import { z } from '../zod-setup';

export const PipelineItem = z
  .object({
    id: z.string(),
    heading: z.string().nullable(),
    stage: z.string().nullable(),
    updated_at: z.string().datetime(),
  })
  .openapi('PipelineItem');

export const GetPipelineQuery = z
  .object({
    view: z.string().optional(),
  })
  .openapi('GetPipelineQuery');

export const GetPipelineResponse = z
  .object({
    items: z.array(PipelineItem),
  })
  .openapi('GetPipelineResponse');
