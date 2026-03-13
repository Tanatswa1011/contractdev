"use client";

import { useState } from "react";
import { Contract } from "@/types/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, Download, ExternalLink, FileText, Maximize2, Minus, Plus, Shield, Timer, X } from "lucide-react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface ContractDetailPageProps {
  contract: Contract;
}

const CLAUSE_LABELS: { id: string; label: string }[] = [
  { id: "termination", label: "Termination" },
  { id: "renewal", label: "Renewal / Auto-renew" },
  { id: "notice", label: "Notice period" },
  { id: "liability", label: "Liability cap" },
  { id: "dpa", label: "Data Processing / DPA" },
  { id: "governing", label: "Governing law" },
  { id: "payment", label: "Payment terms" },
  { id: "confidentiality", label: "Confidentiality" },
];

const DETECTED_ISSUES = [
  "Auto renewal enabled, 30 day notice period.",
  "Liability cap at 12 months of fees (within policy).",
  "Data Processing Addendum present; review sub-processor list.",
];

type RightTab = "insights" | "chat" | "details";

export function ContractDetailPage({ contract }: ContractDetailPageProps) {
  const [clauseSearch, setClauseSearch] = useState("");
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>("termination");
  const [rightTab, setRightTab] = useState<RightTab>("insights");
  const [issueBannerVisible, setIssueBannerVisible] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 12;

  const renewalDate = contract.renewalDate
    ? format(new Date(contract.renewalDate), "MMM d yyyy")
    : "—";
  const nextDeadline = format(new Date(contract.nextDeadline), "MMM d yyyy");
  const noticeWindowCloses = contract.renewalDate
    ? format(
        subDays(new Date(contract.renewalDate), contract.noticePeriodDays),
        "MMM d yyyy"
      )
    : "—";

  const pdfFilename = `${contract.id.replace(/-/g, "_")}_main.pdf`;
  const filteredClauses = CLAUSE_LABELS.filter((c) =>
    c.label.toLowerCase().includes(clauseSearch.toLowerCase())
  );

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1600px] flex flex-col gap-5 lg:gap-6">
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to contracts
        </Link>

        <section className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">
            {contract.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {contract.vendor} • {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)} • $
            {contract.contractValue.toLocaleString()} / {contract.valuePeriod}
          </p>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <StatusPill status={contract.status} />
            <RiskPill level={contract.riskLevel} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" className="h-8 rounded-full px-3 text-[11px]">
              Upload New Version
            </Button>
            <Button variant="primary" size="sm" className="h-8 rounded-full px-3 text-[11px]">
              Create Reminder
            </Button>
            <Button variant="secondary" size="sm" className="h-8 rounded-full px-3 text-[11px]">
              Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
            >
              Mark Reviewed
            </Button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[280px,minmax(0,1fr),360px] xl:grid-cols-[300px,minmax(0,1fr),380px]">
          {/* Left: Key Clauses */}
          <Card className="border border-border bg-card rounded-[var(--radius)]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Key clauses
                </CardTitle>
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger ring-1 ring-danger/30">
                  5 Issues
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Input
                placeholder="Search clauses"
                value={clauseSearch}
                onChange={(e) => setClauseSearch(e.target.value)}
                className="h-8 rounded-lg border-border bg-muted/50 text-[11px]"
              />
              <div className="flex flex-col gap-1">
                {filteredClauses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClauseId(c.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-[11px] transition-colors",
                      selectedClauseId === c.id
                        ? "border-primary bg-muted text-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span>{c.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Middle: PDF Preview */}
          <Card className="border border-border bg-card rounded-[var(--radius)] flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs font-medium text-foreground">
                    {pdfFilename}
                  </span>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    PDF preview
                  </span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span>Page {currentPage} of {totalPages}</span>
                <span>Last updated 2 days ago</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 pt-0">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-2 py-1.5">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-full p-0"
                    onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-[3rem] text-center text-[11px] font-medium text-foreground">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-full p-0"
                    onClick={() => setZoom((z) => Math.min(150, z + 10))}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="min-h-[420px] flex-1 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center">
                <p className="text-[11px] text-muted-foreground">Document preview area</p>
              </div>
            </CardContent>
          </Card>

          {/* Right: Insights / Chat / Details */}
          <Card className="border border-border bg-card rounded-[var(--radius)] flex flex-col">
            <div className="flex border-b border-border">
              {(["insights", "chat", "details"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRightTab(tab)}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-[11px] font-medium capitalize transition-colors",
                    rightTab === tab
                      ? "border-b-2 border-foreground text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <CardContent className="flex-1 overflow-auto pt-4">
              {rightTab === "insights" && (
                <div className="space-y-4">
                  <InsightBlock
                    title="AI contract summary"
                    content={contract.aiSummary}
                  />
                  <InsightBlock
                    title="Risk analysis"
                    content={`Overall risk is ${contract.riskLevel === "medium" ? "Medium" : contract.riskLevel === "high" ? "High" : "Low"}: auto-renewal and notice clauses are time-sensitive, but liability and data protection terms are within policy.`}
                  />
                  <InsightBlock title="Important dates">
                    <div className="space-y-2 text-[11px] text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        <span>Next deadline: {nextDeadline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                        <span>Renewal date: {renewalDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                        <span>Notice window closes: {noticeWindowCloses}</span>
                      </div>
                    </div>
                  </InsightBlock>
                  <InsightBlock title="Detected issues">
                    <ul className="list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
                      {DETECTED_ISSUES.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </InsightBlock>
                </div>
              )}
              {rightTab === "chat" && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-[11px] text-muted-foreground">
                    Chat about this contract with AI. Ask questions about clauses, dates, or obligations.
                  </p>
                  <Input
                    placeholder="Ask about this contract..."
                    className="mt-4 max-w-xs rounded-full text-[11px]"
                  />
                </div>
              )}
              {rightTab === "details" && (
                <div className="space-y-3 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendor</span>
                    <span className="text-foreground">{contract.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusPill status={contract.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk score</span>
                    <span className="text-foreground">{contract.riskScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notice period</span>
                    <span className="text-foreground">{contract.noticePeriodDays} days</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Issue banner */}
      {issueBannerVisible && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[11px] font-medium text-danger">
          <span>1 issue</span>
          <button
            type="button"
            onClick={() => setIssueBannerVisible(false)}
            className="rounded p-0.5 hover:bg-danger/20"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </main>
  );
}

function InsightBlock({
  title,
  content,
  children,
}: {
  title: string;
  content?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3.5 py-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {content && (
        <p className="text-[11px] leading-relaxed text-foreground">{content}</p>
      )}
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: Contract["status"] }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-success">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      {label}
    </span>
  );
}

function RiskPill({ level }: { level: Contract["riskLevel"] }) {
  const color =
    level === "low"
      ? "text-success"
      : level === "medium"
      ? "text-warning"
      : "text-danger";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium",
        color
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level === "low"
        ? "Low risk"
        : level === "medium"
        ? "Medium risk"
        : "High risk"}
    </span>
  );
}
