import { AuthCard } from "@/components/auth/auth-card";
import { SessionGate } from "@/components/auth/session-gate";

export default function LoginPage() {
  return (
    <SessionGate mode="public-only" redirectTo="/dashboard">
      <main className="px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto w-full max-w-md">
          <AuthCard mode="login" />
        </div>
      </main>
    </SessionGate>
  );
}
