"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

type AuthMode = "login" | "signup";

interface AuthCardProps {
  mode: AuthMode;
}

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/dashboard");
  const client = useMemo(() => getSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";
  const title = isSignup ? "Create your account" : "Sign in to ContractGuardAI";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = new URLSearchParams(window.location.search).get("next");
    setNextPath(next || "/dashboard");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isSupabaseConfigured() || !client) {
      setError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignup) {
        const { error: signUpError } = await client.auth.signUp({
          email,
          password
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setMessage("Account created. You can now sign in.");
        router.replace("/login");
        return;
      }

      const { error: signInError } = await client.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace(nextPath);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
            />
          </div>

          {isSignup && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Confirm password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-xs text-success">
              {message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : isSignup
              ? "Create account"
              : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"} className="text-foreground underline">
            {isSignup ? "Log in" : "Sign up"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
