"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, UploadCloud, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16 lg:px-10">
      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
        <div>
          <span className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            Contract intelligence for active portfolios
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            ContractGuardAI
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Keep every contract, renewal deadline, and risk signal in one workspace so legal,
            finance, and operations can act before deadlines become escalations.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
        <Card className="border border-border bg-card">
          <CardHeader className="flex-col items-start gap-2 pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">
              Built for the product you already see
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              The current interface focuses on the most useful contract operations first.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="font-medium text-foreground">Portfolio overview</p>
              <p className="mt-1">
                Review high-risk agreements, notice windows, and the contracts that need action now.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="font-medium text-foreground">Contract workspace</p>
              <p className="mt-1">
                Upload files, review versions, export details, and keep key metadata attached to each contract.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={<UploadCloud className="h-4 w-4" />}
          title="Upload and organize contracts"
          description="Create contracts from the intake form, attach the latest file, and keep version history on the detail page."
        />
        <FeatureCard
          icon={<BellRing className="h-4 w-4" />}
          title="Schedule reminders early"
          description="Create renewal reminders from the dashboard or a contract detail so owners get the next action in time."
        />
        <FeatureCard
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Save workspace settings"
          description="Persist notification preferences, AI defaults, integrations state, billing contacts, and member invites in one place."
        />
      </section>

      <section className="mt-12 rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">What this product is for</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          ContractGuardAI helps teams manage the operational side of contract work: seeing what is
          active, knowing which agreements are high risk, storing the current version, and taking
          the next step from a single dashboard without changing the existing design system.
        </p>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="space-y-3 p-5">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-muted text-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
