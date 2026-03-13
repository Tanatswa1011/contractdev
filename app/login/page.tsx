"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setSubmitting(true);
    const { error: authError } = await signIn(email, password);
    setSubmitting(false);

    if (authError) {
      setError(authError);
    } else {
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-[11px] font-semibold tracking-tight">
          CG
        </div>
        <span className="text-xs font-medium text-foreground">
          ContractGuardAI
        </span>
      </div>

      <Card className="w-full max-w-sm border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-lg font-semibold text-foreground">
            Log in to your account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!configured && (
            <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-warning">
              Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs text-muted-foreground"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs text-muted-foreground"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-[11px] text-danger">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={submitting || !configured}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
