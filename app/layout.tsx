import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/settings/use-theme";

export const metadata: Metadata = {
  title: "ContractGuardAI — AI-Powered Contract Intelligence",
  description:
    "AI-powered contract intelligence and portfolio risk monitoring. Never miss a renewal, notice window, or risky clause again."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

