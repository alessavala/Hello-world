import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal self-contained build (server.js + only the deps it
  // needs) so the Docker production image doesn't have to ship node_modules.
  output: "standalone",
};

export default nextConfig;
