"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

type AuthMode = "login" | "signup";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({
  mode,
  nextPath = "/dashboard",
}: {
  mode: AuthMode;
  nextPath?: string;
}) {
  const isSignup = mode === "signup";
  const { isConfigured, supabase } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const validate = () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      return "Enter a valid email address.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (isSignup && password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!isConfigured || !supabase) {
      setError("Supabase is not configured yet. Add the public URL and anon key to continue.");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignup) {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signupError) {
          throw signupError;
        }

        if (data.session) {
          router.replace(nextPath);
          return;
        }

        setMessage(
          "Your account was created. Check your email for the confirmation link, then log in."
        );
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (loginError) {
          throw loginError;
        }

        router.replace(nextPath);
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center px-4 py-10 md:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <Card className="border border-border bg-card">
          <CardHeader className="flex-col items-start gap-2 pb-2">
            <CardTitle className="text-2xl font-semibold text-foreground">
              {isSignup ? "Create your workspace" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {isSignup
                ? "Start tracking contracts, deadlines, and portfolio risk with Supabase-backed access."
                : "Sign in to reach your dashboard, contracts, and workspace settings."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {!isConfigured && (
              <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> before signing in.
              </div>
            )}
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-medium text-foreground">Email address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSignup ? "Create a strong password" : "Enter your password"}
                  className="mt-1"
                />
              </div>
              {isSignup && (
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Confirm password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your password"
                    className="mt-1"
                  />
                </div>
              )}
              {error && (
                <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                  {message}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? isSignup
                    ? "Creating account…"
                    : "Signing in…"
                  : isSignup
                  ? "Create account"
                  : "Sign in"}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Need an account?"}{" "}
              <Link
                href={isSignup ? "/login" : "/signup"}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {isSignup ? "Log in" : "Sign up"}
              </Link>
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-muted/30">
          <CardHeader className="flex-col items-start gap-2 pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">
              Why teams use ContractGuardAI
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Keep the current portfolio view, but connect it to real auth and real workspace data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="font-medium text-foreground">Track renewals before they slip</p>
              <p className="mt-1">
                Monitor notice windows, high-risk contracts, and review status from the same dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="font-medium text-foreground">Upload and organize the latest version</p>
              <p className="mt-1">
                Save the current file, update versions, and export contract data without leaving the app.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="font-medium text-foreground">Configure the workspace you already have</p>
              <p className="mt-1">
                Notification preferences, AI defaults, member invites, and billing contact details stay in one place.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
