import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SessionGate } from "@/components/auth/session-gate";

export const metadata = {
  title: "Dashboard — ContractGuardAI"
};

export default function DashboardPage() {
  return (
    <SessionGate mode="protected" redirectTo="/login">
      <main className="px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <DashboardShell />
      </main>
    </SessionGate>
  );
}
