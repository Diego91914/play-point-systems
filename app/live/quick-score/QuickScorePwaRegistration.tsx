"use client";

import { useEffect } from "react";

export default function QuickScorePwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .register("/quick-score-sw.js", { scope: "/live/quick-score/" })
      .then((registration) => registration.update())
      .catch(() => undefined);
  }, []);

  return null;
}
