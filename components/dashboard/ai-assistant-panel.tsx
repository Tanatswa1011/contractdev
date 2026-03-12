import { Contract } from "@/types/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { useState } from "react";
import {
  Brain,
  CalendarClock,
  FileText,
  Shield,
  Sparkles,
  Timer,
  Wand2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AiAssistantPanelProps {
  contract: Contract | null;
}

const promptSuggestions = [
  "Does it auto-renew?",
  "What is the notice window?",
  "Is there a liability cap?",
  "Summarise renewal terms"
];

export function AiAssistantPanel({ contract }: AiAssistantPanelProps) {
  if (!contract) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Brain className="h-4 w-4 text-aiAccent" />
            AI Contract Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs text-muted-foreground">
          <p>
            Select a contract from the table to see an AI-generated summary, key dates, and
            clause analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl bg-muted text-aiAccent ring-1 ring-border">
              <Brain className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col">
              <CardTitle className="text-sm font-semibold text-foreground">
                AI Contract Assistant
              </CardTitle>
              <span className="text-[11px] text-muted-foreground">
                Context-aware insights for the selected contract.
              </span>
            </div>
          </div>
          <Badge variant="info">Beta</Badge>
        </div>
        <div className="rounded-2xl bg-muted px-3 py-2 ring-1 ring-border">
          <p className="truncate text-[12px] font-medium text-foreground">
            {contract.name}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {contract.vendor} • ${contract.contractValue.toLocaleString()}/
            {contract.valuePeriod}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="success">Active</Badge>
            <Badge
              variant={
                contract.riskLevel === "low"
                  ? "success"
                  : contract.riskLevel === "medium"
                  ? "warning"
                  : "danger"
              }
            >
              {contract.healthLabel}
            </Badge>
            <Badge variant="outline">Risk score {contract.riskScore}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 text-xs text-foreground">
        <AiSummaryCard contract={contract} />
        <div className="grid grid-cols-1 gap-3">
          <ImportantDatesCard contract={contract} />
          <ClauseTags clauses={contract.clauses} />
        </div>
        <AskContractBox contract={contract} />
      </CardContent>
    </Card>
  );
}

function AiSummaryCard({ contract }: { contract: Contract }) {
  return (
    <div className="space-y-2 rounded-2xl bg-muted px-3.5 py-3 ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-aiAccent" />
          <span className="text-[11px] font-medium text-foreground">
            AI portfolio perspective
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">Updated just now</span>
      </div>
      <p className="text-[11px] leading-relaxed text-foreground">
        {contract.aiSummary}
      </p>
    </div>
  );
}

function ClauseTags({ clauses }: { clauses: Contract["clauses"] }) {
  const iconForClause = (clause: string) => {
    switch (clause) {
      case "Renewal":
        return <Timer className="h-3 w-3" />;
      case "Termination":
        return <FileText className="h-3 w-3" />;
      case "Liability":
        return <Shield className="h-3 w-3" />;
      case "Data Processing":
        return <Brain className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-1.5 rounded-2xl bg-muted px-3.5 py-3 ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-foreground">Key clauses</span>
        <span className="text-[10px] text-muted-foreground">
          {clauses.length} tracked
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {clauses.map((clause) => (
          <span
            key={clause}
            className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[10px] text-foreground ring-1 ring-border"
          >
            {iconForClause(clause)}
            {clause}
          </span>
        ))}
      </div>
    </div>
  );
}

function ImportantDatesCard({ contract }: { contract: Contract }) {
  const items = [
    {
      label: "Next deadline",
      date: contract.nextDeadline,
      tone: "danger"
    },
    {
      label: "Notice period",
      value: `${contract.noticePeriodDays} days`,
      tone: "warning"
    },
    {
      label: "Renewal date",
      date: contract.renewalDate,
      tone: "info"
    }
  ];

  return (
    <div className="space-y-1.5 rounded-2xl bg-muted px-3.5 py-3 ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 text-aiAccent" />
          <span className="text-[11px] font-medium text-foreground">
            Important dates
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-[11px] text-foreground"
          >
            <span className="text-muted-foreground">{item.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                item.tone === "danger" &&
                  "bg-danger-bg text-danger",
                item.tone === "warning" &&
                  "bg-warning-bg text-warning",
                item.tone === "info" && "bg-muted text-aiAccent"
              )}
            >
              {"value" in item && item.value
                ? item.value
                : item.date
                ? format(new Date(item.date), "MMM d, yyyy")
                : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AskContractBox({ contract }: { contract: Contract }) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = (question: string) => {
    if (!question.trim()) return;
    setIsLoading(true);
    setAnswer(null);

    const syntheticQuestion = question.trim();
    setTimeout(() => {
      const base = contract.aiSummary;
      let focused =
        "The agreement includes standard renewal and termination mechanics with data processing obligations aligned to SaaS norms.";
      if (/auto-?renew/i.test(syntheticQuestion)) {
        focused = `This contract uses a ${contract.renewalType.replace(
          "-",
          " "
        )} structure. Non‑renewal generally requires written notice ${
          contract.noticePeriodDays
        } days before ${contract.renewalDate ? "the renewal date" : "each billing cycle"}.`;
      } else if (/notice/i.test(syntheticQuestion)) {
        focused = `The notice window is ${contract.noticePeriodDays} days. Missing this can trigger an automatic extension and maintain existing commercial terms.`;
      } else if (/liability/i.test(syntheticQuestion)) {
        focused =
          "Liability is typically capped at 12 months of fees with carve‑outs for data breaches, confidentiality, and IP infringement, which remain uncapped or subject to higher caps.";
      } else if (/summary|summarise|summarize/i.test(syntheticQuestion)) {
        focused =
          "Renewal maintains current scope with potential pricing uplifts tied to usage. There is flexibility to downsize seats ahead of the renewal date.";
      }

      setAnswer(
        `${focused} In context of your portfolio, this contract contributes a risk score of ${contract.riskScore} and is classified as “${contract.healthLabel}”.`
      );
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-2 rounded-2xl bg-muted px-3.5 py-3 ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Wand2 className="h-3.5 w-3.5 text-aiAccent" />
          <span className="text-[11px] font-medium text-primary">
            Ask this contract
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">No tokens consumed</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {promptSuggestions.map((prompt) => (
          <Chip
            key={prompt}
            onClick={() => {
              setInput(prompt);
              handleAsk(prompt);
            }}
            className="text-[10px]"
          >
            {prompt}
          </Chip>
        ))}
      </div>
      <div className="flex gap-1.5 pt-0.5">
        <Input
          placeholder="Ask about renewal terms, liability, data processing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-8 rounded-full border-border bg-card text-[11px] placeholder:text-muted-foreground"
        />
        <Button
          size="md"
          className="h-8 rounded-full bg-aiAccent text-xs text-primary-foreground hover:bg-aiAccent/90"
          onClick={() => handleAsk(input)}
          disabled={isLoading}
        >
          {isLoading ? "Thinking…" : "Ask"}
        </Button>
      </div>
      {answer && (
        <div className="mt-1 rounded-2xl bg-card px-3 py-2.5 text-[11px] leading-relaxed text-foreground ring-1 ring-border">
          {answer}
        </div>
      )}
    </div>
  );
}

