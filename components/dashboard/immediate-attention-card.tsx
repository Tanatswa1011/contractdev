"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BellRing, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useAppData } from "@/components/app/app-data-provider";

export function ImmediateAttentionCard() {
  const { contracts, createReminder } = useAppData();
  const [isSending, setIsSending] = useState(false);
  const c = [...contracts]
    .filter((contract) => contract.status === "active")
    .sort((a, b) => {
      if (b.riskScore !== a.riskScore) {
        return b.riskScore - a.riskScore;
      }

      return (
        new Date(a.nextDeadline).getTime() - new Date(b.nextDeadline).getTime()
      );
    })[0];
  if (!c) return null;

  const deadlineLabel = format(new Date(c.nextDeadline), "MMM d, yyyy");

  const handleSendReminder = async () => {
    setIsSending(true);
    try {
      await createReminder([c.id]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section aria-label="Contracts requiring immediate attention">
      <Card className="relative overflow-hidden border border-danger-bg bg-card">
        <CardContent className="relative flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:py-5">
          <div className="flex flex-1 items-start gap-3 md:gap-4">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-danger-bg text-danger ring-1 ring-danger">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-danger">
                  Requires Immediate Attention
                </h2>
                <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[10px] font-medium text-danger ring-1 ring-danger">
                  Critical renewal risk
                </span>
              </div>
              <p className="text-sm font-medium text-foreground md:text-[15px]">
                {c.name}
              </p>
              <p className="text-[11px] text-muted-foreground md:text-xs">
                Missing the notice window could auto-extend this high-value agreement
                despite open service issues.
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-foreground md:text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                  <span>
                    Notice deadline{" "}
                    <span className="font-medium text-foreground">{deadlineLabel}</span>
                  </span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div>
                  Value at risk{" "}
                  <span className="font-semibold text-foreground">
                    ${c.contractValue.toLocaleString()}
                  </span>{" "}
                  / {c.valuePeriod}
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2.5 md:w-60">
            <Button
              size="lg"
              variant="secondary"
              className="group flex w-full items-center justify-between rounded-full"
              asChild
            >
              <Link href={`/contracts/${c.slug}`}>
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View contract
                </span>
                <span className="text-[10px] text-subtle group-hover:text-primary-foreground/80">
                  Open in workspace
                </span>
              </Link>
            </Button>
            <Button
              size="md"
              variant="outline"
              className="flex w-full items-center justify-between rounded-full border-border bg-secondary text-foreground hover:border-foreground/40 hover:bg-muted"
              onClick={handleSendReminder}
              disabled={isSending}
            >
              <span className="flex items-center gap-1.5 text-[11px]">
                <BellRing className="h-3.5 w-3.5" />
                {isSending ? "Scheduling…" : "Send renewal reminder"}
              </span>
              <span className="text-[10px] text-muted-foreground">to owners</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

