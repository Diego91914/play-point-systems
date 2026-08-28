"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function findActionPanel() {
  const labels = Array.from(document.querySelectorAll("div"));
  const label = labels.find(
    (element) => element.children.length === 0 && element.textContent?.trim() === "Action",
  );
  return (label?.parentElement?.parentElement?.parentElement as HTMLDivElement | null) ?? null;
}

function actionButton(panel: HTMLElement, label: string) {
  return Array.from(panel.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === label && !button.disabled,
  );
}

export function HoldemPreAction() {
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const sync = () => {
      const nextPanel = findActionPanel();
      setPanel((current) => (current === nextPanel ? current : nextPanel));
      const text = nextPanel?.textContent ?? "";
      const isWaiting = text.includes("Waiting on ");
      setWaiting(isWaiting);
      if (!isWaiting && !nextPanel?.querySelector("button")) setArmed(false);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!armed || !panel) return;

    const attempt = () => {
      const check = actionButton(panel, "Check");
      if (check) {
        setArmed(false);
        check.click();
        return;
      }

      const fold = actionButton(panel, "Fold");
      if (fold) {
        setArmed(false);
        fold.click();
      }
    };

    attempt();
    const timer = window.setInterval(attempt, 120);
    return () => window.clearInterval(timer);
  }, [armed, panel]);

  if (!panel || !waiting) return null;

  return createPortal(
    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            Pre-action
          </div>
          <div className="mt-1 text-xs font-semibold text-white/55">
            Checks automatically if free. If there is a bet to you, folds instead.
          </div>
        </div>
        <button
          type="button"
          aria-pressed={armed}
          onClick={() => setArmed((value) => !value)}
          className={`min-h-12 rounded-2xl border px-5 py-3 text-sm font-black transition ${
            armed
              ? "border-emerald-300/55 bg-emerald-300/18 text-emerald-50 shadow-[0_0_24px_rgba(52,211,153,.12)]"
              : "border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.10]"
          }`}
        >
          {armed ? "✓ CHECK / FOLD ARMED" : "CHECK / FOLD"}
        </button>
      </div>
    </div>,
    panel,
  );
}
