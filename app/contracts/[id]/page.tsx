import { contracts } from "@/data/contracts";
import { notFound } from "next/navigation";
import { ContractDetailPage } from "@/components/contracts/contract-detail-page";

interface ContractDetailProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetail({ params }: ContractDetailProps) {
  const { id } = await params;
  const contract = contracts.find((c) => c.id === id);

  if (!contract) {
    notFound();
  }

  return <ContractDetailPage contract={contract} />;
}

