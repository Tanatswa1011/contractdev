'use client';

import { motion } from "framer-motion";
import { useFilteredContracts, useSelectedContract } from "@/store/use-dashboard-store";
import { StatsCards } from "./stats-cards";
import { ImmediateAttentionCard } from "./immediate-attention-card";
import { ContractsToolbar } from "./contracts-toolbar";
import { RiskOverviewCard } from "./risk-overview-card";
import { ContractsSection } from "./contracts-section";
import { RecentActivityCard } from "./recent-activity-card";
import { AiAssistantPanel } from "./ai-assistant-panel";

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

export function DashboardShell() {
  const filteredContracts = useFilteredContracts();
  const selectedContract = useSelectedContract();

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
          <div className="hidden items-center gap-2 md:flex text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Monitoring {filteredContracts.length} active contracts</span>
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

