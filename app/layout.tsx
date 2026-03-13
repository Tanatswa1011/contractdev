import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";
import { ThemeProvider } from "@/components/settings/use-theme";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppDataProvider } from "@/components/app/app-data-provider";

export const metadata: Metadata = {
  title: "ContractGuardAI Dashboard",
  description: "AI-powered contract intelligence and portfolio risk monitoring"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <AppDataProvider>
              <TopNav />
              <div className="min-h-screen bg-background">{children}</div>
            </AppDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

