import { SettingsPage } from "@/components/settings/settings-page";
import { RequireAuth } from "@/components/auth/require-auth";

export default function SettingsRoute() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <SettingsPage />
      </main>
    </RequireAuth>
  );
}
