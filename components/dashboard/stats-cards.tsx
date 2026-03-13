"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { differenceInDays } from "date-fns";
import { ArrowUpRight, AlertTriangle, CalendarClock, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppData } from "@/components/app/app-data-provider";

const kpiBaseClasses =
  "relative overflow-hidden rounded-3xl border border-border bg-card px-4 py-3.5";

function computeKpis(contracts: ReturnType<typeof useAppData>["contracts"]) {
  const activeContracts = contracts.filter((c) => c.status === "active");
  const renewalsIn30 = activeContracts.filter((c) => {
    if (!c.renewalDate) return false;
    const days = differenceInDays(new Date(c.renewalDate), new Date());
    return days >= 0 && days <= 30;
  }).length;

  const noticeOpen = activeContracts.filter((c) => {
    if (!c.renewalDate) return false;
    const renewal = new Date(c.renewalDate);
    const noticeStart = new Date(renewal);
    noticeStart.setDate(noticeStart.getDate() - c.noticePeriodDays);
    const now = new Date();
    return now >= noticeStart && now <= renewal;
  }).length;

  const highRisk = activeContracts.filter((c) => c.riskLevel === "high").length;

  return { activeContracts: activeContracts.length, renewalsIn30, noticeOpen, highRisk };
}

export function StatsCards() {
  const { contracts } = useAppData();
  const { activeContracts, renewalsIn30, noticeOpen, highRisk } = computeKpis(contracts);
  const { setFilters } = useDashboardStore();
  const immediateAttentionContract = [...contracts]
    .filter((contract) => contract.status === "active")
    .sort((a, b) => {
      if (b.riskScore !== a.riskScore) {
        return b.riskScore - a.riskScore;
      }

      return (
        new Date(a.nextDeadline).getTime() - new Date(b.nextDeadline).getTime()
      );
    })[0];

  const cards = [
    {
      label: "Active contracts",
      value: activeContracts,
      helper: "Across your entire portfolio",
      accent: "bg-success",
      icon: <ArrowUpRight className="h-3.5 w-3.5 text-success" />,
      onClick: () =>
        setFilters((prev) => ({
          ...prev,
          status: prev.status === "active" ? "all" : "active"
        }))
    },
    {
      label: "Renewals in 30 days",
      value: renewalsIn30,
      helper: "Prepare pricing & negotiations",
      accent: "bg-warning",
      icon: <CalendarClock className="h-3.5 w-3.5 text-warning" />,
      onClick: () =>
        setFilters((prev) => ({
          ...prev,
          onlyInRenewalWindow: !prev.onlyInRenewalWindow
        }))
    },
    {
      label: "Notice windows open",
      value: noticeOpen,
      helper: "Decision required within window",
      accent: "bg-warning",
      icon: <FileWarning className="h-3.5 w-3.5 text-warning" />,
      onClick: () =>
        setFilters((prev) => ({
          ...prev,
          onlyInRenewalWindow: !prev.onlyInRenewalWindow
        }))
    },
    {
      label: "High risk contracts",
      value: highRisk,
      helper: immediateAttentionContract
        ? `${immediateAttentionContract.name} is flagged critical`
        : "Tracked by your risk engine",
      accent: "bg-danger",
      icon: <AlertTriangle className="h-3.5 w-3.5 text-danger" />,
      onClick: () =>
        setFilters((prev) => ({
          ...prev,
          risk: prev.risk === "high" ? "all" : "high"
        }))
    }
  ];

  return (
    <section aria-label="Key portfolio metrics">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.label}
            className={cn(kpiBaseClasses, "group cursor-pointer transition-opacity hover:opacity-90")}
            role="button"
            tabIndex={0}
            onClick={card.onClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.onClick();
              }
            }}
          >
            <CardContent className="flex items-center justify-between gap-3 p-0">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span>{card.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tracking-tight text-foreground">
                    {card.value}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{card.helper}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
                  {card.icon}
                </div>
                <div className="h-8 w-0.5 rounded-full bg-border/80" />
              </div>
            </CardContent>
            <div
              className={`pointer-events-none absolute inset-y-4 left-0 w-0.5 rounded-full ${card.accent}`}
            />
          </Card>
        ))}
      </div>
    </section>
  );
}

