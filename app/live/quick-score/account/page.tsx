"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  parseQuickScoreRecoveryKey,
  serializeQuickScoreRecoveryKey,
} from "@/lib/play-point-core/quick-score-auth";
import {
  clearStoredQuickScoreIdentity,
  ensureQuickScoreIdentity,
  persistQuickScoreIdentity,
  resolveStoredQuickScoreIdentity,
  restoreQuickScoreIdentitySession,
  type QuickScoreIdentity,
} from "@/lib/play-point-core/quick-score-identity";
import { getQuickScoreBrowserSupabaseClient } from "@/lib/play-point-core/quick-score-browser-supabase";

export default function QuickScoreAccountPage() {
  const [currentIdentity, setCurrentIdentity] = useState<QuickScoreIdentity | null>(null);
  const [recoveryKeyInput, setRecoveryKeyInput] = useState("");
  const [revealRecoveryKey, setRevealRecoveryKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailAction, setEmailAction] = useState<"signin" | "signup" | "reset" | null>(null);
  const [emailNotice, setEmailNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedInEmail, setSignedInEmail] = useState("");
  const [authAccessToken, setAuthAccessToken] = useState("");
  const [emailNeedsLink, setEmailNeedsLink] = useState(false);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedIdentity = resolveStoredQuickScoreIdentity();
    setCurrentIdentity(storedIdentity);
    if (!storedIdentity) return;

    void restoreQuickScoreIdentitySession(storedIdentity)
      .then((restoredIdentity) => setCurrentIdentity(restoredIdentity))
      .catch(() => {
        setError(
          "This browser has a saved recovery key, but it could not be verified. You can paste a valid key below without deleting any clubs."
        );
      });
  }, []);

  useEffect(() => {
    let supabase: ReturnType<typeof getQuickScoreBrowserSupabaseClient>;
    try {
      supabase = getQuickScoreBrowserSupabaseClient();
    } catch (configurationError) {
      setError(
        configurationError instanceof Error
          ? configurationError.message
          : "Quick Score email sign-in is not configured."
      );
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) return;
      setSignedInEmail(session.user.email ?? "Signed-in account");
      setAuthAccessToken(session.access_token);
      void connectSignedInAccount(session.access_token).catch((connectionError) => {
        setError(
          connectionError instanceof Error
            ? connectionError.message
            : "Unable to connect the signed-in account."
        );
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedInEmail(session?.user.email ?? "");
      setAuthAccessToken(session?.access_token ?? "");
      if (event === "PASSWORD_RECOVERY") setPasswordRecoveryMode(true);
      if (!session) setEmailNeedsLink(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const currentRecoveryKey = useMemo(
    () => currentIdentity?.credentialKind !== "account_session"
      ? currentIdentity ? serializeQuickScoreRecoveryKey(currentIdentity) : ""
      : "",
    [currentIdentity]
  );

  async function connectSignedInAccount(accessToken: string) {
    const response = await fetch("/api/live/quick-score/account/session", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 404) {
      setEmailNeedsLink(true);
      setStatusMessage(
        "Email verified. Link this browser's Quick Score account when you are ready."
      );
      return;
    }
    if (!response.ok) {
      throw new Error(
        typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Unable to connect the signed-in account."
      );
    }

    const playerId = typeof (data as { playerId?: unknown }).playerId === "string"
      ? (data as { playerId: string }).playerId
      : "";
    const recoveryCode = typeof (data as { recoveryCode?: unknown }).recoveryCode === "string"
      ? (data as { recoveryCode: string }).recoveryCode
      : "";
    if (!playerId || !recoveryCode) throw new Error("Account session returned invalid data.");

    const credentialKind = (data as { credentialKind?: unknown }).credentialKind === "recovery"
      ? "recovery" as const
      : "account_session" as const;
    const storedIdentity = resolveStoredQuickScoreIdentity();
    if (
      storedIdentity?.playerId !== playerId ||
      storedIdentity.recoveryCode !== recoveryCode ||
      storedIdentity.credentialKind !== credentialKind
    ) {
      const identity: QuickScoreIdentity = {
        playerId,
        recoveryCode,
        credentialKind,
      };
      persistQuickScoreIdentity(identity);
      setCurrentIdentity(identity);
    }
    setEmailNeedsLink(false);
    setStatusMessage("Email account connected. Clubs from this account are now available here.");
  }

  async function submitEmailAuth(mode: "signup" | "signin") {
    if (!email.trim() || password.length < 8) {
      setEmailNotice({
        tone: "error",
        message: "Enter a valid email and a password with at least 8 characters.",
      });
      return;
    }

    setEmailBusy(true);
    setEmailAction(mode);
    setEmailNotice(null);
    setError("");
    setStatusMessage("");
    try {
      const supabase = getQuickScoreBrowserSupabaseClient();
      const result = mode === "signup"
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: `${window.location.origin}/live/quick-score/account` },
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;

      setPassword("");
      if (!result.data.session) {
        setEmailNotice({
          tone: "success",
          message: `Account created. We sent a confirmation link to ${email.trim()}. Check your inbox and spam folder, then return here to sign in. Wait at least one minute before requesting another email.`,
        });
        return;
      }

      setSignedInEmail(result.data.user?.email ?? email.trim());
      setAuthAccessToken(result.data.session.access_token);
      await connectSignedInAccount(result.data.session.access_token);
    } catch (authError) {
      setEmailNotice({
        tone: "error",
        message: authError instanceof Error ? authError.message : "Email authentication failed.",
      });
    } finally {
      setEmailBusy(false);
      setEmailAction(null);
    }
  }

  async function linkEmailAccount() {
    if (!authAccessToken) return;
    const confirmation = currentIdentity
      ? "Link the clubs and history on this browser to the signed-in email account?"
      : "Create a new Quick Score player for this email account?";
    if (!window.confirm(confirmation)) return;

    setEmailBusy(true);
    setError("");
    setStatusMessage("");
    try {
      if (currentIdentity) {
        const restoredIdentity = await restoreQuickScoreIdentitySession(currentIdentity);
        setCurrentIdentity(restoredIdentity);
      }
      const response = await fetch("/api/live/quick-score/account/link", {
        method: "POST",
        headers: { Authorization: `Bearer ${authAccessToken}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Unable to link this Quick Score account."
        );
      }

      const createdPlayerId = typeof (data as { playerId?: unknown }).playerId === "string"
        ? (data as { playerId: string }).playerId
        : "";
      const createdRecoveryCode =
        typeof (data as { recoveryCode?: unknown }).recoveryCode === "string"
          ? (data as { recoveryCode: string }).recoveryCode
          : "";
      if (!currentIdentity && createdPlayerId && createdRecoveryCode) {
        const identity: QuickScoreIdentity = {
          playerId: createdPlayerId,
          recoveryCode: createdRecoveryCode,
          credentialKind: "recovery",
        };
        persistQuickScoreIdentity(identity);
        setCurrentIdentity(identity);
        setRevealRecoveryKey(true);
      }

      setEmailNeedsLink(false);
      setStatusMessage("Email account linked. Signing in elsewhere will restore these clubs.");
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Unable to link email account.");
    } finally {
      setEmailBusy(false);
    }
  }

  async function signOutEmailAccount() {
    setEmailBusy(true);
    setError("");
    try {
      if (currentIdentity?.credentialKind === "account_session") {
        await fetch("/api/live/quick-score/account/session", {
          method: "DELETE",
        });
        clearStoredQuickScoreIdentity();
        setCurrentIdentity(null);
      }
      await getQuickScoreBrowserSupabaseClient().auth.signOut();
      setSignedInEmail("");
      setAuthAccessToken("");
      setEmailNeedsLink(false);
      setStatusMessage("Signed out on this device.");
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Unable to sign out.");
    } finally {
      setEmailBusy(false);
    }
  }

  async function sendPasswordReset() {
    if (!email.trim()) {
      setEmailNotice({ tone: "error", message: "Enter your email address first." });
      return;
    }

    setEmailBusy(true);
    setEmailAction("reset");
    setEmailNotice(null);
    setError("");
    try {
      const { error: resetError } = await getQuickScoreBrowserSupabaseClient()
        .auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/live/quick-score/account`,
        });
      if (resetError) throw resetError;
      setEmailNotice({
        tone: "success",
        message: `Password reset email sent to ${email.trim()}. Check your inbox and spam folder. Wait at least one minute before requesting another email.`,
      });
    } catch (resetError) {
      setEmailNotice({
        tone: "error",
        message: resetError instanceof Error ? resetError.message : "Unable to send reset email.",
      });
    } finally {
      setEmailBusy(false);
      setEmailAction(null);
    }
  }

  async function updateRecoveredPassword() {
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setEmailBusy(true);
    setError("");
    try {
      const { error: updateError } = await getQuickScoreBrowserSupabaseClient()
        .auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setPasswordRecoveryMode(false);
      setStatusMessage("Password updated.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update password.");
    } finally {
      setEmailBusy(false);
    }
  }

  async function copyRecoveryKey() {
    if (!currentRecoveryKey) return;
    try {
      await navigator.clipboard.writeText(currentRecoveryKey);
      setStatusMessage("Recovery key copied. Keep it private—it grants access to this account.");
      setError("");
    } catch {
      setRevealRecoveryKey(true);
      setError("Copy was blocked by the browser. Select and copy the revealed key instead.");
    }
  }

  async function restoreAccount() {
    const identity = parseQuickScoreRecoveryKey(recoveryKeyInput);
    if (!identity) {
      setError("Paste the complete recovery key, including the player ID and recovery code.");
      setStatusMessage("");
      return;
    }

    if (
      currentIdentity &&
      currentIdentity.playerId !== identity.playerId &&
      !window.confirm(
        "Switch this browser to the restored Quick Score account? Nothing will be deleted, but clubs from the current browser account will no longer appear unless you restore its key again."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setStatusMessage("");
    try {
      const restoredIdentity = await restoreQuickScoreIdentitySession(identity);
      setCurrentIdentity(restoredIdentity);
      setRecoveryKeyInput("");
      setRevealRecoveryKey(false);
      setStatusMessage("Account restored. This browser will now load the clubs saved to that account.");
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Unable to restore this Quick Score account."
      );
    } finally {
      setBusy(false);
    }
  }

  async function createAccount() {
    setBusy(true);
    setError("");
    setStatusMessage("");
    try {
      const identity = await ensureQuickScoreIdentity();
      setCurrentIdentity(identity);
      setRevealRecoveryKey(true);
      setStatusMessage("Account created. Save the recovery key before using another device.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create a Quick Score account."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111d] text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(17,28,44,0.96),rgba(11,23,40,0.92)_48%,rgba(8,14,25,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)] sm:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            Play Point Live · Quick Score
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Account &amp; Recovery
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
            Quick Match stays available without registration. Add a verified email account when you want the same clubs, players, history, and Pro access on every device.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/live/quick-score"
              className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black transition hover:bg-white/10"
            >
              Back to Quick Score
            </Link>
            <Link
              href="/live/quick-score/clubs"
              className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
            >
              Open Clubs
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-emerald-300/16 bg-emerald-400/8 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/72">
                Email Account
              </div>
              <h2 className="mt-2 text-2xl font-black">
                {signedInEmail ? `Signed in as ${signedInEmail}` : "Use your clubs on every device"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-emerald-50/72">
                Your password is handled by Supabase Auth. Quick Score links the verified user to your existing player without moving or deleting club data.
              </p>
            </div>

            {signedInEmail && passwordRecoveryMode ? (
              <div className="grid w-full gap-3 lg:max-w-md">
                <label>
                  <span className="text-sm font-bold text-white/84">New password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300/30"
                  />
                </label>
                <button
                  type="button"
                  onClick={updateRecoveredPassword}
                  disabled={emailBusy}
                  className="rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50"
                >
                  Update Password
                </button>
              </div>
            ) : signedInEmail ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                {emailNeedsLink && (
                  <button
                    type="button"
                    onClick={linkEmailAccount}
                    disabled={emailBusy}
                    className="rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50"
                  >
                    {currentIdentity ? "Link These Clubs" : "Create Linked Player"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={signOutEmailAccount}
                  disabled={emailBusy}
                  className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black transition hover:bg-white/10 disabled:opacity-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid w-full gap-3 lg:max-w-md">
                <label>
                  <span className="text-sm font-bold text-white/84">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300/30"
                  />
                </label>
                <label>
                  <span className="text-sm font-bold text-white/84">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    minLength={8}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300/30"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => submitEmailAuth("signin")}
                    disabled={emailBusy}
                    className="rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50"
                  >
                    {emailAction === "signin" ? "Signing In..." : "Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitEmailAuth("signup")}
                    disabled={emailBusy}
                    className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-50 transition hover:bg-emerald-400/16 disabled:opacity-50"
                  >
                    {emailAction === "signup" ? "Sending..." : "Create Email Account"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={sendPasswordReset}
                  disabled={emailBusy}
                  className="justify-self-start text-sm font-bold text-emerald-100/72 underline decoration-emerald-200/30 underline-offset-4"
                >
                  {emailAction === "reset" ? "Sending reset email..." : "Forgot password?"}
                </button>
                {emailNotice && (
                  <div
                    role={emailNotice.tone === "error" ? "alert" : "status"}
                    aria-live="polite"
                    className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                      emailNotice.tone === "error"
                        ? "border-amber-300/24 bg-amber-300/10 text-amber-50"
                        : "border-emerald-300/24 bg-emerald-300/10 text-emerald-50"
                    }`}
                  >
                    {emailNotice.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/72">
              This Browser
            </div>
            <h2 className="mt-2 text-2xl font-black">
              {currentIdentity?.credentialKind === "account_session"
                ? "Connected through email"
                : currentIdentity
                ? "Recovery key available"
                : "No saved account"}
            </h2>

            {currentIdentity?.credentialKind === "account_session" ? (
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-50/80">
                This device uses a revocable account session. Sign in with the same email on another device to load the same clubs—no recovery key transfer is required.
              </div>
            ) : currentIdentity ? (
              <>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  Copy this key on the device that can see your clubs, then paste it into this page on another browser or device.
                </p>
                <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100/72">
                    Private account recovery key
                  </div>
                  <input
                    readOnly
                    type={revealRecoveryKey ? "text" : "password"}
                    value={currentRecoveryKey}
                    aria-label="Current Quick Score recovery key"
                    className="mt-3 w-full rounded-xl border border-white/12 bg-black/25 px-3 py-3 font-mono text-sm font-bold text-amber-50 outline-none"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setRevealRecoveryKey((current) => !current)}
                      className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black transition hover:bg-white/10"
                    >
                      {revealRecoveryKey ? "Hide Key" : "Reveal Key"}
                    </button>
                    <button
                      type="button"
                      onClick={copyRecoveryKey}
                      className="rounded-xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:brightness-105"
                    >
                      Copy Key
                    </button>
                  </div>
                </div>
                <div className="mt-4 text-xs leading-6 text-white/52">
                  Anyone with this key can access the clubs attached to this Quick Score account. Do not post or share it publicly.
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  Restore an existing account before creating a new one if you already have clubs on another device.
                </p>
                <button
                  type="button"
                  onClick={createAccount}
                  disabled={busy}
                  className="mt-5 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black transition hover:bg-white/10 disabled:opacity-50"
                >
                  {busy ? "Working..." : "Start a New Account"}
                </button>
              </>
            )}
          </section>

          <section className="rounded-[28px] border border-cyan-300/16 bg-cyan-400/8 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/72">
              Restore or Switch
            </div>
            <h2 className="mt-2 text-2xl font-black">Use clubs from another device</h2>
            <p className="mt-3 text-sm leading-6 text-cyan-50/72">
              Paste the complete recovery key copied from the browser that already shows your clubs.
            </p>
            <label className="mt-5 block">
              <span className="text-sm font-bold text-white/84">Account recovery key</span>
              <textarea
                value={recoveryKeyInput}
                onChange={(event) => setRecoveryKeyInput(event.target.value)}
                rows={4}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="player-id.PPL-RECOVERY-CODE"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/30"
              />
            </label>
            <button
              type="button"
              onClick={restoreAccount}
              disabled={busy || !recoveryKeyInput.trim()}
              className="mt-4 w-full rounded-2xl bg-[linear-gradient(90deg,#7dd3fc,#67e8f9,#fcd34d)] px-5 py-4 text-base font-black text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Verifying..." : "Restore This Account"}
            </button>
          </section>
        </div>

        {(statusMessage || error) && (
          <div className="mt-6 space-y-3">
            {statusMessage && (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {statusMessage}
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
