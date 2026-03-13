import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/settings/use-theme";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "ContractGuardAI Dashboard",
  description:
    "AI-powered contract intelligence and portfolio risk monitoring",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
