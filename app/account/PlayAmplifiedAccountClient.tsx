"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getPlayPointBrowserSupabaseClient } from "@/lib/play-point-core/play-point-browser-supabase";
import { getSafeGamesReturnPath } from "@/lib/play-point-core/safe-games-return-path";

export function PlayAmplifiedAccountClient({ returnTo }: { returnTo: string }) {
  const destination = useMemo(
    () => getSafeGamesReturnPath(returnTo, "/games"),
    [returnTo],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Never show an OAuth provider before its credentials/redirects are configured.
  const googleEnabled = process.env.NEXT_PUBLIC_PLAY_AMPLIFIED_GOOGLE_SIGN_IN === "true";
  const passwordEnabled = process.env.NEXT_PUBLIC_PLAY_AMPLIFIED_PASSWORD_SIGN_IN === "true";
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

  function accountReturnUrl(): string {
    const target = new URL("/account", window.location.origin);
    target.searchParams.set("returnTo", destination);
    return target.toString();
  }

  async function signInGoogle() {
    if (!googleEnabled) return;
    setBusy(true);
    setMessage("Opening Google sign-in…");
    const { error } = await getPlayPointBrowserSupabaseClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: accountReturnUrl() },
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
    }
  }

  async function signInPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordEnabled) return;
    if (!email.trim() || !password) {
      setMessage("Enter your email and password.");
      return;
    }

    setBusy(true);
    setMessage("Verifying your Play Amplified account…");
    const { error } = await getPlayPointBrowserSupabaseClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
    }
    // On success, the auth-state listener exchanges the access token for an
    // HTTP-only Games cookie after server-side role and entitlement validation.
  }

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
    const redirectTo = accountReturnUrl();
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

        {googleEnabled && (
          <button
            type="button"
            onClick={signInGoogle}
            disabled={busy}
            className="mt-7 w-full rounded-2xl bg-white px-5 py-4 text-base font-black text-slate-950 disabled:opacity-40"
          >
            Continue with Google
          </button>
        )}

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

        {passwordEnabled && (
          <form onSubmit={signInPassword} className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-bold text-white/78">
              Password for the email above
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300/40 disabled:opacity-40"
              />
            </label>
            <button type="submit" disabled={busy} className="rounded-2xl border border-cyan-300/40 px-5 py-4 font-black disabled:opacity-40">
              Sign in with password
            </button>
          </form>
        )}
        <a
          href={"/builder-access?next=" + encodeURIComponent(destination)}
          className="mt-5 block text-center text-sm font-bold text-cyan-200 underline underline-offset-4"
        >
          Private Builder / test access
        </a>
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm leading-6 text-white/60">
          {message}
        </div>
      </div>
    </main>
  );
}
