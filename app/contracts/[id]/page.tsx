import { RequireAuth } from "@/components/auth/require-auth";
import { ContractDetailRoute } from "@/components/contracts/contract-detail-page";

interface ContractDetailProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetail({ params }: ContractDetailProps) {
  const { id } = await params;
  return (
    <RequireAuth>
      <ContractDetailRoute contractId={id} />
    </RequireAuth>
  );
}

