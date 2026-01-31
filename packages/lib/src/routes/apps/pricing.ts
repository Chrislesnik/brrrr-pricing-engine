/**
 * Pricing Engine Route Tree
 *
 * All routes for the pricing-engine application.
 * Route functions return canonical paths (no query/hash).
 *
 * RULE: Route trees export functions, not strings.
 * - pricingRoutes.pipeline() ✅
 * - pricingRoutes.pipeline ❌
 */

import { buildPath, qs, type QueryParams } from "../path";

// ============================================================================
// Route Segments
// ============================================================================

/**
 * Route segment constants for building paths
 */
export const PRICING_SEGMENTS = {
  dashboard: "dashboard",
  pipeline: "pipeline",
  applications: "applications",
  applicants: "applicants",
  borrowers: "borrowers",
  entities: "entities",
  brokers: "brokers",
  aiAgent: "ai-agent",
  pricing: "pricing",
  settings: "settings",
  integrations: "integrations",
  company: "company",
  programs: "programs",
  profile: "profile",
  notifications: "notifications",
  billing: "billing",
  plans: "plans",
  users: "users",
  org: "org",
} as const;

// ============================================================================
// Pricing Engine Routes
// ============================================================================

/**
 * Pricing engine route tree.
 * All route methods return canonical paths.
 */
export const pricingRoutes = {
  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------

  /**
   * Main dashboard page
   * @returns /dashboard
   */
  dashboard: () => `/${PRICING_SEGMENTS.dashboard}`,

  /**
   * Root path (redirects to dashboard or pipeline)
   * @returns /
   */
  root: () => "/",

  // -------------------------------------------------------------------------
  // Pipeline
  // -------------------------------------------------------------------------

  /**
   * Pipeline overview
   * @returns /pipeline
   */
  pipeline: () => `/${PRICING_SEGMENTS.pipeline}`,

  // -------------------------------------------------------------------------
  // Applications (Loan Setup)
  // -------------------------------------------------------------------------

  /**
   * Applications list
   * @returns /applications
   */
  applications: () => `/${PRICING_SEGMENTS.applications}`,

  /**
   * Single application detail
   * @param loanId - The loan/application ID
   * @returns /applications/[loanId]
   */
  application: (loanId: string) =>
    buildPath(`/${PRICING_SEGMENTS.applications}/[loanId]`, { loanId }),

  // -------------------------------------------------------------------------
  // Applicants
  // -------------------------------------------------------------------------

  applicants: {
    /**
     * Borrowers list
     * @returns /applicants/borrowers
     */
    borrowers: () =>
      `/${PRICING_SEGMENTS.applicants}/${PRICING_SEGMENTS.borrowers}`,

    /**
     * Single borrower detail
     * @param borrowerId - The borrower ID
     * @returns /applicants/borrowers/[borrowerId]
     */
    borrower: (borrowerId: string) =>
      buildPath(
        `/${PRICING_SEGMENTS.applicants}/${PRICING_SEGMENTS.borrowers}/[borrowerId]`,
        { borrowerId }
      ),

    /**
     * Entities list
     * @returns /applicants/entities
     */
    entities: () =>
      `/${PRICING_SEGMENTS.applicants}/${PRICING_SEGMENTS.entities}`,

    /**
     * Single entity detail
     * @param entityId - The entity ID
     * @returns /applicants/entities/[entityId]
     */
    entity: (entityId: string) =>
      buildPath(
        `/${PRICING_SEGMENTS.applicants}/${PRICING_SEGMENTS.entities}/[entityId]`,
        { entityId }
      ),
  },

  // -------------------------------------------------------------------------
  // Brokers
  // -------------------------------------------------------------------------

  /**
   * Brokers list
   * @returns /brokers
   */
  brokers: () => `/${PRICING_SEGMENTS.brokers}`,

  /**
   * Single broker detail
   * @param brokerId - The broker ID
   * @returns /brokers/[brokerId]
   */
  broker: (brokerId: string) =>
    buildPath(`/${PRICING_SEGMENTS.brokers}/[brokerId]`, { brokerId }),

  // -------------------------------------------------------------------------
  // AI Agent
  // -------------------------------------------------------------------------

  /**
   * AI agent page
   * @returns /ai-agent
   */
  aiAgent: () => `/${PRICING_SEGMENTS.aiAgent}`,

  // -------------------------------------------------------------------------
  // Pricing
  // -------------------------------------------------------------------------

  /**
   * Pricing page
   * @returns /pricing
   */
  pricing: () => `/${PRICING_SEGMENTS.pricing}`,

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------

  settings: {
    /**
     * Settings root / Programs
     * @returns /settings
     */
    root: () => `/${PRICING_SEGMENTS.settings}`,

    /**
     * Programs settings
     * @returns /settings
     */
    programs: () => `/${PRICING_SEGMENTS.settings}`,

    /**
     * Integrations settings
     * @returns /settings/integrations
     */
    integrations: () =>
      `/${PRICING_SEGMENTS.settings}/${PRICING_SEGMENTS.integrations}`,

    /**
     * Company settings (broker-specific)
     * @returns /settings/company
     */
    company: () =>
      `/${PRICING_SEGMENTS.settings}/${PRICING_SEGMENTS.company}`,

    /**
     * Profile settings
     * @returns /settings/profile
     */
    profile: () =>
      `/${PRICING_SEGMENTS.settings}/${PRICING_SEGMENTS.profile}`,

    /**
     * Notifications settings
     * @returns /settings/notifications
     */
    notifications: () =>
      `/${PRICING_SEGMENTS.settings}/${PRICING_SEGMENTS.notifications}`,

    /**
     * Billing settings
     * @returns /settings/billing
     */
    billing: () =>
      `/${PRICING_SEGMENTS.settings}/${PRICING_SEGMENTS.billing}`,

    /**
     * Plans settings
     * @returns /settings/plans
     */
    plans: () =>
      `/${PRICING_SEGMENTS.settings}/${PRICING_SEGMENTS.plans}`,
  },

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------

  /**
   * Users list
   * @returns /users
   */
  users: () => `/${PRICING_SEGMENTS.users}`,

  /**
   * Single user detail
   * @param userId - The user ID
   * @returns /users/[userId]
   */
  user: (userId: string) =>
    buildPath(`/${PRICING_SEGMENTS.users}/[userId]`, { userId }),

  // -------------------------------------------------------------------------
  // Organization
  // -------------------------------------------------------------------------

  org: {
    /**
     * Organization settings
     * @param orgId - The organization ID
     * @returns /org/[orgId]/settings
     */
    settings: (orgId: string) =>
      buildPath(`/${PRICING_SEGMENTS.org}/[orgId]/${PRICING_SEGMENTS.settings}`, {
        orgId,
      }),
  },

  // -------------------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------------------

  api: {
    /**
     * Pipeline API
     * @returns /api/pipeline
     */
    pipeline: () => "/api/pipeline",

    /**
     * Loans API
     */
    loans: {
      list: () => "/api/pipeline",
      detail: (loanId: string) =>
        buildPath("/api/loans/[id]", { id: loanId }),
      activity: (loanId: string) =>
        buildPath("/api/loans/[id]/activity", { id: loanId }),
      assignees: (loanId: string) =>
        buildPath("/api/loans/[id]/assignees", { id: loanId }),
      scenarios: (loanId: string) =>
        buildPath("/api/loans/[id]/scenarios", { id: loanId }),
    },

    /**
     * Applications API
     */
    applications: {
      list: () => "/api/applications/list",
      detail: (loanId: string) =>
        buildPath("/api/applications/[loanId]", { loanId }),
      entity: (loanId: string) =>
        buildPath("/api/applications/[loanId]/entity", { loanId }),
      guarantors: (loanId: string) =>
        buildPath("/api/applications/[loanId]/guarantors", { loanId }),
    },

    /**
     * Borrowers API
     */
    borrowers: {
      list: () => "/api/applicants/borrowers/list",
      create: () => "/api/applicants/borrowers",
      detail: (borrowerId: string) =>
        buildPath("/api/applicants/borrowers/[id]", { id: borrowerId }),
      assignees: (borrowerId: string) =>
        buildPath("/api/applicants/borrowers/[id]/assignees", { id: borrowerId }),
    },

    /**
     * Entities API
     */
    entities: {
      list: () => "/api/applicants/entities/list",
      create: () => "/api/applicants/entities",
      detail: (entityId: string) =>
        buildPath("/api/applicants/entities/[id]", { id: entityId }),
      assignees: (entityId: string) =>
        buildPath("/api/applicants/entities/[id]/assignees", { id: entityId }),
      owners: (entityId: string) =>
        buildPath("/api/applicants/entities/[id]/owners", { id: entityId }),
    },

    /**
     * Brokers API
     */
    brokers: {
      defaultSettings: () => "/api/brokers/default-settings",
      customSettings: (brokerId: string) =>
        buildPath("/api/brokers/[id]/custom-settings", { id: brokerId }),
      status: (brokerId: string) =>
        buildPath("/api/brokers/[id]/status", { id: brokerId }),
    },

    /**
     * AI API
     */
    ai: {
      chat: () => "/api/ai/chat",
      send: () => "/api/ai/send",
      chats: {
        list: () => "/api/ai/chats",
        detail: (chatId: string) =>
          buildPath("/api/ai/chats/[id]", { id: chatId }),
        messages: (chatId: string) =>
          buildPath("/api/ai/chats/[id]/messages", { id: chatId }),
      },
    },

    /**
     * Organization API
     */
    org: {
      members: () => "/api/org/members",
      programs: () => "/api/org/programs",
      companyBranding: () => "/api/org/company-branding",
    },

    /**
     * Pricing API
     */
    pricing: {
      dispatch: () => "/api/pricing/dispatch",
      dispatchOne: () => "/api/pricing/dispatch-one",
      programs: () => "/api/pricing/programs",
      scenario: () => "/api/pricing/scenario",
    },

    /**
     * Scenarios API
     */
    scenarios: {
      detail: (scenarioId: string) =>
        buildPath("/api/scenarios/[id]", { id: scenarioId }),
      setPrimary: (scenarioId: string) =>
        buildPath("/api/scenarios/[id]/primary", { id: scenarioId }),
    },

    /**
     * Integrations API
     */
    integrations: {
      list: () => "/api/integrations",
      floify: () => "/api/integrations/floify",
      clear: () => "/api/integrations/clear",
      nadlan: () => "/api/integrations/nadlan",
      xactus: () => "/api/integrations/xactus",
    },

    /**
     * Credit Reports API
     */
    creditReports: {
      list: () => "/api/credit-reports",
      chat: (reportId: string) =>
        buildPath("/api/credit-reports/[reportId]/chat", { reportId }),
      chatId: (reportId: string) =>
        buildPath("/api/credit-reports/[reportId]/chat-id", { reportId }),
      messages: (reportId: string) =>
        buildPath("/api/credit-reports/[reportId]/chat/messages", { reportId }),
    },

    /**
     * Programs API
     */
    programs: {
      documents: (programId: string) =>
        buildPath("/api/programs/[id]/documents", { id: programId }),
      documentUrl: (programId: string) =>
        buildPath("/api/programs/[id]/documents/url", { id: programId }),
    },

    /**
     * Term Sheet API
     */
    termSheet: {
      generate: () => "/api/activity/term-sheet",
      download: () => "/api/activity/term-sheet/download",
    },

    /**
     * Credit API
     */
    credit: {
      run: () => "/api/credit/run",
    },
  },
} as const;

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Builds a URL with query parameters for the pricing engine.
 * Use when you need to add filters or other query params.
 *
 * @example
 * pricingUrl(pricingRoutes.applications(), { status: 'pending' })
 * // '/applications?status=pending'
 */
export function pricingUrl(path: string, query?: QueryParams): string {
  if (!query) return path;
  return path + qs(query);
}
