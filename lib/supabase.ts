"use client";
import { createBrowserClient } from "@supabase/ssr";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Returns true when Supabase env vars are present.
 * Used as a guard before making any Supabase calls.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Returns a browser-side Supabase client, or null when env vars are missing.
 * Use this in repositories and hooks instead of createClient() so code
 * degrades gracefully in dev/demo mode without credentials.
 */
export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Creates a new browser-side Supabase client.
 * Throws when env vars are missing — use in contexts where Supabase is required.
 */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Add them to your .env.local file."
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Singleton browser client — convenience export for Client Components.
 * Returns null when Supabase is not configured (dev without credentials).
 */
export const supabase =
  supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null;
