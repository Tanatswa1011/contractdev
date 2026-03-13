"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { SetupRequiredState } from "@/components/app/setup-required-state";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isConfigured, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured || isLoading || user) {
      return;
    }

    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isConfigured, isLoading, pathname, router, user]);

  if (!isConfigured) {
    return (
      <SetupRequiredState
        title="Supabase configuration required"
        description="Authentication and workspace data are now wired to Supabase, so protected routes stay locked until your Supabase project is connected."
      />
    );
  }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10">
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </main>
    );
  }

  return <>{children}</>;
}
