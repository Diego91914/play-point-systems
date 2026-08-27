"use client";

import { useEffect, useState } from "react";

function safeNextPath(value: string): string {
  if (!value.startsWith("/games") || value.startsWith("//")) return "/games";
  if (value.startsWith("/games/sign-in")) return "/games";
  return value;
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
          Play Point Systems · Games
        </div>
        <h1 className="marketing-headline mt-5 text-4xl sm:text-5xl">
          Your games. One account.
        </h1>
        <p className="mt-5 text-base leading-8 text-white/72">
          Your Shot Caddy account is your Play Point Games account. Sign in once with the account you already use and your access follows you into the Games library.
        </p>
        <div className="mt-7 grid gap-3 text-sm text-white/74">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <span className="font-black text-white">Same identity.</span> No second Play Point password to remember.
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <span className="font-black text-white">Same Founder access.</span> Founder status is verified from the Shot Caddy account itself.
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <span className="font-black text-white">One library.</span> Play Point titles and connected Shot Caddy games stay together here.
          </div>
        </div>
      </section>

      <section className="flex flex-col justify-center rounded-[32px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(18,42,56,0.82),rgba(5,12,18,0.95))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/65">
          Play Point Account
        </div>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
          Continue with Shot Caddy
        </h2>
        <p className="mt-4 text-sm leading-7 text-white/66">
          If you are already signed in on Shot Caddy, you will come straight back here. Otherwise Shot Caddy will ask you to sign in using its normal account screen.
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
          {busy ? "Connecting…" : "Continue with Shot Caddy"}
        </button>

        <p className="mt-5 text-xs leading-6 text-white/46">
          Play Point never receives your Shot Caddy password. Shot Caddy sends a short-lived, one-time account confirmation that is consumed immediately after sign-in.
        </p>
      </section>
    </div>
  );
}
