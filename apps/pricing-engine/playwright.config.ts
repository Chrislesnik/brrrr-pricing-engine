import { defineConfig } from "@playwright/test";
import { getBaseUrl } from "@repo/test-utils/playwright";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30 * 1000,
  retries: 0,
  use: {
    baseURL: getBaseUrl("pricing-engine"),
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "pnpm start",
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    },
  },
});
