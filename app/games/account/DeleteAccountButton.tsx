"use client";

import { useState } from "react";
import { getPlayPointBrowserSupabaseClient } from "@/lib/play-point-core/play-point-browser-supabase";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      const supabase = getPlayPointBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Your account session has expired. Please sign in again.");

      const response = await fetch("/api/games/account/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Unable to delete account.");

      await supabase.auth.signOut();
      window.location.assign("/play-amplified?account=deleted");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete account.");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-2xl border border-red-300/20 bg-red-400/[0.06] px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/10"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-300/20 bg-red-400/[0.06] p-4">
      <p className="text-sm leading-6 text-red-50/85">
        This permanently deletes your Play Amplified account and removes account-linked game entitlements. This cannot be undone.
      </p>
      {error ? <p className="mt-3 text-sm font-bold text-red-200">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void deleteAccount()}
          disabled={deleting}
          className="rounded-xl border border-red-200/30 bg-red-400/15 px-4 py-2 text-sm font-black text-red-50 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Yes, permanently delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/70 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
