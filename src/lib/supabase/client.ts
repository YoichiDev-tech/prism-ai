import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser (Client Components, hooks).
 * Reads the two public env vars — safe to expose, they're the
 * project's public URL + anon key, which RLS policies keep in check.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
