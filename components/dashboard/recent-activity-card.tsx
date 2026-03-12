"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contracts } from "@/data/contracts";
import { cn } from "@/lib/utils";

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
              <div className="flex flex-1 flex-col min-w-0">
                <p className="text-foreground">{activity.description}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {activity.contract.name}
                </p>
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

