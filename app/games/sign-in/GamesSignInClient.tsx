"use client";

import { useEffect, useState } from "react";
import { getPlayPointBrowserSupabaseClient } from "@/lib/play-point-core/play-point-browser-supabase";
import { restoreGamesAccount } from "@/lib/play-point-core/restore-games-account";

function safeNextPath(value: string): string {
  if (value.startsWith("//")) return "/play-amplified";
  if (value.startsWith("/games/sign-in")) return "/play-amplified";
  if (
    value.startsWith("/games") ||
    value.startsWith("/play-amplified") ||
    value.startsWith("/shot-caddy")
  ) {
    return value;
  }
  return "/play-amplified";
}

export function GamesSignInClient({ nextPath }: { nextPath: string }) {
  const destination = safeNextPath(nextPath);
  const [error, setError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const handoff = params.get("handoff")?.trim() ?? "";
    let cancelled = false;

    async function connect() {
      setError("");
      setNeedsSignIn(false);

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

      const { data, error: sessionError } = await getPlayPointBrowserSupabaseClient().auth.getSession();
      if (sessionError) throw new Error("Unable to check your saved account. Please retry.");
      if (cancelled) return;
      if (data.session && await restoreGamesAccount(data.session.access_token)) {
        if (!cancelled) window.location.replace(destination);
        return;
      }

      const builderResponse = await fetch("/api/games/account/builder-session", {
        method: "POST",
        cache: "no-store",
      });
      if (builderResponse.ok) {
        if (!cancelled) window.location.replace(destination);
        return;
      }

      if (builderResponse.status !== 401) throw new Error("Unable to check private access. Please retry.");
      if (!cancelled) setNeedsSignIn(true);
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
        {needsSignIn ? "Private Play Amplified access" : "Opening Play Amplified…"}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/66">
        Restore your existing Founder account or use your private Builder access.
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
      ) : needsSignIn ? (
        <div className="mt-7 grid gap-3">
          <a href={`/shot-caddy/account/play-point?next=${encodeURIComponent(destination)}`} className="rounded-2xl bg-cyan-300 px-5 py-4 font-black text-slate-950">
            Sign in with Founder account
          </a>
          <a href={`/builder-access?next=${encodeURIComponent(destination)}`} className="rounded-2xl border border-white/20 px-5 py-4 font-bold text-white">
            Use Builder password
          </a>
        </div>
      ) : (
        <div
          role="status"
          aria-label="Connecting"
          className="mx-auto mt-7 h-7 w-7 animate-spin rounded-full border-2 border-cyan-200/25 border-t-cyan-200"
        />
      )}

      <p className="mt-6 text-xs leading-6 text-white/42">
        Builder access is separate from customer accounts, email sign-in, purchases, and Founder account ownership.
      </p>
    </div>
  );
}
