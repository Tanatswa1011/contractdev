'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDashboardStore, useFilteredContracts, useSelectedContract } from "@/store/use-dashboard-store";
import { StatsCards } from "./stats-cards";
import { ImmediateAttentionCard } from "./immediate-attention-card";
import { ContractsToolbar } from "./contracts-toolbar";
import { RiskOverviewCard } from "./risk-overview-card";
import { ContractsSection } from "./contracts-section";
import { RecentActivityCard } from "./recent-activity-card";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { loadContracts } from "@/lib/contracts-repository";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

export function DashboardShell() {
  const setContracts = useDashboardStore((state) => state.setContracts);
  const totalContracts = useDashboardStore((state) => state.contracts.length);
  const filteredContracts = useFilteredContracts();
  const selectedContract = useSelectedContract();
  const [isLoading, setIsLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadContracts()
      .then((result) => {
        if (!isMounted) return;
        setContracts(result.contracts);
        if (result.warning) {
          setBanner(`Unable to load contracts from Supabase: ${result.warning}`);
        } else if (result.source === "demo") {
          setBanner(
            "Supabase is not configured or no session was found. Showing local demo contract data."
          );
        } else {
          setBanner(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setContracts]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:gap-7 xl:gap-8">
      {banner && (
        <Card className="border border-border bg-card">
          <CardContent className="py-3 text-xs text-muted-foreground">{banner}</CardContent>
        </Card>
      )}

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
          <div className="hidden items-center gap-2 md:flex text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Monitoring {filteredContracts.length} active contracts</span>
          </div>
        </div>
      </motion.header>

      {!isLoading && totalContracts === 0 ? (
        <Card className="border border-border bg-card">
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <p className="text-sm font-medium text-foreground">No contracts yet</p>
            <p className="text-xs text-muted-foreground">
              Add your first contract to start tracking renewals and risk trends in the dashboard.
            </p>
            <Button asChild>
              <Link href="/contracts">Go to contracts</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

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

