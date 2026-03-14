import { Contract, TimelineEvent } from "@/types/contract";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ContractsTimelineProps {
  contracts: Contract[];
}

function getTimelineBounds(contracts: Contract[]) {
  const dates: Date[] = [];
  contracts.forEach((c) => {
    dates.push(new Date(c.startDate));
    if (c.endDate) dates.push(new Date(c.endDate));
    if (c.renewalDate) dates.push(new Date(c.renewalDate));
    dates.push(new Date(c.nextDeadline));
  });
  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));
  return { min, max };
}

function getPosition(date: string, min: Date, max: Date) {
  const d = new Date(date);
  const total = max.getTime() - min.getTime() || 1;
  const offset = d.getTime() - min.getTime();
  return Math.min(100, Math.max(0, (offset / total) * 100));
}

function contractColor(_: Contract["riskLevel"]) {
  return "bg-zinc-500";
}

function markerColor(event: TimelineEvent) {
  if (event.type === "notice-deadline" || event.isCritical) return "bg-zinc-900";
  if (event.type === "renewal") return "bg-zinc-700";
  if (event.type === "notice-window-open") return "bg-zinc-500";
  return "bg-zinc-400";
}

export function ContractsTimeline({ contracts }: ContractsTimelineProps) {
  const { min, max } = getTimelineBounds(contracts);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card px-4 py-4">
      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Contract lifecycle</span>
        <span>
          {format(min, "MMM yyyy")} – {format(max, "MMM yyyy")}
        </span>
      </div>
      <div className="relative space-y-3">
        <div className="absolute left-0 right-0 top-0 h-px bg-border" />
        {contracts.map((contract) => {
          const start = getPosition(contract.startDate, min, max);
          const end = getPosition(
            contract.endDate ?? contract.renewalDate ?? contract.nextDeadline,
            min,
            max
          );
          const width = Math.max(8, end - start);

          return (
            <div
              key={contract.id}
              className="relative flex flex-col gap-1.5 rounded-xl bg-secondary px-2 py-2.5 ring-1 ring-border"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[13px] font-medium text-foreground">
                    {contract.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {contract.vendor} • {contract?.renewalType?.replace("-", " ") ?? ""}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Next:{" "}
                  {format(new Date(contract.nextDeadline), "MMM d")}
                </span>
              </div>
              <div className="relative mt-2 h-7 rounded-full bg-muted">
                <div
                  className={cn(
                    "absolute top-1/2 h-3 -translate-y-1/2 rounded-full",
                    contractColor(contract.riskLevel)
                  )}
                  style={{
                    left: `${start}%`,
                    width: `${width}%`
                  }}
                />
                {contract.timelineEvents.map((event) => (
                  <div
                    key={event.id}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${getPosition(event.date, min, max)}%` }}
                  >
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full border border-black shadow-sm",
                        markerColor(event)
                      )}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                {contract.timelineEvents
                  .filter((e) => e.type === "notice-deadline" || e.type === "renewal")
                  .map((event) => (
                    <span
                      key={event.id}
                      className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 ring-1 ring-border"
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          markerColor(event)
                        )}
                      />
                      {event.label} •{" "}
                      {format(new Date(event.date), "MMM d")}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

