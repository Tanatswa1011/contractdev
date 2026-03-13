"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (!isConfigured || isLoading || !user) {
      return;
    }

    router.replace(fallbackPath);
  }, [fallbackPath, isConfigured, isLoading, router, user]);

  if (isConfigured && (isLoading || user)) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10">
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
      </main>
    );
  }

  return <>{children}</>;
}
