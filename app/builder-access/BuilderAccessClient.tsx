"use client";

import { useState, type FormEvent } from "react";

function safeNextPath(value: string): string {
  if (value.startsWith("//")) return "/games";
  if (
    value.startsWith("/games") ||
    value.startsWith("/play-amplified") ||
    value.startsWith("/shot-caddy")
  ) {
    return value;
  }
  return "/games";
}

export function BuilderAccessClient({ nextPath }: { nextPath: string }) {
  const destination = safeNextPath(nextPath);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      setMessage("Enter the builder access password.");
      return;
    }

    setBusy(true);
    setMessage("Opening builder access…");

    try {
      const unlockResponse = await fetch("/api/private-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
        cache: "no-store",
      });
      const unlockPayload = await unlockResponse.json().catch(() => ({}));
      if (!unlockResponse.ok) {
        throw new Error(
          typeof unlockPayload?.error === "string"
            ? unlockPayload.error
            : "Builder access could not be verified.",
        );
      }

      const sessionResponse = await fetch("/api/games/account/builder-session", {
        method: "POST",
        cache: "no-store",
      });
      const sessionPayload = await sessionResponse.json().catch(() => ({}));
      if (!sessionResponse.ok) {
        throw new Error(
          typeof sessionPayload?.error === "string"
            ? sessionPayload.error
            : "Play Amplified could not start the builder test session.",
        );
      }

      window.location.replace(destination);
    } catch (error) {
      setBusy(false);
      setMessage(
        error instanceof Error ? error.message : "Builder access is unavailable right now.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#05070b] px-4 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-[32px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(18,42,56,0.82),rgba(5,12,18,0.96))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-9">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/60">
          Play Amplified · Private Test Access
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight">Founder / Builder Access</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">
          This is the private development gate for Play Amplified. It is separate from customer accounts, email sign-in, purchases, and Founder account ownership.
        </p>

        <form onSubmit={submit} className="mt-7 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-white/80">
            Builder access password
            <input
              type="password"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="current-password"
              className="rounded-2xl border border-white/12 bg-black/30 px-4 py-3.5 text-base text-white outline-none transition focus:border-cyan-200/40"
              placeholder="Enter password"
              disabled={busy}
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl bg-cyan-300 px-5 py-4 text-base font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50"
          >
            {busy ? "Opening…" : "Open Play Amplified Test Access"}
          </button>
        </form>

        {message ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
            {message}
          </div>
        ) : null}

        <p className="mt-6 text-xs leading-6 text-white/40">
          Successful builder access creates a temporary all-games test session and returns you directly to Play Amplified. No email or magic link is used.
        </p>
      </div>
    </main>
  );
}
