import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow multi-file uploads via server actions
      bodySizeLimit: "25mb",
    },
  },
  // Ensure Turbopack resolves the project from the correct root
  // so it can find installed packages like Radix and react-icons.
  // The `turbopack` field is not yet in NextConfig types in all versions,
  // but Next.js will read it at runtime.
  ...( {
    turbopack: {
      root: __dirname,
    },
  } as unknown as NextConfig ),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "ui.shadcn.com",
      },
    ],
  },
};

export default nextConfig;
