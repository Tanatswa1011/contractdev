"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SetupRequiredStateProps {
  title: string;
  description: string;
}

export function SetupRequiredState({
  title,
  description,
}: SetupRequiredStateProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center px-4 py-10 md:px-8">
      <Card className="w-full border border-border bg-card">
        <CardHeader className="flex-col items-start gap-2 pb-2">
          <CardTitle className="text-xl font-semibold text-foreground">
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-2 text-sm text-muted-foreground">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="font-medium text-foreground">Required environment variables</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/login">Go to login</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/">Back to landing page</Link>
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            After adding the variables, paste the SQL from <code>supabase/schema.sql</code> into
            the Supabase SQL editor, then reload the app.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
