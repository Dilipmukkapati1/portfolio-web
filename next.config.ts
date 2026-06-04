import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Required for Azure Static Web Apps hybrid Next.js deploy (.next/standalone).
  output: "standalone",
};

export default nextConfig;
