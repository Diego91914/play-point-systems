"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function QuickScoreCheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "ready" | "error">("verifying");
  const [message, setMessage] = useState("Verifying Quick Score Pro purchase...");

  const sessionId = useMemo(() => searchParams.get("session_id") ?? "", [searchParams]);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage("Missing checkout session. Please start again from Quick Score.");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const response = await fetch("/api/live/quick-score/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Payment verification failed.");
        }

        if (!cancelled) {
          setStatus("ready");
          setMessage("Quick Score Pro unlocked. Returning to your scoreboard...");
          setTimeout(() => router.replace("/live/quick-score?checkout=success"), 350);
        }
      } catch (error) {
        if (cancelled) return;
        const errorMessage = error instanceof Error ? error.message : "Unable to verify purchase.";
        setStatus("error");
        setMessage(errorMessage);
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#07111d] px-4 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-6 text-center shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
        <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Play Point Live · Quick Score Pro</div>
        <h1 className="mt-2 text-2xl font-black text-white">Checkout</h1>
        <p className="mt-3 text-sm text-white/75">{message}</p>

        {status === "error" && (
          <button
            type="button"
            onClick={() => router.replace("/live/quick-score")}
            className="mt-5 w-full rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
          >
            Back to Quick Score
          </button>
        )}
      </div>
    </main>
  );
}

export default function QuickScoreCheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#07111d]" />}>
      <QuickScoreCheckoutSuccessContent />
    </Suspense>
  );
}
