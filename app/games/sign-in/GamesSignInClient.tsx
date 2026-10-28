"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlayPointBrowserSupabaseClient } from "@/lib/play-point-core/play-point-browser-supabase";
import { getSafeGamesReturnPath } from "@/lib/play-point-core/safe-games-return-path";

export function GamesSignInClient({ nextPath }: { nextPath: string }) {
  const destination = getSafeGamesReturnPath(nextPath, "/play-amplified");
  const [error, setError] = useState("");
  const [showAccessChoices, setShowAccessChoices] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const handoff = params.get("handoff")?.trim() ?? "";
    let cancelled = false;

    async function connect() {
      setError("");

      if (handoff) {
        const response = await fetch("/api/games/account/shot-caddy-handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: handoff }),
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : "Unable to verify your Play Amplified account.",
          );
        }
        if (!cancelled) window.location.replace(destination);
        return;
      }

      // Restore a signed-in Founder account before attempting builder test access.
      // Reinstalled PWAs can lose the game cookie while retaining Supabase auth.
      const { data } = await getPlayPointBrowserSupabaseClient().auth.getSession();
      if (data.session) {
        const accountResponse = await fetch("/api/games/account/session", {
          method: "POST",
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        });
        if (accountResponse.ok) {
          if (!cancelled) window.location.replace(destination);
          return;
        }
      }

      const builderResponse = await fetch("/api/games/account/builder-session", {
        method: "POST",
        cache: "no-store",
      });
      if (builderResponse.ok) {
        if (!cancelled) window.location.replace(destination);
        return;
      }

      // Account sign-in and the separate builder gate must be explicit choices.
      // Neither allows access until independently verified by the server.
      if (!cancelled) setShowAccessChoices(true);
    }

    void connect().catch((connectError) => {
      if (!cancelled) {
        window.history.replaceState(
          null,
          "",
          `/games/sign-in?next=${encodeURIComponent(destination)}`,
        );
        setError(
          connectError instanceof Error
            ? connectError.message
            : "Unable to open Play Amplified right now.",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [destination]);

  function retryConnection() {
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[32px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(18,42,56,0.82),rgba(5,12,18,0.95))] p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-9">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/65">
        Play Amplified · Access
      </div>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
        Opening Play Amplified…
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/66">
        Your existing Founder or Play Amplified session is checked first. If you need to reconnect, choose account sign-in or private builder access below.
      </p>

      {error ? (
        <>
          <div role="alert" className="mt-6 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
          <button
            type="button"
            onClick={retryConnection}
            className="mt-5 w-full rounded-2xl bg-cyan-300 px-5 py-4 text-base font-black text-slate-950 transition hover:brightness-105"
          >
            Retry
          </button>
        </>
      ) : showAccessChoices ? (
        <div className="mt-7 grid gap-3 text-left">
          <Link
            href={`/account?returnTo=${encodeURIComponent(destination)}`}
            className="rounded-2xl bg-cyan-300 px-5 py-4 text-center text-base font-black text-slate-950 transition hover:brightness-105"
          >
            Sign in to my Play Amplified account
          </Link>
          <Link
            href={`/builder-access?next=${encodeURIComponent(destination)}`}
            className="rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 text-center text-sm font-bold text-white/85 transition hover:bg-white/[0.1]"
          >
            Use private builder access
          </Link>
        </div>
      ) : (
        <div
          role="status"
          aria-label="Connecting"
          className="mx-auto mt-7 h-7 w-7 animate-spin rounded-full border-2 border-cyan-200/25 border-t-cyan-200"
        />
      )}

      <p className="mt-6 text-xs leading-6 text-white/42">
        Builder access is only for approved pre-launch testing and does not replace your Founder account.
      </p>
    </div>
  );
}
