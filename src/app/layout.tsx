import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CoLLM Platform — Collaborative LLM for Recommendation",
  description: "Production-grade research platform for CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation (arXiv:2310.19488v3)",
  keywords: ["CoLLM", "LLM Recommendation", "Collaborative Filtering", "Matrix Factorization", "LightGCN", "SASRec", "DIN", "ML Research"],
  authors: [{ name: "CoLLM Research Team — USTC" }],
  openGraph: {
    title: "CoLLM Platform",
    description: "Full-stack ML research platform for Collaborative LLM Recommendation",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <SessionProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <QueryProvider>
              {children}
              <Toaster richColors position="top-right" />
            </QueryProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
