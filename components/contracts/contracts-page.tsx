"use client";

import { contracts as baseContracts } from "@/data/contracts";
import { Contract } from "@/types/contract";
import { useMemo, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, ExternalLink, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ExtendedContract = Contract & {
  contractType: string;
  owner: string;
};

const OWNER_MAP: Record<string, string> = {
  aws: "Infrastructure",
  slack: "People Ops",
  m365: "IT",
  "office-lease": "Operations",
  hubspot: "Growth",
  notion: "Product",
  payroll: "Finance"
};

const TYPE_MAP: Record<string, string> = {
  aws: "Cloud Infrastructure",
  slack: "SaaS Subscription",
  m365: "SaaS Subscription",
  "office-lease": "Real Estate",
  hubspot: "SaaS Subscription",
  notion: "SaaS Subscription",
  payroll: "Services Agreement"
};

const PAGE_SIZE = 25;

const quickFilters = ["All", "Active", "Expiring soon", "High risk"] as const;
type QuickFilter = (typeof quickFilters)[number];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "renewal-asc", label: "Renewal date (soonest)" },
  { value: "renewal-desc", label: "Renewal date (latest)" },
  { value: "risk-desc", label: "Risk score (high first)" },
  { value: "risk-asc", label: "Risk score (low first)" },
] as const;

function extendContracts(): ExtendedContract[] {
  return baseContracts.map((c) => ({
    ...c,
    contractType: TYPE_MAP[c.id] ?? "SaaS Subscription",
    owner: OWNER_MAP[c.id] ?? "Legal"
  }));
}

export function ContractsPage() {
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("All");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]["value"]>("renewal-asc");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideFilter = filterRef.current?.contains(target);
      const insideSort = sortRef.current?.contains(target);
      if (!insideFilter && !insideSort) {
        setFilterDropdownOpen(false);
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const contracts = useMemo(() => extendContracts(), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = contracts.filter((c) => {
      if (archivedIds.has(c.id)) return false;
      if (q) {
        if (
          !(
            c.name.toLowerCase().includes(q) ||
            c.vendor.toLowerCase().includes(q)
          )
        ) {
          return false;
        }
      }

      if (quickFilter === "Active" && c.status !== "active") return false;
      if (quickFilter === "High risk" && c.riskLevel !== "high") return false;
      if (quickFilter === "Expiring soon") {
        if (!c.renewalDate) return false;
        const days =
          (new Date(c.renewalDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24);
        if (days > 60) return false;
      }

      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "renewal-asc": {
          const da = a.renewalDate ? new Date(a.renewalDate).getTime() : Infinity;
          const db = b.renewalDate ? new Date(b.renewalDate).getTime() : Infinity;
          return da - db;
        }
        case "renewal-desc": {
          const da = a.renewalDate ? new Date(a.renewalDate).getTime() : 0;
          const db = b.renewalDate ? new Date(b.renewalDate).getTime() : 0;
          return db - da;
        }
        case "risk-desc":
          return b.riskScore - a.riskScore;
        case "risk-asc":
          return a.riskScore - b.riskScore;
        default:
          return 0;
      }
    });

    return result;
  }, [contracts, search, quickFilter, sortBy, archivedIds]);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, maxPage);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageContracts = filtered.slice(start, start + PAGE_SIZE);

  const allPageSelected =
    pageContracts.length > 0 &&
    pageContracts.every((c) => selectedIds.has(c.id));

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageContracts.forEach((c) => next.delete(c.id));
      } else {
        pageContracts.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  const toggleRowSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRowClick = (id: string) => {
    setPreviewId(id);
  };

  const selectedContracts = contracts.filter((c) =>
    selectedIds.has(c.id)
  );

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const supabase = createClient();
    if (!supabase) {
      setUploadMessage("Upload requires Supabase. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      setTimeout(() => setUploadMessage(null), 5000);
      return;
    }
    try {
      const path = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("contracts").upload(path, file);
      if (error) throw error;
      setUploadMessage("Upload complete. TODO: Create contract record and refresh list.");
    } catch (err) {
      setUploadMessage(err instanceof Error ? err.message : "Upload failed. Ensure storage bucket 'contracts' exists.");
    }
    setTimeout(() => setUploadMessage(null), 5000);
  };

  const handleExport = () => {
    if (selectedContracts.length === 0) return;
    const headers = ["Contract", "Vendor", "Status", "Risk", "Renewal date", "Owner"];
    const rows = selectedContracts.map((c) => [
      c.name,
      c.vendor,
      c.status,
      c.riskLevel,
      c.renewalDate ? format(new Date(c.renewalDate), "yyyy-MM-dd") : "",
      (c as ExtendedContract).owner,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contracts-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleSendReminders = async () => {
    if (selectedContracts.length === 0) return;
    const supabase = createClient();
    if (!supabase) {
      setReminderMessage("Reminders require Supabase. Configure and run schema.sql.");
      setTimeout(() => setReminderMessage(null), 5000);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setReminderMessage("Sign in to send reminders.");
      setTimeout(() => setReminderMessage(null), 5000);
      return;
    }
    setReminderMessage(`${selectedContracts.length} renewal reminder(s) queued. TODO: Wire to contract_reminders.`);
    setSelectedIds(new Set());
    setTimeout(() => setReminderMessage(null), 5000);
  };

  const handleAssignOwner = () => {
    if (selectedContracts.length === 0) return;
    const owner = window.prompt("Enter owner (e.g. Legal, Finance):");
    if (!owner) return;
    setReminderMessage(`Owner "${owner}" assigned to ${selectedContracts.length} contract(s). TODO: Persist via Supabase.`);
    setSelectedIds(new Set());
    setTimeout(() => setReminderMessage(null), 5000);
  };

  const handleArchive = () => {
    if (selectedContracts.length === 0) return;
    setArchivedIds((prev) => new Set([...prev, ...selectedContracts.map((c) => c.id)]));
    setSelectedIds(new Set());
  };

  return (
    <main className="px-6 py-6 md:px-10 md:py-8 lg:px-12 lg:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:gap-6 xl:gap-7">
        {/* Header */}
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-primary">
              Contracts
            </h1>
            <p className="mt-1 text-sm text-muted">
              Manage and monitor all agreements across your portfolio.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search contracts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full min-w-[200px] rounded-xl border-border bg-card text-sm text-secondary"
              />
              <div className="relative" ref={filterRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterDropdownOpen(!filterDropdownOpen); setSortDropdownOpen(false); }}
                  className={cn(filterDropdownOpen && "bg-muted")}
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  Filters
                </Button>
                {filterDropdownOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-border bg-card p-2 shadow-lg">
                    <p className="mb-2 text-[11px] font-medium text-muted">Quick filters above handle Status, Risk, Vendor. More filters coming soon.</p>
                    <Button variant="ghost" size="sm" className="w-full text-left" onClick={() => setFilterDropdownOpen(false)}>Close</Button>
                  </div>
                )}
              </div>
              <div className="relative" ref={sortRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSortDropdownOpen(!sortDropdownOpen); setFilterDropdownOpen(false); }}
                  className={cn(sortDropdownOpen && "bg-muted")}
                >
                  Sort
                  <ChevronDown className="ml-1.5 h-3 w-3" />
                </Button>
                {sortDropdownOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setSortBy(opt.value); setSortDropdownOpen(false); }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-[11px] hover:bg-muted",
                          sortBy === opt.value && "bg-muted font-medium"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              variant="primary"
              className="h-9 rounded-full text-xs font-medium"
              onClick={handleUploadClick}
            >
              Upload Contract
            </Button>
          </div>
        </section>

        {(uploadMessage || reminderMessage) && (
          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
            {uploadMessage ?? reminderMessage}
          </div>
        )}

        {/* Filter bar */}
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
            <span>Status</span>
            <span>•</span>
            <span>Risk level</span>
            <span>•</span>
            <span>Vendor</span>
            <span>•</span>
            <span>Type</span>
            <span>•</span>
            <span>Renewal window</span>
            <span>•</span>
            <span>Owner</span>
          </div>
        </section>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <section>
            <Card className="border border-border bg-muted">
              <CardContent className="flex items-center justify-between gap-3 py-2.5 px-4">
                <div className="text-[11px] text-secondary">
                  {selectedIds.size} contract
                  {selectedIds.size > 1 ? "s" : ""} selected
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-7 rounded-full text-[11px]"
                    onClick={handleSendReminders}
                  >
                    Send renewal reminders
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 rounded-full text-[11px]"
                    onClick={handleExport}
                  >
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full text-[11px]"
                    onClick={handleAssignOwner}
                  >
                    Assign owner
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full text-[11px]"
                    onClick={handleArchive}
                  >
                    Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Card className="border border-border bg-card">
              <CardContent className="px-5 pb-4 pt-3">
                <ContractsTable
                  contracts={pageContracts}
                  allPageSelected={allPageSelected}
                  onToggleAll={toggleSelectAllPage}
                  onRowToggle={toggleRowSelection}
                  onRowClick={handleRowClick}
                  selectedIds={selectedIds}
                />
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between text-[11px] text-muted mt-1">
              <span>
                Showing {total === 0 ? 0 : start + 1}–
                {Math.min(start + PAGE_SIZE, total)} of {total} contracts
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-3 text-[11px]"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                {Array.from({ length: maxPage }).map((_, i) => {
                  const pageNum = i + 1;
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
                  onClick={() =>
                    setPage((p) => Math.min(maxPage, p + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* Right-side preview */}
          <aside className="mt-2 w-full shrink-0 lg:mt-0 lg:w-[320px] xl:w-[360px]">
            {previewId ? (
              <ContractPreview
                contract={
                  contracts.find((c) => c.id === previewId) ??
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
                    Click any row to see key details, risk, and AI summary
                    without leaving this page.
                  </p>
                </CardContent>
              </Card>
            )}
          </aside>
        </section>

        {/* Empty state */}
        {total === 0 && (
          <section>
            <Card className="border border-border bg-card">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <h2 className="text-sm font-semibold text-primary">
                  No contracts yet
                </h2>
                <p className="max-w-sm text-[11px] text-muted">
                  Upload your first contract to start monitoring risk,
                  renewals, and key obligations across your portfolio.
                </p>
                <Button variant="primary" className="mt-1 rounded-full px-4 text-xs font-medium" onClick={handleUploadClick}>
                  Upload Contract
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}

interface ContractsTableProps {
  contracts: ExtendedContract[];
  selectedIds: Set<string>;
  allPageSelected: boolean;
  onToggleAll: () => void;
  onRowToggle: (id: string) => void;
  onRowClick: (id: string) => void;
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
                    router.push(`/contracts/${contract.id}`);
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

function ContractPreview({ contract }: { contract: ExtendedContract | null }) {
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
            <Link href={`/contracts/${contract.id}`}>
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

