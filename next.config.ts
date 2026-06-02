import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3", "@anthropic-ai/claude-agent-sdk"],
  experimental: {
    // ADR-009: Next.js 16.2.6 + React 19 prerender crash on /_global-error.
    // dynamic="force-dynamic" is ignored for convention files in this version.
    // allowDevelopmentBuild bundles React in dev mode (which initializes the
    // dispatcher correctly during prerender). Safe because this is a local-only
    // dev tool; the `build` script pins NODE_ENV=development explicitly (ADR-010
    // / #200) so an ambient NODE_ENV=production can't silently defeat this.
    // prerenderEarlyExit:false is the fallback if the prerender still fails.
    allowDevelopmentBuild: true,
    prerenderEarlyExit: false,
  },
};

export default nextConfig;
