/**
 * Step input enricher - adds API keys and credentials to step inputs
 * For test runs: fetches user's stored credentials from the database
 * For production: uses system environment variables
 */

export type CredentialSource = "user" | "system";

export type EnvVarConfig = {
  LINEAR_API_KEY?: string;
  LINEAR_TEAM_ID?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  SLACK_API_KEY?: string;
  OPENAI_API_KEY?: string;
  AI_GATEWAY_API_KEY?: string;
  DATABASE_URL?: string;
  FIRECRAWL_API_KEY?: string;
  PERPLEXITY_API_KEY?: string;
  GITHUB_TOKEN?: string;
  STRIPE_SECRET_KEY?: string;
  CLERK_SECRET_KEY?: string;
  FAL_API_KEY?: string;
  FIRECRAWL_API_KEY_ALT?: string;
  V0_API_KEY?: string;
  WEBFLOW_API_KEY?: string;
  SUPERAGENT_API_KEY?: string;
  BLOB_READ_WRITE_TOKEN?: string;
};

/**
 * Fetch stored credentials from the integration_setup table via API.
 * Maps integration types + config field names to EnvVarConfig keys.
 */
export async function fetchUserCredentials(): Promise<EnvVarConfig> {
  try {
    const res = await fetch("/api/workflow-integrations/credentials");
    if (!res.ok) return {};
    const data = await res.json();
    const creds = data.credentials as Record<string, Record<string, string>> | undefined;
    if (!creds) return {};

    // Map integration type configs to the EnvVarConfig format
    const env: EnvVarConfig = {};

    if (creds.linear) {
      env.LINEAR_API_KEY = creds.linear.apiKey;
      env.LINEAR_TEAM_ID = creds.linear.teamId;
    }
    if (creds.resend) {
      env.RESEND_API_KEY = creds.resend.apiKey;
      env.RESEND_FROM_EMAIL = creds.resend.fromEmail;
    }
    if (creds.slack) {
      env.SLACK_API_KEY = creds.slack.apiKey;
    }
    if (creds["ai-gateway"]) {
      env.AI_GATEWAY_API_KEY = creds["ai-gateway"].apiKey;
      env.OPENAI_API_KEY = creds["ai-gateway"].apiKey;
    }
    if (creds.database) {
      env.DATABASE_URL = creds.database.url;
    }
    if (creds.firecrawl) {
      env.FIRECRAWL_API_KEY = creds.firecrawl.firecrawlApiKey;
    }
    if (creds.perplexity) {
      env.PERPLEXITY_API_KEY = creds.perplexity.apiKey;
    }
    if (creds.github) {
      env.GITHUB_TOKEN = creds.github.token;
    }
    if (creds.stripe) {
      env.STRIPE_SECRET_KEY = creds.stripe.apiKey;
    }
    if (creds.clerk) {
      env.CLERK_SECRET_KEY = creds.clerk.clerkSecretKey;
    }
    if (creds.fal) {
      env.FAL_API_KEY = creds.fal.apiKey;
    }
    if (creds.v0) {
      env.V0_API_KEY = creds.v0.apiKey;
    }
    if (creds.webflow) {
      env.WEBFLOW_API_KEY = creds.webflow.apiKey;
    }
    if (creds.superagent) {
      env.SUPERAGENT_API_KEY = creds.superagent.superagentApiKey;
    }
    if (creds.blob) {
      env.BLOB_READ_WRITE_TOKEN = creds.blob.token;
    }

    return env;
  } catch {
    return {};
  }
}

/**
 * Get credentials based on source.
 * For "user" source: pass pre-fetched userEnvVars (from fetchUserCredentials).
 * For "system" source: uses process.env.
 */
export function getCredentials(
  source: CredentialSource,
  userEnvVars?: EnvVarConfig
): EnvVarConfig {
  if (source === "user" && userEnvVars) {
    return userEnvVars;
  }

  // For production, use system environment variables
  return {
    LINEAR_API_KEY: process.env.LINEAR_API_KEY,
    LINEAR_TEAM_ID: process.env.LINEAR_TEAM_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    SLACK_API_KEY: process.env.SLACK_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
  };
}

/**
 * Enrich step input with necessary credentials based on action type
 */
export function enrichStepInput(
  actionType: string,
  input: Record<string, unknown>,
  credentials: EnvVarConfig
): Record<string, unknown> {
  const enrichedInput = { ...input };

  const actionHandlers: Record<string, () => void> = {
    "Create Ticket": () => enrichLinearCredentials(enrichedInput, credentials),
    "Find Issues": () => enrichLinearCredentials(enrichedInput, credentials),
    "Send Email": () => enrichResendCredentials(enrichedInput, credentials),
    "Send Slack Message": () =>
      enrichSlackCredentials(enrichedInput, credentials),
    "Generate Text": () => enrichAICredentials(enrichedInput, credentials),
    "Generate Image": () => enrichAICredentials(enrichedInput, credentials),
    "Database Query": () =>
      enrichDatabaseCredentials(enrichedInput, credentials),
    Scrape: () => enrichFirecrawlCredentials(enrichedInput, credentials),
    Search: () => enrichFirecrawlCredentials(enrichedInput, credentials),
  };

  const handler = actionHandlers[actionType];
  if (handler) {
    handler();
  }

  return enrichedInput;
}

function enrichLinearCredentials(
  input: Record<string, unknown>,
  credentials: EnvVarConfig
): void {
  if (credentials.LINEAR_API_KEY) {
    input.apiKey = credentials.LINEAR_API_KEY;
  }
  if (credentials.LINEAR_TEAM_ID) {
    input.teamId = credentials.LINEAR_TEAM_ID;
  }
}

function enrichResendCredentials(
  input: Record<string, unknown>,
  credentials: EnvVarConfig
): void {
  if (credentials.RESEND_API_KEY) {
    input.apiKey = credentials.RESEND_API_KEY;
  }
  if (credentials.RESEND_FROM_EMAIL) {
    input.fromEmail = credentials.RESEND_FROM_EMAIL;
  }
}

function enrichSlackCredentials(
  input: Record<string, unknown>,
  credentials: EnvVarConfig
): void {
  if (credentials.SLACK_API_KEY) {
    input.apiKey = credentials.SLACK_API_KEY;
  }
}

function enrichAICredentials(
  input: Record<string, unknown>,
  credentials: EnvVarConfig
): void {
  if (credentials.AI_GATEWAY_API_KEY) {
    input.apiKey = credentials.AI_GATEWAY_API_KEY;
  }
}

function enrichDatabaseCredentials(
  input: Record<string, unknown>,
  credentials: EnvVarConfig
): void {
  if (credentials.DATABASE_URL) {
    input.databaseUrl = credentials.DATABASE_URL;
  }
}

function enrichFirecrawlCredentials(
  input: Record<string, unknown>,
  credentials: EnvVarConfig
): void {
  if (credentials.FIRECRAWL_API_KEY) {
    input.apiKey = credentials.FIRECRAWL_API_KEY;
  }
}
