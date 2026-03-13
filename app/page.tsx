"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) router.replace("/dashboard");
      });
    }
  }, [router]);
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center md:py-24">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          ContractGuardAI
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          AI-powered contract intelligence and portfolio risk monitoring. Track renewals, flag risks, and stay on top of key obligations.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="lg" className="rounded-full" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
          <Button variant="secondary" size="lg" className="rounded-full" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Product purpose */}
      <section className="border-t border-border bg-muted/30 px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-lg font-semibold text-foreground md:text-xl">
            Why ContractGuardAI?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-muted-foreground">
            Centralize your contracts, automate risk analysis, and never miss a renewal or notice deadline. 
            Our AI extracts key clauses, evaluates exposure, and surfaces the agreements that need your attention.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="border border-border bg-card">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground">Portfolio overview</h3>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  See all contracts in one place with status, risk level, and renewal dates.
                </p>
              </CardContent>
            </Card>
            <Card className="border border-border bg-card">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground">AI analysis</h3>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Automated clause extraction, risk scoring, and summary generation.
                </p>
              </CardContent>
            </Card>
            <Card className="border border-border bg-card">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground">Deadline alerts</h3>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Notifications for notice windows, renewals, and expiring contracts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
