import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure headers including CSP
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: isDev
              ? // Development CSP - permissive for HMR and dev tools
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data:; " +
                "connect-src 'self' https://pesu-auth.onrender.com https://*.supabase.co ws://localhost:* wss://localhost:*; " +
                "frame-ancestors 'none'; " +
                "object-src 'none'; " +
                "base-uri 'self';"
              : // Production CSP - more restrictive but compatible
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel-analytics.com https://*.vercel-insights.com; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "img-src 'self' data: https: blob:; " +
                "font-src 'self' data: https://fonts.gstatic.com; " +
                "connect-src 'self' https://pesu-auth.onrender.com https://*.supabase.co wss: https://*.vercel-analytics.com https://*.vercel-insights.com; " +
                "frame-ancestors 'none'; " +
                "object-src 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self';"
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
