"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Shield,
  Brain,
  CalendarClock,
  FileText,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-[11px] font-semibold tracking-tight">
              CG
            </div>
            <span className="text-xs font-medium text-foreground">
              ContractGuardAI
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 md:px-8">
        <section className="flex flex-col items-center gap-6 pb-16 pt-20 text-center md:pt-28">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-[11px] text-muted-foreground">
            <Shield className="h-3 w-3" />
            AI-powered contract intelligence
          </div>

          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Never miss a renewal deadline again
          </h1>

          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
            ContractGuardAI monitors your contract portfolio in real time,
            surfaces hidden risks, and gives you AI-generated insights so you
            can act before deadlines pass.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" size="lg" asChild>
              <Link href="/signup">
                Start free
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border py-16">
          <h2 className="mb-8 text-center text-lg font-semibold text-foreground">
            Everything you need to manage contract risk
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Brain className="h-5 w-5 text-muted-foreground" />}
              title="AI contract analysis"
              description="Automatically extract key clauses, flag risks, and generate plain-language summaries for every contract."
            />
            <FeatureCard
              icon={
                <CalendarClock className="h-5 w-5 text-muted-foreground" />
              }
              title="Deadline tracking"
              description="Track renewal dates, notice windows, and critical deadlines across your entire portfolio in one dashboard."
            />
            <FeatureCard
              icon={<FileText className="h-5 w-5 text-muted-foreground" />}
              title="Portfolio risk scoring"
              description="See your overall risk exposure at a glance with contract-level and portfolio-level risk scores."
            />
          </div>
        </section>

        <section className="border-t border-border py-16 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Ready to take control of your contracts?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign up in seconds — no credit card required.
          </p>
          <div className="mt-6">
            <Button variant="primary" size="lg" asChild>
              <Link href="/signup">
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-[11px] text-muted-foreground">
          &copy; {new Date().getFullYear()} ContractGuardAI. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
