import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { Navbar } from "@/components/pesu-navbar";
import { AuthProvider } from "@/contexts/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import LenisProvider from "@/components/LenisProvider";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
