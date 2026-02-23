/**
 * Step registry - maps action types (labels) to executable step functions.
 * Uses explicit static imports to avoid Turbopack resolving uninstalled deps.
 */

// Step function type
export type StepFunction = (input: Record<string, unknown>) => Promise<unknown>;

// Registry of all available steps
export const stepRegistry: Record<string, StepFunction> = {
  // ── System steps ──
  "HTTP Request": async (input) =>
    (await import("./http-request")).httpRequestStep(input as never),
  "Database Query": async (input) =>
    (await import("./database-query")).databaseQueryStep(input as never),
  Condition: async (input) =>
    (await import("./condition")).conditionStep(input as never),
  "Set Fields": async (input) =>
    (await import("./set-fields")).setFieldsStep(input as never),
  Wait: async (input) =>
    (await import("./wait")).waitStep(input as never),
  Code: async (input) =>
    (await import("./code")).codeStep(input as never),
  Switch: async (input) =>
    (await import("./switch")).switchStep(input as never),
  Filter: async (input) =>
    (await import("./filter")).filterStep(input as never),
  DateTime: async (input) =>
    (await import("./date-time")).dateTimeStep(input as never),
  "Split Out": async (input) =>
    (await import("./split-out")).splitOutStep(input as never),
  Limit: async (input) =>
    (await import("./limit")).limitStep(input as never),
  Aggregate: async (input) =>
    (await import("./aggregate")).aggregateStep(input as never),
  Merge: async (input) =>
    (await import("./merge")).mergeStep(input as never),
  Sort: async (input) =>
    (await import("./sort")).sortStep(input as never),
  "Remove Duplicates": async (input) =>
    (await import("./remove-duplicates")).removeDuplicatesStep(input as never),
  "Loop Over Batches": async (input) =>
    (await import("./loop-batches")).loopBatchesStep(input as never),
  "Respond to Webhook": async (input) =>
    (await import("./respond-to-webhook")).respondToWebhookStep(input as never),

  // ── AI Gateway ──
  "Generate Text": async (input) =>
    (await import("../../plugins/ai-gateway/steps/generate-text")).generateTextStep(input as never),
  "Generate Image": async (input) =>
    (await import("../../plugins/ai-gateway/steps/generate-image")).generateImageStep(input as never),

  // ── Perplexity ──
  "Search Web": async (input) =>
    (await import("../../plugins/perplexity/steps/search")).perplexitySearchStep(input as never),
  "Ask Question": async (input) =>
    (await import("../../plugins/perplexity/steps/ask")).perplexityAskStep(input as never),
  "Research Topic": async (input) =>
    (await import("../../plugins/perplexity/steps/research")).perplexityResearchStep(input as never),

  // ── Resend ──
  "Send Email": async (input) =>
    (await import("../../plugins/resend/steps/send-email")).sendEmailStep(input as never),

  // ── Slack ──
  "Send Slack Message": async (input) =>
    (await import("../../plugins/slack/steps/send-slack-message")).sendSlackMessageStep(input as never),

  // ── Linear ──
  "Create Ticket": async (input) =>
    (await import("../../plugins/linear/steps/create-ticket")).createTicketStep(input as never),
  "Find Issues": async (input) =>
    (await import("../../plugins/linear/steps/find-issues")).findIssuesStep(input as never),

  // ── Firecrawl ──
  "Scrape URL": async (input) =>
    (await import("../../plugins/firecrawl/steps/scrape")).firecrawlScrapeStep(input as never),
  Scrape: async (input) =>
    (await import("../../plugins/firecrawl/steps/scrape")).firecrawlScrapeStep(input as never),
  Search: async (input) =>
    (await import("../../plugins/firecrawl/steps/search")).firecrawlSearchStep(input as never),

  // ── GitHub ──
  "Create Issue": async (input) =>
    (await import("../../plugins/github/steps/create-issue")).githubCreateIssueStep(input as never),
  "List Issues": async (input) =>
    (await import("../../plugins/github/steps/list-issues")).githubListIssuesStep(input as never),
  "Get Issue": async (input) =>
    (await import("../../plugins/github/steps/get-issue")).githubGetIssueStep(input as never),
  "Update Issue": async (input) =>
    (await import("../../plugins/github/steps/update-issue")).githubUpdateIssueStep(input as never),

  // ── Stripe ──
  "Create Customer": async (input) =>
    (await import("../../plugins/stripe/steps/create-customer")).createCustomerStep(input as never),
  "Get Customer": async (input) =>
    (await import("../../plugins/stripe/steps/get-customer")).getCustomerStep(input as never),
  "Create Invoice": async (input) =>
    (await import("../../plugins/stripe/steps/create-invoice")).createInvoiceStep(input as never),

  // ── Clerk ──
  "Get User": async (input) =>
    (await import("../../plugins/clerk/steps/get-user")).clerkGetUserStep(input as never),
  "Create User": async (input) =>
    (await import("../../plugins/clerk/steps/create-user")).clerkCreateUserStep(input as never),
  "Update User": async (input) =>
    (await import("../../plugins/clerk/steps/update-user")).clerkUpdateUserStep(input as never),
  "Delete User": async (input) =>
    (await import("../../plugins/clerk/steps/delete-user")).clerkDeleteUserStep(input as never),

  // ── fal.ai ──
  "Generate Video": async (input) =>
    (await import("../../plugins/fal/steps/generate-video")).falGenerateVideoStep(input as never),
  "Upscale Image": async (input) =>
    (await import("../../plugins/fal/steps/upscale-image")).falUpscaleImageStep(input as never),
  "Remove Background": async (input) =>
    (await import("../../plugins/fal/steps/remove-background")).falRemoveBackgroundStep(input as never),
  "Image to Image": async (input) =>
    (await import("../../plugins/fal/steps/image-to-image")).falImageToImageStep(input as never),

  // ── Blob ──
  "Put Blob": async (input) =>
    (await import("../../plugins/blob/steps/put")).putBlobStep(input as never),
  "List Blobs": async (input) =>
    (await import("../../plugins/blob/steps/list")).listBlobsStep(input as never),

  // ── Superagent ──
  Guard: async (input) =>
    (await import("../../plugins/superagent/steps/guard")).superagentGuardStep(input as never),
  Redact: async (input) =>
    (await import("../../plugins/superagent/steps/redact")).superagentRedactStep(input as never),

  // ── Webflow ──
  "List Sites": async (input) =>
    (await import("../../plugins/webflow/steps/list-sites")).webflowListSitesStep(input as never),
  "Get Site": async (input) =>
    (await import("../../plugins/webflow/steps/get-site")).webflowGetSiteStep(input as never),
  "Publish Site": async (input) =>
    (await import("../../plugins/webflow/steps/publish-site")).webflowPublishSiteStep(input as never),

  // ── Supabase ──
  "Get Row": async (input) =>
    (await import("../../plugins/supabase/steps/get-row")).supabaseGetRowStep(input as never),
  "Get Many": async (input) =>
    (await import("../../plugins/supabase/steps/get-many")).supabaseGetManyStep(input as never),
  "Insert Row": async (input) =>
    (await import("../../plugins/supabase/steps/insert")).supabaseInsertStep(input as never),
  "Update Rows": async (input) =>
    (await import("../../plugins/supabase/steps/update")).supabaseUpdateStep(input as never),
  "Delete Rows": async (input) =>
    (await import("../../plugins/supabase/steps/delete")).supabaseDeleteStep(input as never),
  "Call Function": async (input) =>
    (await import("../../plugins/supabase/steps/rpc")).supabaseRpcStep(input as never),
  "Raw SQL": async (input) =>
    (await import("../../plugins/supabase/steps/raw-sql")).supabaseRawSqlStep(input as never),
  Storage: async (input) =>
    (await import("../../plugins/supabase/steps/storage")).supabaseStorageStep(input as never),
  "Edge Function": async (input) =>
    (await import("../../plugins/supabase/steps/edge-function")).supabaseEdgeFunctionStep(input as never),

  // Note: v0 plugin steps (Create Chat, Send Message) excluded because v0-sdk is not installed
};

// Helper to check if a step exists
export function hasStep(actionType: string): boolean {
  return actionType in stepRegistry;
}

// Helper to get a step function
export function getStep(actionType: string): StepFunction | undefined {
  return stepRegistry[actionType];
}
