import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint during builds — linting is run separately
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TS errors from blocking production build
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ["bcryptjs", "@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
