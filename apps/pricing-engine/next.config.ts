import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow multi-file uploads via server actions
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
    domains: ["ui.shadcn.com"],
  },
  async rewrites() {
    return [
      {
        source: "/docs",
        destination: "http://localhost:3002/docs",
      },
      {
        source: "/docs/:path*",
        destination: "http://localhost:3002/docs/:path*",
      },
      {
        source: "/resources",
        destination: "http://localhost:3001/resources",
      },
      {
        source: "/resources/:path*",
        destination: "http://localhost:3001/resources/:path*",
      },
    ];
  },
};

export default nextConfig;
