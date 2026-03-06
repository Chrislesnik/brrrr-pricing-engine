import { z } from '../zod-setup';

import { TimestampFields } from './common';

export const AppraisalOrder = z
  .object({
    id: z.string(),
    deal_id: z.string(),
    order_type: z.string(),
    status: z.string(),
    property_address: z.string().nullable(),
    requested_date: z.string().nullable(),
    date_due: z.string().nullable(),
  })
  .merge(TimestampFields)
  .openapi('AppraisalOrder');

export const CreateAppraisalOrderRequest = z
  .object({
    deal_id: z.string(),
    order_type: z.string(),
    property_address: z.string(),
    requested_date: z.string().optional(),
  })
  .openapi('CreateAppraisalOrderRequest');

export const CreateAppraisalOrderResponse = z
  .object({
    order: z.object({
      id: z.string(),
    }),
  })
  .openapi('CreateAppraisalOrderResponse');

export const UpdateAppraisalOrderRequest = z
  .object({
    order_status: z.string().optional(),
    date_due: z.string().optional(),
  })
  .openapi('UpdateAppraisalOrderRequest');

export const UpdateAppraisalOrderResponse = z
  .object({
    success: z.literal(true),
  })
  .openapi('UpdateAppraisalOrderResponse');

export const ListAppraisalOrdersResponse = z
  .object({
    orders: z.array(AppraisalOrder),
  })
  .openapi('ListAppraisalOrdersResponse');
