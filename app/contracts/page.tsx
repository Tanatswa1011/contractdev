import { ContractsPage } from "@/components/contracts/contracts-page";
import { RequireAuth } from "@/components/auth/require-auth";

export default function Page() {
  return (
    <RequireAuth>
      <ContractsPage />
    </RequireAuth>
  );
}

