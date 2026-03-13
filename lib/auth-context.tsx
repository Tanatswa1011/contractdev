"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
}

interface AuthContextValue extends AuthState {
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    configured,
  });

  useEffect(() => {
    if (!configured || !supabase) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        configured,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        configured,
      });
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: "Supabase is not configured" };
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error?.message ?? null };
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: "Supabase is not configured" };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
