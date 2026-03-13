"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

type SessionGateMode = "protected" | "public-only";

interface SessionGateProps {
  mode: SessionGateMode;
  children: ReactNode;
  redirectTo: string;
}

export function SessionGate({ mode, children, redirectTo }: SessionGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(!isSupabaseConfigured());
  const [isAuthed, setIsAuthed] = useState(false);
  const client = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!client) return;

    let isMounted = true;

    client.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setIsAuthed(Boolean(data.session));
      setReady(true);
    });

    const { data } = client.auth.onAuthStateChange((_, session) => {
      if (!isMounted) return;
      setIsAuthed(Boolean(session));
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (!ready) return;

    if (mode === "protected" && !isAuthed && client) {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`${redirectTo}${next}`);
      return;
    }

    if (mode === "public-only" && isAuthed && client) {
      router.replace(redirectTo);
    }
  }, [client, isAuthed, mode, pathname, ready, redirectTo, router]);

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
        <Card className="border border-border bg-card">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Checking your session...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "protected" && !isAuthed && client) return null;
  if (mode === "public-only" && isAuthed && client) return null;

  return <>{children}</>;
}
