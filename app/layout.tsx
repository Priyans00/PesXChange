import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { Navbar } from "@/components/navbar";
import LenisProvider from "@/components/LenisProvider";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "PesXChange",
  description: "PesXChange is a platform that connects students within PESU to sell, buy, and rent items",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <LenisProvider>
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
        </LenisProvider>
      </body>
    </html>
  );
}
