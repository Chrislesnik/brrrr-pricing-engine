// Shared Playwright helpers and utilities
export function getBaseUrl(
  appName: "pricing-engine" | "resources" | "docs"
): string {
  const ports = {
    "pricing-engine": 3000,
    resources: 3001,
    docs: 3002,
  };
  return (
    process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${ports[appName]}`
  );
}
