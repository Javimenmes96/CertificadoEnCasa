import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/leads",
          destination: "/api/leads-with-cancellation",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
