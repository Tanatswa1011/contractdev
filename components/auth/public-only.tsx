"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export function PublicOnly({
  children,
  fallbackPath = "/dashboard",
}: {
  children: ReactNode;
  fallbackPath?: string;
}) {
  const { isConfigured, isLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  useEffect(() => {
    if (!isConfigured || isLoading || !user) {
      return;
    }

    router.replace(nextPath || fallbackPath);
  }, [fallbackPath, isConfigured, isLoading, nextPath, router, user]);

  if (isConfigured && (isLoading || user)) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10">
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
      </main>
    );
  }

  return <>{children}</>;
}
