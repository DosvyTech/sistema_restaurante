import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output:
    process.env.NEXT_DEPLOYMENT_OUTPUT === "standalone"
      ? "standalone"
      : undefined,
};

export default nextConfig;
