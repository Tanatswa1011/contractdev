import { ContractsPage } from "@/components/contracts/contracts-page";
import { SessionGate } from "@/components/auth/session-gate";

export const metadata = {
  title: "Contracts — ContractGuardAI"
};

export default function Page() {
  return (
    <SessionGate mode="protected" redirectTo="/login">
      <ContractsPage />
    </SessionGate>
  );
}
