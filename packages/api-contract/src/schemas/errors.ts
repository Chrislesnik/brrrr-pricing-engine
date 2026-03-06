import { z } from '../zod-setup.js';

export const ErrorResponse = z
  .object({
    error: z.string(),
    message: z.string(),
    statusCode: z.number().int(),
  })
  .openapi('ErrorResponse');

export const ValidationErrorDetail = z.object({
  field: z.string(),
  message: z.string(),
});

export const ValidationErrorResponse = z
  .object({
    error: z.literal('Validation Error'),
    message: z.string(),
    statusCode: z.literal(422),
    details: z.array(ValidationErrorDetail),
  })
  .openapi('ValidationErrorResponse');
