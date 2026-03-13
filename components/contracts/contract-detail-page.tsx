"use client";

import { useMemo, useRef, useState } from "react";
import { Contract } from "@/types/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Maximize2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppData } from "@/components/app/app-data-provider";
import { createDownload } from "@/lib/app-data";

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
  const { uploadContractVersion, createReminder, markContractReviewed } = useAppData();
  const [clauseSearch, setClauseSearch] = useState("");
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>("termination");
  const [rightTab, setRightTab] = useState<RightTab>("insights");
  const [issueBannerVisible, setIssueBannerVisible] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [detailMessage, setDetailMessage] = useState<string | null>(null);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const versionInputRef = useRef<HTMLInputElement>(null);
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
  const issueCount = useMemo(() => {
    let total = 0;
    if (contract.riskLevel === "high") total += 1;
    if (contract.noticePeriodDays >= 90) total += 1;
    if (!contract.reviewedAt) total += 1;
    return total || 1;
  }, [contract.noticePeriodDays, contract.reviewedAt, contract.riskLevel]);

  const handleExport = () => {
    createDownload(
      `${contract.slug}-summary.txt`,
      [
        `Contract: ${contract.name}`,
        `Vendor: ${contract.vendor}`,
        `Status: ${contract.status}`,
        `Risk score: ${contract.riskScore}`,
        `Renewal type: ${contract.renewalType}`,
        `Renewal date: ${contract.renewalDate ?? "Not set"}`,
        `Next deadline: ${contract.nextDeadline}`,
        `Owner: ${contract.owner}`,
        "",
        "Summary",
        contract.summary || "No summary saved yet.",
        "",
        "AI Summary",
        contract.aiSummary || "No AI summary saved yet.",
      ].join("\n"),
      "text/plain;charset=utf-8"
    );
    setDetailMessage("Contract summary exported.");
  };

  const handleVersionUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploadingVersion(true);
    setDetailMessage(null);

    try {
      await uploadContractVersion(contract.id, file);
      setDetailMessage("A new version was uploaded and marked as current.");
    } catch (uploadError) {
      setDetailMessage(
        uploadError instanceof Error ? uploadError.message : "Version upload failed."
      );
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const handleReminder = async () => {
    setDetailMessage(null);
    try {
      await createReminder([contract.id]);
      setDetailMessage("Renewal reminder scheduled for the contract owners.");
    } catch (reminderError) {
      setDetailMessage(
        reminderError instanceof Error
          ? reminderError.message
          : "Reminder could not be created."
      );
    }
  };

  const handleReviewToggle = async () => {
    setDetailMessage(null);
    try {
      await markContractReviewed(contract.id, !contract.reviewedAt);
      setDetailMessage(
        contract.reviewedAt
          ? "Review status cleared."
          : "Contract marked as reviewed."
      );
    } catch (reviewError) {
      setDetailMessage(
        reviewError instanceof Error ? reviewError.message : "Review state could not be updated."
      );
    }
  };

  const handleOpenFile = () => {
    if (contract.currentFile?.publicUrl) {
      window.open(contract.currentFile.publicUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setDetailMessage("Upload a contract version first to preview it in a new tab.");
  };

  const handleDownloadFile = () => {
    if (contract.currentFile?.publicUrl) {
      window.open(contract.currentFile.publicUrl, "_blank", "noopener,noreferrer");
      return;
    }

    handleExport();
  };

  const handleAsk = () => {
    const question = chatPrompt.trim().toLowerCase();
    if (!question) return;

    let answer =
      "This workspace answer is based on the saved summary, deadlines, and contract metadata currently attached to the record.";

    if (question.includes("renew")) {
      answer = `The contract uses ${contract.renewalType.replace("-", " ")} and the next deadline is ${nextDeadline}. The renewal date is ${renewalDate}.`;
    } else if (question.includes("risk")) {
      answer = `The current risk score is ${contract.riskScore}, which places the contract in the ${contract.riskLevel} risk tier.`;
    } else if (question.includes("owner")) {
      answer = `The current owner is ${contract.owner}. Use the contracts page bulk actions if you need to reassign it.`;
    } else if (question.includes("file") || question.includes("version")) {
      answer = contract.currentFile
        ? `The current file is ${contract.currentFile.filename} and version ${contract.currentFile.versionNumber} is marked as current.`
        : "No file has been uploaded yet. Use “Upload New Version” to attach the current document.";
    } else if (question.includes("summary")) {
      answer = contract.aiSummary || contract.summary || "No summary has been saved yet.";
    }

    setChatAnswer(answer);
  };

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
            {contract.reviewedAt ? (
              <span className="rounded-full bg-success/10 px-2 py-1 text-success">
                Reviewed
              </span>
            ) : (
              <span className="rounded-full bg-warning/10 px-2 py-1 text-warning">
                Review pending
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={versionInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(event) => handleVersionUpload(event.target.files?.[0] ?? null)}
            />
            <Button
              variant="primary"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={() => versionInputRef.current?.click()}
              disabled={isUploadingVersion}
            >
              Upload New Version
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={handleReminder}
            >
              Create Reminder
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={handleReviewToggle}
            >
              {contract.reviewedAt ? "Clear Review" : "Mark Reviewed"}
            </Button>
          </div>
        </section>

        {detailMessage && (
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-[11px] text-foreground">
            {detailMessage}
          </div>
        )}

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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-full p-0"
                    onClick={handleOpenFile}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-full p-0"
                    onClick={handleDownloadFile}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="min-h-[420px] flex-1 overflow-hidden rounded-lg border border-dashed border-border bg-muted/20">
                {contract.currentFile?.publicUrl ? (
                  <iframe
                    src={contract.currentFile.publicUrl}
                    title={contract.currentFile.filename}
                    className="h-full min-h-[420px] w-full"
                  />
                ) : (
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No document uploaded yet
                    </p>
                    <p className="max-w-sm text-[11px] text-muted-foreground">
                      Upload a contract version to preview the latest file here and enable the
                      download actions in this workspace.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => versionInputRef.current?.click()}
                    >
                      Upload first version
                    </Button>
                  </div>
                )}
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
                <div className="space-y-4 py-2">
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                    <p className="text-[11px] text-muted-foreground">
                      Ask about the saved summary, deadlines, owner, or current document status.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about this contract..."
                      className="rounded-full text-[11px]"
                      value={chatPrompt}
                      onChange={(event) => setChatPrompt(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAsk();
                        }
                      }}
                    />
                    <Button size="sm" className="rounded-full" onClick={handleAsk}>
                      Ask
                    </Button>
                  </div>
                  {chatAnswer ? (
                    <div className="rounded-lg border border-border bg-card px-3 py-3 text-[11px] text-foreground">
                      {chatAnswer}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Try: “When is the next renewal?”, “Who owns this?”, or “Do we have a file attached?”
                    </p>
                  )}
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
                    <span className="text-muted-foreground">Type</span>
                    <span className="text-foreground">{contract.contractType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="text-foreground">{contract.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk score</span>
                    <span className="text-foreground">{contract.riskScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notice period</span>
                    <span className="text-foreground">{contract.noticePeriodDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current version</span>
                    <span className="text-foreground">
                      {contract.currentFile
                        ? `v${contract.currentFile.versionNumber}`
                        : "No file yet"}
                    </span>
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
          <span>{issueCount} issue{issueCount === 1 ? "" : "s"}</span>
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

export function ContractDetailRoute({ contractId }: { contractId: string }) {
  const { contracts, isReady } = useAppData();

  if (!isReady) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading contract…</p>
      </main>
    );
  }

  const contract =
    contracts.find((item) => item.slug === contractId || item.id === contractId) ?? null;

  if (!contract) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center px-4 py-10 md:px-8">
        <Card className="w-full border border-border bg-card">
          <CardHeader className="flex-col items-start gap-2 pb-2">
            <CardTitle className="text-xl font-semibold text-foreground">
              Contract not found
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This contract does not exist in your workspace yet, or it may have been archived.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-2">
            <Button asChild size="sm">
              <Link href="/contracts">Back to contracts</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <ContractDetailPage contract={contract} />;
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
