import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAP_SERVER_URL;
const isDev = !serverUrl;

const config: CapacitorConfig = {
  appId: 'com.brrrr.pricingengine',
  appName: 'Brrrr Pricing Engine',
  webDir: '.next',
  server: isDev
    ? {
        // Development: load local Next.js dev server
        url: 'http://localhost:3000',
        cleartext: true,
        allowNavigation: ['localhost', '127.0.0.1'],
      }
    : (() => {
        const { hostname } = new URL(serverUrl!);
        // Include both apex and www variants to allow redirects during auth flows
        const apex = hostname.replace(/^www\./, '');
        const withWww = `www.${apex}`;
        const allow = Array.from(new Set([hostname, apex, withWww])).filter(Boolean) as string[];
        return {
          // Production: load your hosted Next.js site (must be HTTPS)
          url: serverUrl!,
          cleartext: false,
          allowNavigation: allow,
        };
      })(),
};

export default config;
