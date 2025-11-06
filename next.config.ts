import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enforce React's strict mode for highlighting potential issues
  reactStrictMode: true,

  // Disable ESLint during production builds (for faster Vercel deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build (optional - can re-enable later)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image configuration - fix for local images
  images: {
    unoptimized: true, // Disable image optimization for development
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS images
      },
    ],
  },

  /* Add other config options here if needed */
};

export default nextConfig;
