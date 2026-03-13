import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <main className="px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <DashboardShell />
      </main>
    </RequireAuth>
  );
}
