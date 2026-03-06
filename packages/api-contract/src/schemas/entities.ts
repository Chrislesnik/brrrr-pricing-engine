import { z } from '../zod-setup';

import { TimestampFields } from './common';

export const EntityType = z.enum([
  'llc',
  'corporation',
  'trust',
  'partnership',
  'sole_proprietorship',
  'other',
]);

const EntityOwner = z.object({
  borrower_id: z.string(),
  ownership_pct: z.number().min(0).max(100),
});

export const Entity = z
  .object({
    id: z.string(),
    entity_name: z.string(),
    entity_type: EntityType,
    ein: z.string().nullable(),
    state_of_formation: z.string().nullable(),
  })
  .merge(TimestampFields)
  .openapi('Entity');

export const CreateEntityRequest = z
  .object({
    entity_name: z.string(),
    entity_type: EntityType,
    ein: z.string().optional(),
    state_of_formation: z.string().optional(),
    owners: z.array(EntityOwner).optional(),
  })
  .openapi('CreateEntityRequest');

export const CreateEntityResponse = z
  .object({
    ok: z.literal(true),
    entity: z.object({
      id: z.string(),
    }),
  })
  .openapi('CreateEntityResponse');

export const SearchEntitiesQuery = z
  .object({
    q: z.string().optional(),
    includeIds: z.string().optional(),
  })
  .openapi('SearchEntitiesQuery');

export const SearchEntitiesResponse = z
  .object({
    entities: z.array(Entity),
  })
  .openapi('SearchEntitiesResponse');

export const ListEntitiesResponse = z
  .object({
    items: z.array(Entity),
    ownersMap: z.record(z.string(), z.array(EntityOwner)),
  })
  .openapi('ListEntitiesResponse');
