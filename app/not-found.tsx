import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center px-4 py-10 md:px-8">
      <Card className="w-full border border-border bg-card">
        <CardHeader className="flex-col items-start gap-2 pb-2">
          <CardTitle className="text-xl font-semibold text-foreground">
            Page not found
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            The page or contract you requested is not available in this workspace.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-2">
          <Button asChild size="sm">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/contracts">View contracts</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
