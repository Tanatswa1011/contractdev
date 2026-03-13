"use client";
import { createBrowserClient } from "@supabase/ssr";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Creates a new browser-side Supabase client.
 * Safe to call multiple times — each call returns a fresh client.
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
