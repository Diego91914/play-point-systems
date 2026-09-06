"use client";

import { useEffect, useState } from "react";

type ActionState = {
  foldLabel: string;
  checkCallLabel: string;
  betRaiseLabel: string;
  allInLabel: string;
  foldDisabled: boolean;
  checkCallDisabled: boolean;
  betRaiseDisabled: boolean;
  allInDisabled: boolean;
};

const EMPTY: ActionState = {
  foldLabel: "Fold",
  checkCallLabel: "Check",
  betRaiseLabel: "Bet / Raise",
  allInLabel: "All-in",
  foldDisabled: true,
  checkCallDisabled: true,
  betRaiseDisabled: true,
  allInDisabled: true,
};

function buttonText(button: HTMLButtonElement) {
  return (button.textContent ?? "").replace(/\s+/g, " ").trim();
}

function findActionButtons() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const fold = buttons.find((button) => /^Fold(?:ing…)?$/i.test(buttonText(button)));
  const checkCall = buttons.find((button) => /^(Check|Checking…|Call\b|Calling…)/i.test(buttonText(button)));
  const betRaise = buttons.find((button) => /^(Bet|Raise to)\s+[\d,]+/i.test(buttonText(button)) || /^Sending raise…$/i.test(buttonText(button)));
  const allIn = buttons.find((button) => /^(All-in\b|Going all-in…)/i.test(buttonText(button)));
  return { fold, checkCall, betRaise, allIn };
}

export function HoldemActionDock() {
  const [state, setState] = useState<ActionState | null>(null);

  useEffect(() => {
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { fold, checkCall, betRaise, allIn } = findActionButtons();
        if (!fold || !checkCall) {
          setState(null);
          return;
        }

        setState({
          foldLabel: buttonText(fold),
          checkCallLabel: buttonText(checkCall),
          betRaiseLabel: betRaise ? buttonText(betRaise) : "Bet / Raise",
          allInLabel: allIn ? buttonText(allIn) : "All-in",
          foldDisabled: fold.disabled,
          checkCallDisabled: checkCall.disabled,
          betRaiseDisabled: !betRaise || betRaise.disabled,
          allInDisabled: !allIn || allIn.disabled,
        });
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["disabled"],
    });
    const interval = window.setInterval(sync, 700);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!state) return null;

  const trigger = (kind: "fold" | "checkCall" | "betRaise" | "allIn") => {
    const buttons = findActionButtons();
    buttons[kind]?.click();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-[22px] border border-white/15 bg-slate-950/95 p-2 shadow-[0_-14px_45px_rgba(0,0,0,.48)] backdrop-blur-xl">
        <div className="mb-1 px-2 text-center text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100/55">Your action · all choices together</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button disabled={state.foldDisabled} onClick={() => trigger("fold")} className="min-h-14 touch-manipulation rounded-xl border border-red-300/35 bg-red-400/16 px-3 py-2 text-sm font-black text-red-50 disabled:opacity-35">{state.foldLabel}</button>
          <button disabled={state.checkCallDisabled} onClick={() => trigger("checkCall")} className="min-h-14 touch-manipulation rounded-xl bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950 disabled:opacity-35">{state.checkCallLabel}</button>
          <button disabled={state.betRaiseDisabled} onClick={() => trigger("betRaise")} className="min-h-14 touch-manipulation rounded-xl bg-emerald-400 px-3 py-2 text-sm font-black text-emerald-950 disabled:opacity-35">{state.betRaiseLabel}</button>
          <button disabled={state.allInDisabled} onClick={() => trigger("allIn")} className="min-h-14 touch-manipulation rounded-xl border border-violet-300/30 bg-violet-300/12 px-3 py-2 text-sm font-black text-violet-50 disabled:opacity-35">{state.allInLabel}</button>
        </div>
      </div>
    </div>
  );
}
