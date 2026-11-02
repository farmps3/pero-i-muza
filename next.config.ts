
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options */
  cacheComponents: true,
  partialPrefetching: true,

  allowedDevOrigins: ["192.168.1.38"],

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
