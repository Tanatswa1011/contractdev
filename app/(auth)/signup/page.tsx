"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) }
  ];
  if (!password) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {checks.map((c) => (
        <span
          key={c.label}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
            c.pass
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <CheckCircle className="h-2.5 w-2.5" />
          {c.label}
        </span>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }
    } catch (err: unknown) {
      // Supabase not configured — allow demo access
      if (!(err instanceof Error) || !err.message.includes("Missing")) {
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    // Supabase may auto-confirm or require email verification
    setSuccess(true);
    setIsLoading(false);

    // If email confirmation is disabled (dev/demo), redirect immediately
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Account created!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Check your email for a confirmation link, or you&apos;ll be redirected
          to the dashboard shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start monitoring your contracts for free — no card required.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error banner */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Full name */}
          <div className="space-y-1.5">
            <label
              htmlFor="fullName"
              className="block text-xs font-medium text-foreground"
            >
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ada Lovelace"
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-foreground"
            >
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@company.com"
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 pr-9 text-xs text-foreground placeholder:text-muted-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Terms */}
          <p className="text-[11px] text-muted-foreground">
            By creating an account you agree to our{" "}
            <a href="#" className="text-foreground hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-foreground hover:underline">
              Privacy Policy
            </a>
            .
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-2.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isLoading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
