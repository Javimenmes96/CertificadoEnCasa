import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/leads",
        destination: "/api/leads-with-cancellation",
      },
    ];
  },
};

export default nextConfig;
