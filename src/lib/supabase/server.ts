import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for the server (Server Components, Route Handlers,
 * Server Actions). It reads/writes the auth session via cookies so the
 * logged-in user carries through server-side rendering and API routes.
 *
 * Next.js 15 made `cookies()` from "next/headers" async, so this
 * factory is async too — every caller must `await createClient()`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component (not a Route Handler/Action).
            // Safe to ignore — middleware.ts refreshes the session instead.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Same as above — no-op when called from a Server Component.
          }
        },
      },
    }
  );
}
