import path from "node:path";
import type { NextConfig } from "next";

// @zunialab/* is symlinked into ../zunia-ui while the npm scope is private.
// Turbopack refuses CSS urls that escape the project root unless the root is
// the parent checkout. Drop this once the packages are published.
const workspaceRoot = path.join(process.cwd(), "..");

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: ["@zunialab/tokens", "@zunialab/fonts"],
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
