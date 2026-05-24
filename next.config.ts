import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev tools badge (Turbopack/Webpack) defaults to bottom-left and overlaps the sidebar collapse control.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
