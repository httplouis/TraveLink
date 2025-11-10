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

  // Image configuration - optimized for production
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
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
