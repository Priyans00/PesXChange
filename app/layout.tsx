import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Navbar } from "@/components/pesu-navbar";
import { AuthProvider } from "@/contexts/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import LenisProvider from "@/components/LenisProvider";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NODE_ENV === "production"
  ? "https://pesxchange.app"
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "PesXChange - PESU Student Marketplace",
  description: "PesXChange is a secure platform that connects PESU Academy students to buy, sell, and exchange items within the campus community.",
  keywords: ["PESU", "student marketplace", "buy sell", "campus exchange", "student community"],
  authors: [{ name: "PesXChange Team" }],
  openGraph: {
    title: "PesXChange - PESU Student Marketplace",
    description: "Secure marketplace for PESU Academy students",
    url: defaultUrl,
    siteName: "PesXChange",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Critical resource hints for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preload" href="/favicon.png"/>
        <link rel="dns-prefetch" href="//pesxchange.app" />
        <link rel="dns-prefetch" href="//localhost:3000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* Performance optimization meta tags */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <style dangerouslySetInnerHTML={{
          __html: `
            .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
            .item-card { background: white; border-radius: 0.5rem; border: 1px solid #e5e7eb; }
            .dark .item-card { background: #1f2937; border-color: #374151; }
            .skeleton { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            .item-image { width: 100%; height: 12rem; object-fit: cover; }
          `
        }} />
      </head>
      <body className="antialiased">
        <LenisProvider>
          <ErrorBoundary>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange>
                <Navbar />
                <main className="min-h-screen">
                  {children}
                </main>
              </ThemeProvider>
            </AuthProvider>
          </ErrorBoundary>
        </LenisProvider>
      </body>
    </html>
  );
}
