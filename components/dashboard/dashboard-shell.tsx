'use client';

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useFilteredContracts, useDashboardStore, useSelectedContract } from "@/store/use-dashboard-store";
import { StatsCards } from "./stats-cards";
import { ImmediateAttentionCard } from "./immediate-attention-card";
import { ContractsToolbar } from "./contracts-toolbar";
import { RiskOverviewCard } from "./risk-overview-card";
import { ContractsSection } from "./contracts-section";
import { RecentActivityCard } from "./recent-activity-card";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { useAppData } from "@/components/app/app-data-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

export function DashboardShell() {
  const { contracts, isReady, isRefreshing } = useAppData();
  const { setContracts } = useDashboardStore();
  const filteredContracts = useFilteredContracts();
  const selectedContract = useSelectedContract();

  useEffect(() => {
    setContracts(contracts);
  }, [contracts, setContracts]);

  if (!isReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <motion.header
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col gap-2"
        >
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              ContractGuardAI
            </h1>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              Portfolio risk, renewals, and AI-powered contract insights in one place.
            </p>
          </div>
        </motion.header>
        <Card className="border border-border bg-card">
          <CardContent className="flex flex-col items-start gap-4 px-6 py-8">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Your dashboard is ready for the first contract
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Upload a contract to populate the dashboard summary cards, recent activity, and
                contract workspace views. The rest of the interface will update automatically once
                the first contract is saved.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/contracts">Upload first contract</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/settings">Review workspace settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:gap-7 xl:gap-8">
      <motion.header
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              ContractGuardAI
            </h1>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              Portfolio risk, renewals, and AI-powered contract insights in one place.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>
              Monitoring {filteredContracts.length} contract
              {filteredContracts.length === 1 ? "" : "s"}
              {isRefreshing ? " • refreshing…" : ""}
            </span>
          </div>
        </div>
      </motion.header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-7 xl:gap-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex min-w-0 flex-1 flex-col gap-6 lg:gap-7"
        >
          <ImmediateAttentionCard />
          <StatsCards />
          <ContractsToolbar />
          <RiskOverviewCard />
          <ContractsSection />
          <RecentActivityCard />
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-1 w-full shrink-0 lg:sticky lg:top-8 lg:mt-0 lg:w-[340px] xl:w-[380px]"
        >
          <AiAssistantPanel contract={selectedContract} />
        </motion.aside>
      </div>
    </div>
  );
}

