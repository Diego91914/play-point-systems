"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const handoff = params.get("handoff")?.trim() ?? "";
    let cancelled = false;

    if (!handoff) {
      const target = new URL("/account/play-point", window.location.origin);
      target.searchParams.set("next", destination);
      window.location.replace(target.toString());
      return () => {
        cancelled = true;
      };
    }

    setError("");

    void fetch("/api/games/account/shot-caddy-handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: handoff }),
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : "Unable to verify your Play Amplified account.",
          );
        }
        if (!cancelled) window.location.replace(destination);
      })
      .catch((handoffError) => {
        if (!cancelled) {
          window.history.replaceState(
            null,
            "",
            `/games/sign-in?next=${encodeURIComponent(destination)}`,
          );
          setError(
            handoffError instanceof Error
              ? handoffError.message
              : "Unable to verify your Play Amplified account.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [destination]);

  function retryAccountConnection() {
    setError("");
    const target = new URL("/account/play-point", window.location.origin);
    target.searchParams.set("next", destination);
    window.location.assign(target.toString());
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[32px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(18,42,56,0.82),rgba(5,12,18,0.95))] p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-9">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/65">
        Play Amplified · One account
      </div>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
        Connecting your account…
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/66">
        Play Amplified is checking your existing account session and will return you to the game automatically. Once your Founder access is verified on this device, you should not need to repeat this step during normal use.
      </p>

      {error ? (
        <>
          <div role="alert" className="mt-6 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
          <button
            type="button"
            onClick={retryAccountConnection}
            className="mt-5 w-full rounded-2xl bg-cyan-300 px-5 py-4 text-base font-black text-slate-950 transition hover:brightness-105"
          >
            Retry account connection
          </button>
        </>
      ) : (
        <div className="mx-auto mt-7 h-7 w-7 animate-spin rounded-full border-2 border-cyan-200/25 border-t-cyan-200" aria-label="Connecting" />
      )}

      <p className="mt-6 text-xs leading-6 text-white/42">
        Builder/private-preview access and your Play Amplified account are separate safeguards. Your Play Amplified account is the identity that controls Founder status and game ownership.
      </p>
    </div>
  );
}
