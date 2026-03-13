"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ContractDetailPage } from "@/components/contracts/contract-detail-page";
import { SessionGate } from "@/components/auth/session-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadContracts } from "@/lib/contracts-repository";
import { Contract } from "@/types/contract";

export default function ContractDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    loadContracts()
      .then((result) => {
        if (!isMounted) return;
        setContract(result.contracts.find((item) => item.id === id) ?? null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <SessionGate mode="protected" redirectTo="/login">
        <main className="px-4 py-8 md:px-8">
          <Card className="mx-auto max-w-xl border border-border bg-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Loading contract...
            </CardContent>
          </Card>
        </main>
      </SessionGate>
    );
  }

  if (!contract) {
    return (
      <SessionGate mode="protected" redirectTo="/login">
        <main className="px-4 py-8 md:px-8">
          <Card className="mx-auto max-w-xl border border-border bg-card">
            <CardContent className="space-y-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">Contract not found</p>
              <p className="text-xs text-muted-foreground">
                This contract may have been deleted or is no longer accessible.
              </p>
              <Button asChild>
                <Link href="/contracts">Return to contracts</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </SessionGate>
    );
  }

  return (
    <SessionGate mode="protected" redirectTo="/login">
      <ContractDetailPage contract={contract} />
    </SessionGate>
  );
}

