import { z } from '../zod-setup';

export const PaginationParams = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1),
    per_page: z.coerce.number().int().positive().max(100).optional().default(25),
  })
  .openapi('PaginationParams');

export const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number().int(),
    page: z.number().int(),
    per_page: z.number().int(),
  });

export const IdParam = z.string().uuid().openapi({
  description: 'Resource UUID',
  example: '550e8400-e29b-41d4-a716-446655440000',
});

export const TimestampFields = z.object({
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const SuccessResponse = z
  .object({
    ok: z.literal(true),
  })
  .openapi('SuccessResponse');
