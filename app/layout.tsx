import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";
import { ThemeProvider } from "@/components/settings/use-theme";

export const metadata: Metadata = {
  title: "ContractGuardAI Dashboard",
  description: "AI-powered contract intelligence and portfolio risk monitoring"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <TopNav />
          <div className="min-h-screen bg-background">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}

