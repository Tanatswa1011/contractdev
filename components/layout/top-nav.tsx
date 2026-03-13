"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/settings/use-theme";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Contracts", href: "/contracts" },
  { label: "Settings", href: "/settings" },
];

const isAppRoute = (path: string) =>
  path.startsWith("/dashboard") || path.startsWith("/contracts") || path.startsWith("/settings");

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
  const [session, setSession] = useState<{ user: unknown } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    }
  };

  const showAppNav = isAppRoute(pathname);
  const showAuthNav = pathname === "/" || pathname === "/login" || pathname === "/signup";

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4 md:h-14 md:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-[11px] font-semibold tracking-tight">
            CG
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-xs font-medium text-foreground">
              ContractGuardAI
            </span>
            <span className="text-[11px] text-muted-foreground">
              Contracts & risk
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-[11px]">
          {showAppNav && (
            <div className="hidden items-center gap-1.5 rounded-full bg-muted px-1.5 py-0.5 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "rounded-full px-2 py-1",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "bg-card text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          {showAuthNav && pathname === "/" && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 rounded-full px-3 text-[11px]" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button variant="primary" size="sm" className="h-7 rounded-full px-3 text-[11px]" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
          {showAuthNav && pathname === "/login" && (
            <Button variant="primary" size="sm" className="h-7 rounded-full px-3 text-[11px]" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          )}
          {showAuthNav && pathname === "/signup" && (
            <Button variant="ghost" size="sm" className="h-7 rounded-full px-3 text-[11px]" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
          <ThemeToggle />
          {showAppNav && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-full px-3 text-[11px]"
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

