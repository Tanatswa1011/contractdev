import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contracts } from "@/data/contracts";

export function RiskOverviewCard() {
  const portfolioScore =
    contracts.reduce((acc, c) => acc + c.riskScore, 0) / contracts.length;

  const label =
    portfolioScore < 40 ? "Healthy" : portfolioScore < 70 ? "Moderate" : "High risk";

  const lowCount = contracts.filter((c) => c.riskLevel === "low").length;
  const mediumCount = contracts.filter((c) => c.riskLevel === "medium").length;
  const highCount = contracts.filter((c) => c.riskLevel === "high").length;

  return (
    <section aria-label="Portfolio risk overview">
      <Card className="border border-border bg-card">
        <CardHeader className="pb-1.5">
          <CardTitle className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Portfolio risk level</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
              Score {Math.round(portfolioScore)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-1">
          {/* Segment labels above bar */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              Low exposure{" "}
              <span className="text-foreground">
                ({lowCount})
              </span>
            </span>
            <span>
              Watchlist{" "}
              <span className="text-foreground">
                ({mediumCount})
              </span>
            </span>
            <span>
              High impact{" "}
              <span className="text-foreground">
                ({highCount})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-success" />
              <div className="absolute inset-y-0 left-1/3 w-1/3 bg-warning" />
              <div className="absolute inset-y-0 right-0 w-1/3 bg-danger" />
              <div
                className="absolute top-0 h-0 w-0 -translate-x-1/2 -translate-y-1/2 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-foreground"
                style={{ left: `${Math.min(portfolioScore, 98)}%` }}
              />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-foreground">{label}</span>
              <span className="text-[11px] text-muted-foreground">
                {portfolioScore < 40
                  ? "Most contracts are low risk."
                  : portfolioScore < 70
                  ? "Focused monitoring recommended."
                  : "Immediate remediation recommended."}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              Low exposure
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-warning" />
              Watchlist
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-danger" />
              High impact
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

