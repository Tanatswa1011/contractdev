import { SettingsPage } from "@/components/settings/settings-page";
import { SessionGate } from "@/components/auth/session-gate";

export default function SettingsRoute() {
  return (
    <SessionGate mode="protected" redirectTo="/login">
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <SettingsPage />
      </main>
    </SessionGate>
  );
}
