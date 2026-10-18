"use client";
import { useEffect } from "react";

/** A visible, authenticated host may keep their selected live session active. */
export function useHostedSessionActivity(url: string, id: string | undefined, active: boolean, intent: "renew" | "playing") {
  useEffect(() => {
    if (!id || !active) return;
    const controller = new AbortController();
    let stopped = false;
    const renew = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const response = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(intent === "renew" ? { id, intent } : { id, status: intent }), signal: controller.signal });
        if ([401, 403, 404].includes(response.status)) stopped = true;
      } catch { /* A transient network failure cannot change gameplay. */ }
    };
    void renew();
    const interval = setInterval(() => { void renew(); }, 5 * 60 * 1000);
    const onVisibility = () => { void renew(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stopped = true; controller.abort(); clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  }, [url, id, active, intent]);
}
