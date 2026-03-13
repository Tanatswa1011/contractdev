"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink, Filter, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/components/app/app-data-provider";
import { exportContractsCsv } from "@/lib/app-data";
import { Contract } from "@/types/contract";

const PAGE_SIZE = 25;
const quickFilters = ["All", "Active", "Expiring soon", "High risk"] as const;
const sortOptions = ["next-deadline", "risk-score", "name"] as const;

type QuickFilter = (typeof quickFilters)[number];
type SortOption = (typeof sortOptions)[number];

export function ContractsPage() {
  const router = useRouter();
  const {
    contracts,
    isReady,
    createReminder,
    assignOwner,
    archiveContracts,
    createContract,
  } = useAppData();
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("All");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("next-deadline");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [showAssignOwner, setShowAssignOwner] = useState(false);
  const [bulkOwner, setBulkOwner] = useState("");

  useEffect(() => {
    setSelectedIds((current) => {
      const next = new Set(
        [...current].filter((id) => contracts.some((contract) => contract.id === id))
      );
      return next;
    });

    if (!previewId && contracts[0]) {
      setPreviewId(contracts[0].id);
    }

    if (previewId && !contracts.some((contract) => contract.id === previewId)) {
      setPreviewId(contracts[0]?.id ?? null);
    }
  }, [contracts, previewId]);

  const ownerOptions = useMemo(
    () => Array.from(new Set(contracts.map((contract) => contract.owner))).sort(),
    [contracts]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filteredContracts = contracts.filter((contract) => {
      if (
        q &&
        !(
          contract.name.toLowerCase().includes(q) ||
          contract.vendor.toLowerCase().includes(q) ||
          contract.contractType.toLowerCase().includes(q) ||
          contract.owner.toLowerCase().includes(q)
        )
      ) {
        return false;
      }

      if (quickFilter === "Active" && contract.status !== "active") return false;
      if (quickFilter === "High risk" && contract.riskLevel !== "high") return false;
      if (quickFilter === "Expiring soon") {
        if (!contract.renewalDate) return false;
        const days =
          (new Date(contract.renewalDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24);
        if (days > 60) return false;
      }

      if (statusFilter !== "all" && contract.status !== statusFilter) return false;
      if (riskFilter !== "all" && contract.riskLevel !== riskFilter) return false;
      if (ownerFilter !== "all" && contract.owner !== ownerFilter) return false;

      return true;
    });

    return filteredContracts.sort((left, right) => {
      if (sortBy === "name") {
        return left.name.localeCompare(right.name);
      }

      if (sortBy === "risk-score") {
        return right.riskScore - left.riskScore;
      }

      return (
        new Date(left.nextDeadline).getTime() - new Date(right.nextDeadline).getTime()
      );
    });
  }, [contracts, ownerFilter, quickFilter, riskFilter, search, sortBy, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, quickFilter, statusFilter, riskFilter, ownerFilter, sortBy]);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, maxPage);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageContracts = filtered.slice(start, start + PAGE_SIZE);
  const selectedContracts = contracts.filter((contract) => selectedIds.has(contract.id));
  const allPageSelected =
    pageContracts.length > 0 &&
    pageContracts.every((contract) => selectedIds.has(contract.id));

  const cycleSort = () => {
    setSortBy((current) => {
      const currentIndex = sortOptions.indexOf(current);
      return sortOptions[(currentIndex + 1) % sortOptions.length];
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allPageSelected) {
        pageContracts.forEach((contract) => next.delete(contract.id));
      } else {
        pageContracts.forEach((contract) => next.add(contract.id));
      }
      return next;
    });
  };

  const toggleRowSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkReminder = async () => {
    if (selectedIds.size === 0) return;
    await createReminder([...selectedIds]);
  };

  const handleAssignOwner = async () => {
    if (!bulkOwner.trim()) return;
    await assignOwner([...selectedIds], bulkOwner.trim());
    setBulkOwner("");
    setShowAssignOwner(false);
    setSelectedIds(new Set());
  };

  const handleArchiveSelected = async () => {
    if (selectedIds.size === 0) return;
    await archiveContracts([...selectedIds]);
    setSelectedIds(new Set());
  };

  if (!isReady) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-10">
        <p className="text-sm text-muted-foreground">Loading contracts…</p>
      </main>
    );
  }

  const hasAnyContracts = contracts.length > 0;

  return (
    <main className="px-6 py-6 md:px-10 md:py-8 lg:px-12 lg:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:gap-6 xl:gap-7">
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-primary">Contracts</h1>
            <p className="mt-1 text-sm text-muted">
              Manage uploads, reminders, owners, and active agreements across your portfolio.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search contracts..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 w-full min-w-[200px] rounded-xl border-border bg-card text-sm text-secondary"
              />
              <Button variant="ghost" size="sm" onClick={() => setShowFilters((value) => !value)}>
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                Filters
              </Button>
              <Button variant="ghost" size="sm" onClick={cycleSort}>
                Sort
                <ChevronDown className="ml-1.5 h-3 w-3" />
              </Button>
            </div>
            <Button
              size="sm"
              variant="primary"
              className="h-9 rounded-full text-xs font-medium"
              onClick={() => setShowUploadPanel((value) => !value)}
            >
              Upload Contract
            </Button>
          </div>
        </section>

        {showUploadPanel && (
          <UploadContractPanel
            onClose={() => setShowUploadPanel(false)}
            onCreated={(contractSlug) => router.push(`/contracts/${contractSlug}`)}
            createContract={createContract}
          />
        )}

        {showFilters && (
          <Card className="border border-border bg-card">
            <CardContent className="grid gap-3 py-4 md:grid-cols-3">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-1 h-9 w-full rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="draft">Draft</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  Risk
                </label>
                <select
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value)}
                  className="mt-1 h-9 w-full rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
                >
                  <option value="all">All risk levels</option>
                  <option value="low">Low risk</option>
                  <option value="medium">Medium risk</option>
                  <option value="high">High risk</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  Owner
                </label>
                <select
                  value={ownerFilter}
                  onChange={(event) => setOwnerFilter(event.target.value)}
                  className="mt-1 h-9 w-full rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
                >
                  <option value="all">All owners</option>
                  {ownerOptions.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {quickFilters.map((label) => (
              <Chip
                key={label}
                active={quickFilter === label}
                onClick={() => setQuickFilter(label)}
                className="text-[11px]"
              >
                {label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-subtle">
            <span>Sorted by {sortBy.replace("-", " ")}</span>
            <span>•</span>
            <span>{total} matching contract{total === 1 ? "" : "s"}</span>
          </div>
        </section>

        {selectedIds.size > 0 && (
          <section>
            <Card className="border border-border bg-muted">
              <CardContent className="flex flex-col gap-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-secondary">
                    {selectedIds.size} contract{selectedIds.size > 1 ? "s" : ""} selected
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="primary"
                      size="sm"
                      className="h-7 rounded-full text-[11px]"
                      onClick={handleBulkReminder}
                    >
                      Send renewal reminders
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 rounded-full text-[11px]"
                      onClick={() => exportContractsCsv(selectedContracts)}
                    >
                      Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full text-[11px]"
                      onClick={() => setShowAssignOwner((value) => !value)}
                    >
                      Assign owner
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full text-[11px]"
                      onClick={handleArchiveSelected}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
                {showAssignOwner && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={bulkOwner}
                      onChange={(event) => setBulkOwner(event.target.value)}
                      placeholder="Assign to owner or team"
                      className="h-8 max-w-sm bg-card"
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={handleAssignOwner}
                      disabled={!bulkOwner.trim()}
                    >
                      Save owner
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {total > 0 ? (
              <Card className="border border-border bg-card">
                <CardContent className="px-5 pb-4 pt-3">
                  <ContractsTable
                    contracts={pageContracts}
                    allPageSelected={allPageSelected}
                    onToggleAll={toggleSelectAllPage}
                    onRowToggle={toggleRowSelection}
                    onRowClick={setPreviewId}
                    selectedIds={selectedIds}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-border bg-card">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <h2 className="text-sm font-semibold text-primary">
                    {hasAnyContracts ? "No contracts match these filters" : "No contracts yet"}
                  </h2>
                  <p className="max-w-sm text-[11px] text-muted">
                    {hasAnyContracts
                      ? "Try broadening your search, switching the quick filter, or clearing the advanced filters to find the right contract."
                      : "Upload your first contract to start monitoring risk, renewals, and key obligations across your portfolio."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hasAnyContracts ? (
                      <Button
                        variant="secondary"
                        className="mt-1 rounded-full px-4 text-xs font-medium"
                        onClick={() => {
                          setSearch("");
                          setQuickFilter("All");
                          setStatusFilter("all");
                          setRiskFilter("all");
                          setOwnerFilter("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        className="mt-1 rounded-full px-4 text-xs font-medium"
                        onClick={() => setShowUploadPanel(true)}
                      >
                        Upload Contract
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {total > 0 && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                <span>
                  Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total} contracts
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full px-3 text-[11px]"
                    disabled={safePage === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: maxPage }).map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        className={cn(
                          "h-7 w-7 rounded-full text-[11px]",
                          pageNum === safePage
                            ? "bg-primary text-primary-foreground"
                            : "text-muted hover:bg-muted"
                        )}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full px-3 text-[11px]"
                    disabled={safePage === maxPage}
                    onClick={() => setPage((current) => Math.min(maxPage, current + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          <aside className="mt-2 w-full shrink-0 lg:mt-0 lg:w-[320px] xl:w-[360px]">
            {previewId ? (
              <ContractPreview
                contract={
                  contracts.find((contract) => contract.id === previewId) ??
                  pageContracts[0] ??
                  null
                }
              />
            ) : (
              <Card className="border border-dashed border-border bg-card">
                <CardContent className="py-6 px-4 text-center">
                  <p className="text-sm font-medium text-primary">
                    Select a contract to preview
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    Click any row to review ownership, current file status, and the AI-generated summary.
                  </p>
                </CardContent>
              </Card>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

interface ContractsTableProps {
  contracts: Contract[];
  selectedIds: Set<string>;
  allPageSelected: boolean;
  onToggleAll: () => void;
  onRowToggle: (id: string) => void;
  onRowClick: (id: string | null) => void;
}

function ContractsTable({
  contracts,
  selectedIds,
  allPageSelected,
  onToggleAll,
  onRowToggle,
  onRowClick
}: ContractsTableProps) {
  const router = useRouter();
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-xs">
        <thead className="bg-muted">
          <tr>
            <th className="w-8 border-b border-border px-3 py-2 text-left">
              <input
                type="checkbox"
                checked={allPageSelected}
                onChange={onToggleAll}
                className="h-3.5 w-3.5 rounded border-border accent-primary"
              />
            </th>
            <TableHeaderCell>Contract</TableHeaderCell>
            <TableHeaderCell>Vendor</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Risk</TableHeaderCell>
            <TableHeaderCell>Renewal date</TableHeaderCell>
            <TableHeaderCell>Owner</TableHeaderCell>
            <th className="min-w-[110px] border-b border-border px-3 py-2 text-right text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
        {contracts.map((contract) => {
          const isSelected = selectedIds.has(contract.id);
          const renewalLabel = contract.renewalDate
            ? format(new Date(contract.renewalDate), "MMM d yyyy")
            : "—";
          return (
            <tr
              key={contract.id}
              className={cn(
                "group cursor-pointer border-t border-border/60 transition-colors hover:bg-muted",
                isSelected && "bg-muted translate-x-[2px] border-l-2 border-l-primary"
              )}
              onClick={() => onRowClick(contract.id)}
            >
              <td className="w-8 px-3 py-2.5 align-middle">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onRowToggle(contract.id)}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td className="px-3 py-2.5 align-middle">
                <div className="flex flex-col max-w-[220px]">
                  <span className="truncate text-[13px] font-medium text-primary">
                    {contract.name}
                  </span>
                  <span className="text-[11px] text-muted">
                    {contract.renewalType.replace("-", " ")}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 align-middle text-secondary">
                {contract.vendor}
              </td>
              <td className="px-3 py-2.5 align-middle text-secondary">
                {contract.contractType}
              </td>
              <td className="px-3 py-2.5 align-middle text-secondary">
                <StatusLabel status={contract.status} />
              </td>
              <td className="px-3 py-2.5 align-middle text-secondary">
                <RiskLabel level={contract.riskLevel} />
              </td>
              <td className="px-3 py-2.5 align-middle text-secondary">
                {renewalLabel}
              </td>
              <td className="px-3 py-2.5 align-middle text-secondary">
                {contract.owner}
              </td>
              <td className="px-3 py-2.5 align-middle text-right whitespace-nowrap min-w-[110px]">
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-full px-3 text-[11px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/contracts/${contract.slug}`);
                  }}
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  View
                </Button>
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  );
}

function TableHeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-border px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
      {children}
    </th>
  );
}

function StatusLabel({ status }: { status: Contract["status"] }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium text-success">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      {label}
    </span>
  );
}

function RiskLabel({ level }: { level: Contract["riskLevel"] }) {
  const toneClass =
    level === "low"
      ? "bg-success/10 text-success"
      : level === "medium"
      ? "bg-warning/10 text-warning"
      : "bg-danger/10 text-danger";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        toneClass
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level === "low"
        ? "Low"
        : level === "medium"
        ? "Medium"
        : "High"}
    </span>
  );
}

function ContractPreview({ contract }: { contract: Contract | null }) {
  if (!contract) return null;

  const renewalLabel = contract.renewalDate
    ? format(new Date(contract.renewalDate), "MMM d yyyy")
    : "—";

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-semibold text-primary">
              {contract.name}
            </CardTitle>
            <p className="mt-1 text-[11px] text-muted">
              {contract.vendor} • {contract.contractType}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 shrink-0 rounded-full px-2.5 text-[11px]"
            asChild
          >
            <Link href={`/contracts/${contract.slug}`}>
              <ExternalLink className="mr-1 h-3 w-3" />
              View page
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-1 text-xs">
        <div className="flex items-center justify-between text-[11px] text-secondary">
          <div className="flex flex-col">
            <span className="text-muted">Status</span>
            <StatusLabel status={contract.status} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-muted">Risk score</span>
            <span className="text-sm font-semibold text-primary">
              {contract.riskScore}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl bg-muted p-3">
          <div className="flex items-center justify-between text-[11px] text-secondary">
            <span className="text-muted">Renewal deadline</span>
            <span>{renewalLabel}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-secondary">
            <span className="text-muted">Owner</span>
            <span>{contract.owner}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-secondary">
            <span className="text-muted">Current file</span>
            <span>{contract.currentFile?.filename ?? "No file uploaded yet"}</span>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium text-secondary">
            Key clauses
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {contract.clauses.slice(0, 4).map((clause) => (
              <span
                key={clause}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-secondary"
              >
                {clause}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium text-secondary">
            AI summary
          </p>
          <p className="text-[11px] leading-relaxed text-secondary">
            {contract.aiSummary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function UploadContractPanel({
  onClose,
  onCreated,
  createContract,
}: {
  onClose: () => void;
  onCreated: (contractSlug: string) => void;
  createContract: ReturnType<typeof useAppData>["createContract"];
}) {
  const [name, setName] = useState("");
  const [vendor, setVendor] = useState("");
  const [contractType, setContractType] = useState("SaaS Subscription");
  const [owner, setOwner] = useState("Legal");
  const [contractValue, setContractValue] = useState("12000");
  const [valuePeriod, setValuePeriod] = useState<Contract["valuePeriod"]>("year");
  const [renewalType, setRenewalType] =
    useState<Contract["renewalType"]>("auto-renewal");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [renewalDate, setRenewalDate] = useState("");
  const [nextDeadline, setNextDeadline] = useState(new Date().toISOString().slice(0, 10));
  const [noticePeriodDays, setNoticePeriodDays] = useState("30");
  const [summary, setSummary] = useState("");
  const [clauses, setClauses] = useState("Renewal, Termination");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim() || !vendor.trim()) {
      setError("Enter both the contract name and vendor.");
      return;
    }

    if (!nextDeadline) {
      setError("Choose the next deadline so reminders can be scheduled.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdContract = await createContract({
        name: name.trim(),
        vendor: vendor.trim(),
        contractType: contractType.trim(),
        owner: owner.trim() || "Legal",
        contractValue: Number(contractValue) || 0,
        valuePeriod,
        renewalType,
        startDate,
        renewalDate: renewalDate || null,
        nextDeadline,
        noticePeriodDays: Number(noticePeriodDays) || 30,
        summary: summary.trim(),
        clauses: clauses
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        file,
      });
      onClose();
      onCreated(createdContract.slug);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The contract could not be uploaded."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex-col items-start gap-2 pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          Upload contract
        </CardTitle>
        <p className="text-[11px] text-muted">
          Add the key metadata now so the contract appears in the dashboard, reminder flows, and detail view immediately.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Contract name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Vendor">
            <Input value={vendor} onChange={(event) => setVendor(event.target.value)} />
          </Field>
          <Field label="Type">
            <Input
              value={contractType}
              onChange={(event) => setContractType(event.target.value)}
            />
          </Field>
          <Field label="Owner">
            <Input value={owner} onChange={(event) => setOwner(event.target.value)} />
          </Field>
          <Field label="Contract value">
            <Input
              type="number"
              value={contractValue}
              onChange={(event) => setContractValue(event.target.value)}
            />
          </Field>
          <Field label="Value period">
            <select
              value={valuePeriod}
              onChange={(event) =>
                setValuePeriod(event.target.value as Contract["valuePeriod"])
              }
              className="h-9 w-full rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
            >
              <option value="month">Per month</option>
              <option value="year">Per year</option>
              <option value="total">Total</option>
            </select>
          </Field>
          <Field label="Renewal type">
            <select
              value={renewalType}
              onChange={(event) =>
                setRenewalType(event.target.value as Contract["renewalType"])
              }
              className="h-9 w-full rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
            >
              <option value="auto-renewal">Auto-renewal</option>
              <option value="manual-renewal">Manual renewal</option>
              <option value="evergreen">Evergreen</option>
              <option value="fixed-term">Fixed term</option>
            </select>
          </Field>
          <Field label="Start date">
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field label="Renewal date">
            <Input
              type="date"
              value={renewalDate}
              onChange={(event) => setRenewalDate(event.target.value)}
            />
          </Field>
          <Field label="Next deadline">
            <Input
              type="date"
              value={nextDeadline}
              onChange={(event) => setNextDeadline(event.target.value)}
            />
          </Field>
          <Field label="Notice period (days)">
            <Input
              type="number"
              value={noticePeriodDays}
              onChange={(event) => setNoticePeriodDays(event.target.value)}
            />
          </Field>
          <Field label="Contract file">
            <label className="flex h-9 cursor-pointer items-center justify-between rounded-full border border-border bg-secondary px-3 text-xs text-foreground">
              <span className="truncate">
                {file?.name ?? "Choose PDF or document"}
              </span>
              <UploadCloud className="ml-2 h-3.5 w-3.5 shrink-0" />
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </Field>
        </div>
        <Field label="Summary">
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-border bg-secondary px-3 py-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Short description of the contract scope and business purpose."
          />
        </Field>
        <Field label="Tracked clauses">
          <Input
            value={clauses}
            onChange={(event) => setClauses(event.target.value)}
            placeholder="Renewal, Termination, Liability"
          />
        </Field>
        {error && (
          <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-[11px] text-danger">
            {error}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving contract…" : "Save contract"}
          </Button>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

