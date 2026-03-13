"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/settings/use-theme";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Contracts", href: "/contracts" },
  { label: "Settings", href: "/settings" },
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
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4 md:h-14 md:px-8 lg:px-10">
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
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
        </div>
        <nav className="flex items-center gap-2 text-[11px]">
          <div className="hidden items-center gap-1.5 rounded-full bg-muted px-1.5 py-0.5 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-full px-2 py-1",
                  pathname === item.href
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <ThemeToggle />
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-full px-3 text-[11px]"
              onClick={handleLogout}
            >
              Logout
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-full px-3 text-[11px]"
              asChild
            >
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
