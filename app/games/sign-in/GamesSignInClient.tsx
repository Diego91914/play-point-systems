"use client";

import { useEffect, useState } from "react";
import { getPlayPointBrowserSupabaseClient } from "@/lib/play-point-core/play-point-browser-supabase";

function safeNextPath(value: string): string {
  if (!value.startsWith("/games") || value.startsWith("//")) return "/games";
  if (value.startsWith("/games/sign-in")) return "/games";
  return value;
}

export function GamesSignInClient({ nextPath }: { nextPath: string }) {
  const destination = safeNextPath(nextPath);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<"signin" | "signup" | "reset" | "update" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  async function establishGamesSession(accessToken: string) {
    const response = await fetch("/api/games/account/session", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Unable to open your Play Point Games account."
      );
    }
    window.location.replace(destination);
  }

  useEffect(() => {
    const supabase = getPlayPointBrowserSupabaseClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      void establishGamesSession(data.session.access_token).catch((sessionError) => {
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Unable to restore your Games session."
        );
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });

    return () => listener.subscription.unsubscribe();
  // destination is stable for this page load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitAuth(mode: "signin" | "signup") {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Use a password with at least 8 characters when creating an account.");
      return;
    }

    setBusy(true);
    setAction(mode);
    setError("");
    setNotice("");

    try {
      const supabase = getPlayPointBrowserSupabaseClient();
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                emailRedirectTo: `https://www.playpointsystems.com/games/sign-in?next=${encodeURIComponent(destination)}`,
              },
            })
          : await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });

      if (result.error) throw result.error;
      setPassword("");

      if (!result.data.session) {
        setNotice(
          `Account created. Check ${cleanEmail} for the confirmation link, then return here to sign in.`
        );
        return;
      }

      await establishGamesSession(result.data.session.access_token);
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "Account sign-in failed."
      );
    } finally {
      setBusy(false);
      setAction(null);
    }
  }

  async function sendPasswordReset() {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Enter your email address first.");
      return;
    }

    setBusy(true);
    setAction("reset");
    setError("");
    setNotice("");
    try {
      const { error: resetError } = await getPlayPointBrowserSupabaseClient()
        .auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `https://www.playpointsystems.com/games/sign-in?next=${encodeURIComponent(destination)}`,
        });
      if (resetError) throw resetError;
      setNotice(`Password reset email sent to ${cleanEmail}.`);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to send the password reset email."
      );
    } finally {
      setBusy(false);
      setAction(null);
    }
  }

  async function updateRecoveredPassword() {
    if (password.length < 8) {
      setError("Use a new password with at least 8 characters.");
      return;
    }

    setBusy(true);
    setAction("update");
    setError("");
    setNotice("");
    try {
      const supabase = getPlayPointBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Your recovery session expired. Request another reset link.");
      setPassword("");
      setPasswordRecovery(false);
      await establishGamesSession(data.session.access_token);
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Unable to update your password."
      );
    } finally {
      setBusy(false);
      setAction(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
      <section className="rounded-[32px] border border-amber-200/15 bg-[linear-gradient(150deg,rgba(219,174,84,0.13),rgba(255,255,255,0.03))] p-6 sm:p-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-amber-100/70">
          Play Point Systems · Games
        </div>
        <h1 className="marketing-headline mt-5 text-4xl sm:text-5xl">
          Sign in to your games.
        </h1>
        <p className="mt-5 text-base leading-8 text-white/72">
          One Play Point account opens your game library. The library keeps your owned Play Point titles together and gives you one place to launch connected Shot Caddy games.
        </p>
        <div className="mt-7 grid gap-3 text-sm text-white/74">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <span className="font-black text-white">Account first.</span> Every Games route requires a verified sign-in.
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <span className="font-black text-white">Ownership second.</span> Your library determines which games you can open.
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <span className="font-black text-white">One library.</span> Play Point Games and Shot Caddy launches live together here.
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(18,42,56,0.82),rgba(5,12,18,0.95))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/65">
          {passwordRecovery ? "Choose a new password" : "Play Point account"}
        </div>

        {!passwordRecovery ? (
          <>
            <label className="mt-6 block text-sm font-bold text-white/74">
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3.5 text-white outline-none placeholder:text-white/30 focus:border-cyan-300/60"
              />
            </label>
          </>
        ) : null}

        <label className="mt-4 block text-sm font-bold text-white/74">
          {passwordRecovery ? "New password" : "Password"}
          <input
            type="password"
            autoComplete={passwordRecovery ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={passwordRecovery ? "At least 8 characters" : "Your account password"}
            className="mt-2 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3.5 text-white outline-none placeholder:text-white/30 focus:border-cyan-300/60"
          />
        </label>

        {error ? (
          <div role="alert" className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {notice}
          </div>
        ) : null}

        {passwordRecovery ? (
          <button
            type="button"
            onClick={() => void updateRecoveredPassword()}
            disabled={busy}
            className="mt-6 w-full rounded-2xl bg-cyan-300 px-5 py-3.5 font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50"
          >
            {action === "update" ? "Updating…" : "Update password & open Games"}
          </button>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void submitAuth("signin")}
                disabled={busy}
                className="rounded-2xl bg-cyan-300 px-5 py-3.5 font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50"
              >
                {action === "signin" ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => void submitAuth("signup")}
                disabled={busy}
                className="rounded-2xl border border-white/15 bg-white/8 px-5 py-3.5 font-black text-white transition hover:bg-white/12 disabled:opacity-50"
              >
                {action === "signup" ? "Creating…" : "Create account"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => void sendPasswordReset()}
              disabled={busy}
              className="mt-4 text-sm font-bold text-cyan-100/72 underline decoration-cyan-200/30 underline-offset-4 hover:text-cyan-50 disabled:opacity-50"
            >
              {action === "reset" ? "Sending reset…" : "Forgot password?"}
            </button>
          </>
        )}

        <p className="mt-6 text-xs leading-6 text-white/46">
          Signing in confirms your account first. Game access is then checked against Founder access or the ownership attached to that account.
        </p>
      </section>
    </div>
  );
}
