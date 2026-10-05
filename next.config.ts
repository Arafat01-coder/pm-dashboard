import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Native database driver: load it from node_modules at runtime instead of bundling it.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // The Next.js dev tools button sat on top of the sidebar's Settings link.
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
