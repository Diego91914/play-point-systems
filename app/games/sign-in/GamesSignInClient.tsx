"use client";

import { useEffect, useState } from "react";

function safeNextPath(value: string): string {
  if (value.startsWith("//")) return "/play-amplified";
  if (value.startsWith("/games/sign-in")) return "/play-amplified";
  if (value.startsWith("/games") || value.startsWith("/play-amplified")) return value;
  return "/play-amplified";
}

export function GamesSignInClient({ nextPath }: { nextPath: string }) {
  const destination = safeNextPath(nextPath);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const handoff = params.get("handoff")?.trim() ?? "";
    if (!handoff) return;

    let cancelled = false;
    setBusy(true);
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
              : "Unable to verify your Shot Caddy account.",
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
              : "Unable to verify your Shot Caddy account.",
          );
          setBusy(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [destination]);

  function continueWithShotCaddy() {
    setBusy(true);
    setError("");
    const target = new URL("https://shotcaddy.net/account/play-point");
    target.searchParams.set("next", destination);
    window.location.assign(target.toString());
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
      <section className="rounded-[32px] border border-amber-200/15 bg-[linear-gradient(150deg,rgba(219,174,84,0.13),rgba(255,255,255,0.03))] p-6 sm:p-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-amber-100/70">
          Play Amplified · One account
        </div>
        <h1 className="marketing-headline mt-5 text-4xl sm:text-5xl">
          Sign in once. Keep playing here.
        </h1>
        <p className="mt-5 text-base leading-8 text-white/72">
          Your Shot Caddy identity verifies your Play Amplified account once. After that, this device remembers your Play Amplified session and your Founder access without sending you back through Shot Caddy every visit.
        </p>
        <div className="mt-7 grid gap-3 text-sm text-white/74">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <span className="font-black text-white">Same identity.</span> No second password to remember.
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <span className="font-black text-white">Founder remembered.</span> Verified Founder access stays attached to this Play Amplified session.
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <span className="font-black text-white">Return where you started.</span> After verification, Play Amplified brings you back to the game or catalog page you came from.
          </div>
        </div>
      </section>

      <section className="flex flex-col justify-center rounded-[32px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(18,42,56,0.82),rgba(5,12,18,0.95))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/65">
          One-time account verification
        </div>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
          Verify with Shot Caddy
        </h2>
        <p className="mt-4 text-sm leading-7 text-white/66">
          Play Amplified uses your existing Shot Caddy account to confirm who you are and whether you are a Founder. When verification finishes, you come straight back to Play Amplified.
        </p>

        {error ? (
          <div role="alert" className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={continueWithShotCaddy}
          disabled={busy}
          className="mt-7 w-full rounded-2xl bg-cyan-300 px-5 py-4 text-base font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50"
        >
          {busy ? "Connecting…" : "Verify account"}
        </button>

        <p className="mt-5 text-xs leading-6 text-white/46">
          Your password never leaves Shot Caddy. Play Amplified receives only a short-lived one-time account confirmation, then keeps its own signed session on this device.
        </p>
      </section>
    </div>
  );
}
