/**
 * Cache tag helpers for consistent cache invalidation across the monorepo.
 *
 * Standardizes cache tags to fix "stale revalidation" bugs at the source.
 * Prefer revalidateTag() for entity-based updates over revalidatePath().
 *
 * Rules:
 * - Use tags for entity-based invalidation (e.g., when a deal is updated)
 * - Use revalidatePath() only for static pages without entity dependencies
 * - Never call revalidatePath() with query strings; use tags for query-driven pages
 */

/**
 * Cache tag prefixes for different entity types
 */
export const TAG_PREFIXES = {
  deal: "deal",
  loan: "loan",
  application: "application",
  borrower: "borrower",
  entity: "entity",
  broker: "broker",
  org: "org",
  user: "user",
  program: "program",
  scenario: "scenario",
  document: "document",
  chat: "chat",
  integration: "integration",
} as const;

export type TagPrefix = (typeof TAG_PREFIXES)[keyof typeof TAG_PREFIXES];

/**
 * Generates a cache tag for a specific entity.
 *
 * @param prefix - The entity type prefix
 * @param id - The entity ID
 * @returns Formatted cache tag
 *
 * @example
 * tag('deal', '123') // 'deal:123'
 * tag('org', 'org_abc') // 'org:org_abc'
 */
export function tag(prefix: TagPrefix, id: string): string {
  return `${prefix}:${id}`;
}

/**
 * Generates a cache tag for a list/collection of entities.
 * Use this when invalidating queries that list multiple entities.
 *
 * @param prefix - The entity type prefix
 * @returns Formatted list cache tag
 *
 * @example
 * listTag('deal') // 'deal:list'
 * listTag('borrower') // 'borrower:list'
 */
export function listTag(prefix: TagPrefix): string {
  return `${prefix}:list`;
}

/**
 * Generates cache tags for an entity within an organization.
 * Returns both the entity tag and org-scoped entity list tag.
 *
 * @param prefix - The entity type prefix
 * @param id - The entity ID
 * @param orgId - The organization ID
 * @returns Array of cache tags to invalidate
 *
 * @example
 * orgEntityTags('deal', '123', 'org_abc')
 * // ['deal:123', 'deal:org:org_abc']
 */
export function orgEntityTags(prefix: TagPrefix, id: string, orgId: string): string[] {
  return [
    tag(prefix, id),
    `${prefix}:org:${orgId}`,
  ];
}

// ============================================================================
// Entity-specific tag helpers
// ============================================================================

/**
 * Cache tags for deal-related data
 */
export const dealTags = {
  /** Tag for a specific deal */
  one: (dealId: string) => tag("deal", dealId),
  /** Tag for the deals list */
  list: () => listTag("deal"),
  /** Tag for deals within an org */
  byOrg: (orgId: string) => `deal:org:${orgId}`,
  /** All tags to invalidate when a deal changes */
  invalidate: (dealId: string, orgId?: string) => {
    const tags = [tag("deal", dealId), listTag("deal")];
    if (orgId) tags.push(`deal:org:${orgId}`);
    return tags;
  },
};

/**
 * Cache tags for loan-related data
 */
export const loanTags = {
  one: (loanId: string) => tag("loan", loanId),
  list: () => listTag("loan"),
  byOrg: (orgId: string) => `loan:org:${orgId}`,
  invalidate: (loanId: string, orgId?: string) => {
    const tags = [tag("loan", loanId), listTag("loan")];
    if (orgId) tags.push(`loan:org:${orgId}`);
    return tags;
  },
};

/**
 * Cache tags for application-related data
 */
export const applicationTags = {
  one: (applicationId: string) => tag("application", applicationId),
  list: () => listTag("application"),
  byOrg: (orgId: string) => `application:org:${orgId}`,
  byLoan: (loanId: string) => `application:loan:${loanId}`,
  invalidate: (applicationId: string, orgId?: string) => {
    const tags = [tag("application", applicationId), listTag("application")];
    if (orgId) tags.push(`application:org:${orgId}`);
    return tags;
  },
};

/**
 * Cache tags for borrower-related data
 */
export const borrowerTags = {
  one: (borrowerId: string) => tag("borrower", borrowerId),
  list: () => listTag("borrower"),
  byOrg: (orgId: string) => `borrower:org:${orgId}`,
  invalidate: (borrowerId: string, orgId?: string) => {
    const tags = [tag("borrower", borrowerId), listTag("borrower")];
    if (orgId) tags.push(`borrower:org:${orgId}`);
    return tags;
  },
};

/**
 * Cache tags for entity-related data (business entities)
 */
export const entityTags = {
  one: (entityId: string) => tag("entity", entityId),
  list: () => listTag("entity"),
  byOrg: (orgId: string) => `entity:org:${orgId}`,
  invalidate: (entityId: string, orgId?: string) => {
    const tags = [tag("entity", entityId), listTag("entity")];
    if (orgId) tags.push(`entity:org:${orgId}`);
    return tags;
  },
};

/**
 * Cache tags for broker-related data
 */
export const brokerTags = {
  one: (brokerId: string) => tag("broker", brokerId),
  list: () => listTag("broker"),
  byOrg: (orgId: string) => `broker:org:${orgId}`,
  invalidate: (brokerId: string, orgId?: string) => {
    const tags = [tag("broker", brokerId), listTag("broker")];
    if (orgId) tags.push(`broker:org:${orgId}`);
    return tags;
  },
};

/**
 * Cache tags for organization-related data
 */
export const orgTags = {
  one: (orgId: string) => tag("org", orgId),
  list: () => listTag("org"),
  members: (orgId: string) => `org:${orgId}:members`,
  settings: (orgId: string) => `org:${orgId}:settings`,
  invalidate: (orgId: string) => [tag("org", orgId), listTag("org")],
};

/**
 * Cache tags for user-related data
 */
export const userTags = {
  one: (userId: string) => tag("user", userId),
  list: () => listTag("user"),
  byOrg: (orgId: string) => `user:org:${orgId}`,
  invalidate: (userId: string, orgId?: string) => {
    const tags = [tag("user", userId), listTag("user")];
    if (orgId) tags.push(`user:org:${orgId}`);
    return tags;
  },
};

/**
 * Cache tags for program-related data
 */
export const programTags = {
  one: (programId: string) => tag("program", programId),
  list: () => listTag("program"),
  byOrg: (orgId: string) => `program:org:${orgId}`,
  invalidate: (programId: string, orgId?: string) => {
    const tags = [tag("program", programId), listTag("program")];
    if (orgId) tags.push(`program:org:${orgId}`);
    return tags;
  },
};

/**
 * Cache tags for scenario-related data
 */
export const scenarioTags = {
  one: (scenarioId: string) => tag("scenario", scenarioId),
  list: () => listTag("scenario"),
  byLoan: (loanId: string) => `scenario:loan:${loanId}`,
  invalidate: (scenarioId: string, loanId?: string) => {
    const tags = [tag("scenario", scenarioId), listTag("scenario")];
    if (loanId) tags.push(`scenario:loan:${loanId}`);
    return tags;
  },
};

/**
 * Cache tags for document-related data
 */
export const documentTags = {
  one: (documentId: string) => tag("document", documentId),
  list: () => listTag("document"),
  byOrg: (orgId: string) => `document:org:${orgId}`,
  byLoan: (loanId: string) => `document:loan:${loanId}`,
  invalidate: (documentId: string, orgId?: string) => {
    const tags = [tag("document", documentId), listTag("document")];
    if (orgId) tags.push(`document:org:${orgId}`);
    return tags;
  },
};

/**
 * Cache tags for chat-related data
 */
export const chatTags = {
  one: (chatId: string) => tag("chat", chatId),
  list: () => listTag("chat"),
  byUser: (userId: string) => `chat:user:${userId}`,
  invalidate: (chatId: string, userId?: string) => {
    const tags = [tag("chat", chatId), listTag("chat")];
    if (userId) tags.push(`chat:user:${userId}`);
    return tags;
  },
};

/**
 * Cache tags for integration-related data
 */
export const integrationTags = {
  one: (integrationId: string) => tag("integration", integrationId),
  list: () => listTag("integration"),
  byOrg: (orgId: string) => `integration:org:${orgId}`,
  invalidate: (integrationId: string, orgId?: string) => {
    const tags = [tag("integration", integrationId), listTag("integration")];
    if (orgId) tags.push(`integration:org:${orgId}`);
    return tags;
  },
};

// ============================================================================
// Page-level tags
// ============================================================================

/**
 * Page-level cache tags for static pages.
 * Use sparingly; prefer entity tags for dynamic content.
 */
export const pageTags = {
  dashboard: "page:dashboard",
  pipeline: "page:pipeline",
  settings: "page:settings",
};
