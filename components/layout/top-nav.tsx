"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/settings/use-theme";
import { createClient } from "@/lib/supabase";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Contracts", href: "/contracts" },
  { label: "Settings", href: "/settings" }
];

function ThemeToggle() {
  const [isDark, setDark] = useTheme();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="hidden h-7 w-8 items-center justify-center rounded-full p-0 sm:inline-flex"
      onClick={() => setDark(!isDark)}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase not configured — still redirect
    }
    router.push("/login");
    router.refresh();
>>>>>>> main
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4 md:h-14 md:px-8 lg:px-10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-[11px] font-semibold tracking-tight">
            CG
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-xs font-medium text-foreground">
              ContractGuardAI
            </span>
            <span className="text-[11px] text-muted-foreground">
              Contracts &amp; risk
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-[11px]">
          <div className="hidden items-center gap-1.5 rounded-full bg-muted px-1.5 py-0.5 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-full px-2 py-1",
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-full px-3 text-[11px] gap-1.5"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut className="h-3 w-3" />
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
