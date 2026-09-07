"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getPlayPointBrowserSupabaseClient } from "@/lib/play-point-core/play-point-browser-supabase";

function safeReturnPath(value: string): string {
  if (!value || value.startsWith("//")) return "/games";
  if (
    value.startsWith("/games") ||
    value.startsWith("/play-amplified") ||
    value.startsWith("/shot-caddy")
  ) {
    return value;
  }
  return "/games";
}

export function PlayAmplifiedAccountClient({ returnTo }: { returnTo: string }) {
  const destination = useMemo(() => safeReturnPath(returnTo), [returnTo]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("Checking your Play Amplified session…");

  useEffect(() => {
    const supabase = getPlayPointBrowserSupabaseClient();
    let cancelled = false;

    async function finishAccountSession() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const session = data.session;
      if (!session) {
        setBusy(false);
        setMessage("Sign in to your Play Amplified account.");
        return;
      }

      setBusy(true);
      setMessage("Connecting your Play Amplified account…");
      const response = await fetch("/api/games/account/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setBusy(false);
        setMessage(
          typeof payload?.error === "string"
            ? payload.error
            : "Unable to connect your Play Amplified account.",
        );
        return;
      }

      window.location.replace(destination);
    }

    void finishAccountSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void finishAccountSession();
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [destination]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage("Enter your email address.");
      return;
    }

    setBusy(true);
    setMessage("Sending your Play Amplified sign-in link…");
    const supabase = getPlayPointBrowserSupabaseClient();
    const redirectTo = `${window.location.origin}/account?returnTo=${encodeURIComponent(destination)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    setMessage(
      error
        ? error.message
        : "Check your email and open the Play Amplified sign-in link.",
    );
  }

  return (
    <main className="min-h-screen bg-[#07111d] px-5 py-12 text-white">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-cyan-300/15 bg-white/5 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-9">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/65">
          Play Amplified Account
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Sign in once. Play everywhere.</h1>
        <p className="mt-4 text-sm leading-7 text-white/68">
          Your Play Amplified account controls your game ownership across the website, PWA, and native app. Builder access is separate and never requires email verification.
        </p>

        <form onSubmit={sendMagicLink} className="mt-7 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-white/78">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={busy}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300/40 disabled:opacity-50"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl bg-cyan-300 px-5 py-4 text-base font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50"
          >
            {busy ? "Checking…" : "Email me a sign-in link"}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm leading-6 text-white/60">
          {message}
        </div>
      </div>
    </main>
  );
}
