"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStore, useFilteredContracts } from "@/store/use-dashboard-store";
import { ContractsTable } from "./contracts-table";
import { ContractsTimeline } from "./contracts-timeline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ContractsSection() {
  const filteredContracts = useFilteredContracts();
  const { viewMode, setViewMode, setFilters } = useDashboardStore();

  const hasContracts = filteredContracts.length > 0;

  return (
    <section aria-label="All contracts">
      <Card className="border border-border bg-card">
        <CardHeader className="flex items-center justify-between gap-3 pb-2">
          <div>
            <CardTitle className="text-[13px] font-medium text-foreground">
              All contracts{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({filteredContracts.length})
              </span>
            </CardTitle>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Click any contract to deep dive in the AI assistant.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-0.5 text-[11px] text-muted-foreground ring-1 ring-border">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "cursor-pointer rounded-full px-2 py-0.5 transition-colors",
                viewMode === "table"
                  ? "bg-btn text-btn-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={cn(
                "cursor-pointer rounded-full px-2 py-0.5 transition-colors",
                viewMode === "timeline"
                  ? "bg-btn text-btn-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Timeline
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {hasContracts ? (
            <>
              {viewMode === "table" ? (
                <ContractsTable contracts={filteredContracts} />
              ) : (
                <ContractsTimeline contracts={filteredContracts} />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary px-4 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No contracts match your filters
              </p>
              <p className="max-w-sm text-[11px] text-muted-foreground">
                Try clearing one or more filters, or broadening your search query. ContractGuardAI
                will show relevant contracts in real time as you type.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-1"
                onClick={() =>
                  setFilters(() => ({
                    search: "",
                    status: "all",
                    vendor: "all",
                    risk: "all",
                    onlyInRenewalWindow: false
                  }))
                }
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

