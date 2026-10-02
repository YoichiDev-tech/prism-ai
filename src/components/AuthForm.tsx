"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Email + password sign in. No email is sent, so it works even when
 * Supabase's free built-in email sender is rate-limited or blocked.
 * There is no sign-up here: the account is created once in the
 * Supabase dashboard (Authentication -> Users -> Add user).
 */
export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "signing-in" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("signing-in");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    // Full reload so the server picks up the fresh session cookie.
    window.location.href = "/";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="email" className="block text-sm text-ink-muted">
        Sign in
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border border-base-border bg-base-surface px-3 py-2 text-sm text-ink-primary placeholder:text-ink-faint"
      />
      <input
        id="password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-md border border-base-border bg-base-surface px-3 py-2 text-sm text-ink-primary placeholder:text-ink-faint"
      />
      <button
        type="submit"
        disabled={status === "signing-in"}
        className="w-full rounded-md bg-ultron px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-ultron-hover disabled:opacity-50"
      >
        {status === "signing-in" ? "Signing in…" : "Sign in"}
      </button>
      {status === "error" && (
        <p className="text-sm text-ultron">{errorMessage}</p>
      )}
    </form>
  );
}