"use client";

import { useRef, useState } from "react";
import { Contract } from "@/types/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  FileText,
  Maximize2,
  Minus,
  Plus,
  Send,
  Upload,
  X,
} from "lucide-react";
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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function generateAnswer(question: string, contract: Contract): string {
  const q = question.toLowerCase();
  if (/auto-?renew/i.test(q)) {
    return `This contract uses a ${contract.renewalType.replace("-", " ")} structure. Non-renewal generally requires written notice ${contract.noticePeriodDays} days before ${contract.renewalDate ? "the renewal date" : "each billing cycle"}.`;
  }
  if (/notice/i.test(q)) {
    return `The notice window is ${contract.noticePeriodDays} days. Missing this can trigger an automatic extension and maintain existing commercial terms.`;
  }
  if (/liability/i.test(q)) {
    return "Liability is typically capped at 12 months of fees with carve-outs for data breaches, confidentiality, and IP infringement.";
  }
  if (/summary|summarise|summarize/i.test(q)) {
    return "Renewal maintains current scope with potential pricing uplifts tied to usage. There is flexibility to downsize seats ahead of the renewal date.";
  }
  if (/risk/i.test(q)) {
    return `The contract has a risk score of ${contract.riskScore} and is classified as "${contract.healthLabel}". Key factors include the renewal type, notice period, and contract value.`;
  }
  if (/value|cost|price/i.test(q)) {
    return `The contract value is $${contract.contractValue.toLocaleString()} per ${contract.valuePeriod}.`;
  }
  return `Based on the contract analysis: ${contract.aiSummary} The risk score is ${contract.riskScore} ("${contract.healthLabel}").`;
}

export function ContractDetailPage({ contract }: ContractDetailPageProps) {
  const [clauseSearch, setClauseSearch] = useState("");
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(
    "termination"
  );
  const [rightTab, setRightTab] = useState<RightTab>("insights");
  const [issueBannerVisible, setIssueBannerVisible] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isReviewed, setIsReviewed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalPages = 12;

  const renewalDate = contract.renewalDate
    ? format(new Date(contract.renewalDate), "MMM d yyyy")
    : "—";
  const nextDeadline = format(new Date(contract.nextDeadline), "MMM d yyyy");
  const noticeWindowCloses = contract.renewalDate
    ? format(
        subDays(
          new Date(contract.renewalDate),
          contract.noticePeriodDays
        ),
        "MMM d yyyy"
      )
    : "—";

  const pdfFilename = `${contract.id.replace(/-/g, "_")}_main.pdf`;
  const filteredClauses = CLAUSE_LABELS.filter((c) =>
    c.label.toLowerCase().includes(clauseSearch.toLowerCase())
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUploadNewVersion = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: Wire to Supabase storage upload
    showToast(
      `"${file.name}" selected. Upload requires Supabase to be configured.`
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateReminder = () => {
    // TODO: Wire to Supabase to create a reminder record
    showToast(
      `Reminder created for "${contract.name}" — deadline ${nextDeadline}.`
    );
  };

  const handleExport = () => {
    const data = {
      name: contract.name,
      vendor: contract.vendor,
      status: contract.status,
      riskLevel: contract.riskLevel,
      riskScore: contract.riskScore,
      contractValue: contract.contractValue,
      valuePeriod: contract.valuePeriod,
      renewalType: contract.renewalType,
      renewalDate: contract.renewalDate,
      nextDeadline: contract.nextDeadline,
      noticePeriodDays: contract.noticePeriodDays,
      clauses: contract.clauses,
      summary: contract.summary,
      aiSummary: contract.aiSummary,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contract.id}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkReviewed = () => {
    setIsReviewed(true);
    // TODO: Wire to Supabase to update contract.is_reviewed
    showToast(`"${contract.name}" marked as reviewed.`);
  };

  const handleDownload = () => {
    // TODO: Wire to actual file download from Supabase storage
    showToast(
      "Document download requires a file to be stored in Supabase storage."
    );
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: question },
    ]);
    setChatInput("");
    setChatLoading(true);

    setTimeout(() => {
      const answer = generateAnswer(question, contract);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer },
      ]);
      setChatLoading(false);
    }, 600);
  };

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload new version"
      />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 lg:gap-6">
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
            {contract.vendor} •{" "}
            {contract.status.charAt(0).toUpperCase() +
              contract.status.slice(1)}{" "}
            • ${contract.contractValue.toLocaleString()} /{" "}
            {contract.valuePeriod}
          </p>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <StatusPill status={contract.status} />
            <RiskPill level={contract.riskLevel} />
            {isReviewed && (
              <span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-success">
                <Check className="h-3 w-3" />
                Reviewed
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={handleUploadNewVersion}
            >
              <Upload className="mr-1 h-3 w-3" />
              Upload New Version
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={handleCreateReminder}
            >
              Create Reminder
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={handleExport}
            >
              <Download className="mr-1 h-3 w-3" />
              Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={handleMarkReviewed}
              disabled={isReviewed}
            >
              {isReviewed ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Reviewed
                </>
              ) : (
                "Mark Reviewed"
              )}
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
          <Card
            className={cn(
              "border border-border bg-card rounded-[var(--radius)] flex flex-col",
              isFullscreen &&
                "fixed inset-4 z-50 max-w-none rounded-xl shadow-lg"
            )}
          >
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
                <span>
                  Page {currentPage} of {totalPages}
                </span>
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
                    onClick={handleFullscreen}
                    aria-label="Toggle fullscreen"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-full p-0"
                    onClick={handleDownload}
                    aria-label="Download document"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="min-h-[420px] flex-1 rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-[11px] text-muted-foreground">
                  Document preview area
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Upload a contract file to preview it here
                </p>
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
                        <span>
                          Notice window closes: {noticeWindowCloses}
                        </span>
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
                <div className="flex flex-col gap-3">
                  {chatMessages.length === 0 && (
                    <p className="text-center text-[11px] text-muted-foreground py-4">
                      Ask questions about clauses, dates, or obligations in this
                      contract.
                    </p>
                  )}
                  <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-lg px-3 py-2 text-[11px]",
                          msg.role === "user"
                            ? "ml-8 bg-muted text-foreground"
                            : "mr-8 bg-card border border-border text-foreground"
                        )}
                      >
                        {msg.content}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="mr-8 rounded-lg border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
                        Thinking…
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Ask about this contract..."
                      className="rounded-full text-[11px]"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleChatSubmit();
                      }}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      className="h-9 w-9 rounded-full p-0"
                      onClick={handleChatSubmit}
                      disabled={chatLoading || !chatInput.trim()}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              {rightTab === "details" && (
                <div className="space-y-3 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendor</span>
                    <span className="text-foreground">
                      {contract.vendor}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusPill status={contract.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk score</span>
                    <span className="text-foreground">
                      {contract.riskScore}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Notice period
                    </span>
                    <span className="text-foreground">
                      {contract.noticePeriodDays} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Contract value
                    </span>
                    <span className="text-foreground">
                      ${contract.contractValue.toLocaleString()} /{" "}
                      {contract.valuePeriod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Renewal type
                    </span>
                    <span className="text-foreground capitalize">
                      {contract.renewalType.replace("-", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Start date
                    </span>
                    <span className="text-foreground">
                      {format(new Date(contract.startDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  {contract.endDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End date</span>
                      <span className="text-foreground">
                        {format(new Date(contract.endDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-border bg-card px-4 py-2.5 text-xs text-foreground shadow-lg">
          {toastMessage}
        </div>
      )}

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

      {/* Fullscreen overlay backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        />
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
        <p className="text-[11px] leading-relaxed text-foreground">
          {content}
        </p>
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
