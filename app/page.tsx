import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <main className="px-4 py-10 md:px-8 md:py-14">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Card className="border border-border bg-card">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-2xl font-semibold text-foreground">
              ContractGuardAI
            </CardTitle>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Contract intelligence for renewals, risk, and obligations. Track key dates, review
              contract health, and keep your portfolio actionable from one workspace.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Why teams use ContractGuardAI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>See renewal windows before they become escalations.</p>
            <p>Understand risk levels and contract obligations at a glance.</p>
            <p>Keep legal, finance, and operations aligned on next steps.</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

