import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Essential performance optimizations only
  compress: true, // Enable gzip compression - fixes F0 audit issue
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },

  // Minimal experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'], // Only optimize icons
  },
};

export default nextConfig;
