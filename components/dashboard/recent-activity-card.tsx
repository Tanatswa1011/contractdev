"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contracts } from "@/data/contracts";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, Edit3, FileText } from "lucide-react";

function activityIcon(description: string) {
  const text = description.toLowerCase();
  if (text.includes("reminder")) return <Bell className="h-3.5 w-3.5" />;
  if (text.includes("incident") || text.includes("flagged")) {
    return <AlertTriangle className="h-3.5 w-3.5" />;
  }
  if (text.includes("updated") || text.includes("created")) {
    return <Edit3 className="h-3.5 w-3.5" />;
  }
  return <FileText className="h-3.5 w-3.5" />;
}

export function RecentActivityCard() {
  const activities = contracts
    .flatMap((c) => c.recentActivities.map((a) => ({ ...a, contract: c })))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 6);

  return (
    <section aria-label="Recent contract activity">
      <Card className="border border-border bg-card">
        <CardHeader className="pb-1.5">
          <CardTitle className="text-sm font-semibold text-foreground">
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-0">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/contracts/${activity.contract.id}`}
              className={cn(
                "flex items-start justify-between gap-3 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground",
                "hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              )}
            >
              <div className="flex flex-1 min-w-0 items-start gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  {activityIcon(activity.description)}
                </span>
                <div className="flex flex-1 flex-col min-w-0">
                  <p className="text-foreground">{activity.description}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {activity.contract.name}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {activity.relativeTime}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

