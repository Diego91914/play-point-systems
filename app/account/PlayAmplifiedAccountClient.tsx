"use client";

import { useEffect, useMemo, useState } from "react";
import { getPlayPointBrowserSupabaseClient } from "@/lib/play-point-core/play-point-browser-supabase";
import { getSafeGamesReturnPath } from "@/lib/play-point-core/safe-games-return-path";

export function PlayAmplifiedAccountClient({ returnTo }: { returnTo: string }) {
  const destination = useMemo(
    () => getSafeGamesReturnPath(returnTo, "/games"),
    [returnTo],
  );
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("Checking your Play Amplified session…");

  useEffect(() => {
    const supabase = getPlayPointBrowserSupabaseClient();
    let cancelled = false;

    async function finishAccountSession(session: import("@supabase/supabase-js").Session | null) {
      if (cancelled) return;
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
      if (cancelled) return;
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

    function recoveryFailed() {
      if (!cancelled) { setBusy(false); setMessage("Unable to restore your account. Please sign in with Google."); }
    }
    void supabase.auth.getSession().then(({ data }) => finishAccountSession(data.session)).catch(recoveryFailed);
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Do not call getSession inside the auth callback: it holds the auth lock.
      if (session) void finishAccountSession(session).catch(recoveryFailed);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [destination]);

  async function signInGoogle() {
    setBusy(true);
    setMessage("Opening Google sign-in…");
    try {
      const redirectTo = new URL("/account", window.location.origin);
      redirectTo.searchParams.set("returnTo", destination);
      const { error } = await getPlayPointBrowserSupabaseClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      });
      if (error) throw error;
    } catch (error) {
      setBusy(false);
      setMessage(error instanceof Error ? error.message : "Unable to open Google sign-in.");
    }
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

        <button
          type="button"
          onClick={() => void signInGoogle()}
          disabled={busy}
          className="mt-7 w-full rounded-2xl bg-cyan-300 px-5 py-4 text-base font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50"
        >
          {busy ? "Connecting…" : "Continue with Google"}
        </button>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm leading-6 text-white/60">
          {message}
        </div>
      </div>
    </main>
  );
}
