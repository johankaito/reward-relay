import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  generateBuildId: async () => {
    // Vercel will override this with their own build ID in production
    return Date.now().toString();
  },
  env: {
    NEXT_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(),
  },
};

export default nextConfig;
