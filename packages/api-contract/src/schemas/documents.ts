import { z } from '../zod-setup';

import { TimestampFields } from './common';

export const DocumentTemplate = z
  .object({
    id: z.string(),
    name: z.string(),
    html_content: z.string().nullable(),
  })
  .merge(TimestampFields)
  .openapi('DocumentTemplate');

export const CreateDocumentTemplateRequest = z
  .object({
    name: z.string(),
    html_content: z.string().optional(),
  })
  .openapi('CreateDocumentTemplateRequest');

export const CreateDocumentTemplateResponse = z
  .object({
    template: z.object({
      id: z.string(),
    }),
  })
  .openapi('CreateDocumentTemplateResponse');

export const ListDocumentTemplatesResponse = z
  .object({
    templates: z.array(DocumentTemplate),
  })
  .openapi('ListDocumentTemplatesResponse');
