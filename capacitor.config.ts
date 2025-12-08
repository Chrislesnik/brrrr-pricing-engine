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
        const hostname = new URL(serverUrl!).hostname;
        return {
          // Production: load your hosted Next.js site (must be HTTPS)
          url: serverUrl!,
          cleartext: false,
          allowNavigation: [hostname],
        };
      })(),
};

export default config;
