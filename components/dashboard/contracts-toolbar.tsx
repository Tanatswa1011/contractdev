import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { useDashboardStore, useFilteredContracts } from "@/store/use-dashboard-store";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export function ContractsToolbar() {
  const { filters, contracts, viewMode, setFilters, setViewMode } = useDashboardStore();
  const filteredContracts = useFilteredContracts();

  const vendors = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.vendor))).sort(),
    [contracts]
  );

  return (
    <section aria-label="Search and filter contracts">
      <Card className="border border-border bg-card">
        <CardContent className="flex flex-col gap-3.5 p-4 md:gap-4 md:px-5">
          {/* Search (left) */}
          <div className="flex items-center gap-2.5 md:flex-1">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="h-9 rounded-xl border-border bg-secondary pl-9 text-xs"
              />
            </div>
            <span className="hidden text-[11px] text-muted-foreground md:inline">
              {filteredContracts.length} of {contracts.length} contracts
            </span>
          </div>
          {/* Filters (center) and view toggle (right) */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 md:flex-1 md:justify-center">
              <Chip
                active={filters.status !== "all"}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    status: prev.status === "all" ? "active" : "all"
                  }))
                }
              >
                Status: {filters.status === "all" ? "All" : "Active"}
              </Chip>
              <Chip
                active={filters.vendor !== "all"}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    vendor: prev.vendor === "all" ? vendors[0] ?? "all" : "all"
                  }))
                }
              >
                Vendor:{" "}
                {filters.vendor === "all"
                  ? "All"
                  : filters.vendor.length > 16
                  ? filters.vendor.slice(0, 16) + "…"
                  : filters.vendor}
              </Chip>
              <Chip
                active={filters.risk !== "all"}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    risk: prev.risk === "all" ? "high" : "all"
                  }))
                }
              >
                Risk:{" "}
                {filters.risk === "all"
                  ? "All"
                  : filters.risk === "low"
                  ? "Low"
                  : filters.risk === "medium"
                  ? "Medium"
                  : "High"}
              </Chip>
              <Chip
                active={filters.onlyInRenewalWindow}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    onlyInRenewalWindow: !prev.onlyInRenewalWindow
                  }))
                }
              >
                Active renewal window
              </Chip>
            </div>
            <div className="flex items-center gap-2 md:justify-end">
              <Chip
                active={viewMode === "table"}
                onClick={() => setViewMode("table")}
                className="px-2.5"
              >
                Table
              </Chip>
              <Chip
                active={viewMode === "timeline"}
                onClick={() => setViewMode("timeline")}
                className="px-2.5"
              >
                Timeline
              </Chip>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

