"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameExperienceDemo as Demo } from "@/lib/play-point-core/game-experience-demos";

const accentClasses = {
  cyan: "border-cyan-300/30 bg-cyan-300/[0.10] text-cyan-50",
  amber: "border-amber-300/30 bg-amber-300/[0.10] text-amber-50",
  emerald: "border-emerald-300/30 bg-emerald-300/[0.10] text-emerald-50",
  violet: "border-violet-300/30 bg-violet-300/[0.10] text-violet-50",
  rose: "border-rose-300/30 bg-rose-300/[0.10] text-rose-50",
} as const;

export function GameExperienceDemo({ demo }: { demo: Demo }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const step = demo.steps[stepIndex];
  const accent = step.accent ?? "cyan";
  const progress = useMemo(() => ((stepIndex + 1) / demo.steps.length) * 100, [stepIndex, demo.steps.length]);

  useEffect(() => {
    if (!playing || demo.steps.length < 2) return;
    const timer = window.setTimeout(() => {
      setStepIndex((current) => (current + 1) % demo.steps.length);
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [stepIndex, playing, demo.steps.length]);

  const next = () => {
    setStepIndex((current) => (current + 1) % demo.steps.length);
    setPlaying(false);
  };

  const restart = () => {
    setStepIndex(0);
    setPlaying(true);
  };

  return (
    <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_35%),rgba(255,255,255,0.035)] shadow-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">See it in action</div>
          <div className="mt-1 text-sm font-black text-white">Animated example · no sound needed</div>
        </div>
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/[0.09] hover:text-white"
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>

      <div className="grid min-h-[500px] gap-0 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <div className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${accentClasses[accent]}`}>
            {step.eyebrow}
          </div>
          <h3 key={`${stepIndex}-headline`} className="mt-5 max-w-xl text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
            {step.headline}
          </h3>
          <p key={`${stepIndex}-detail`} className="mt-4 max-w-xl text-sm leading-7 text-white/62 sm:text-base">
            {step.detail}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {demo.steps.map((item, index) => (
              <button
                key={`${item.eyebrow}-${index}`}
                type="button"
                aria-label={`Show demo step ${index + 1}`}
                onClick={() => { setStepIndex(index); setPlaying(false); }}
                className={`h-2.5 rounded-full transition-all ${index === stepIndex ? "w-10 bg-white" : "w-2.5 bg-white/25 hover:bg-white/45"}`}
              />
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[390px] items-center justify-center overflow-hidden border-t border-white/10 bg-black/25 p-6 lg:border-l lg:border-t-0 sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.10),transparent_48%)]" />
          <div className="relative w-[260px] rounded-[40px] border border-white/18 bg-[#07111d] p-3 shadow-[0_35px_100px_rgba(0,0,0,0.55)] sm:w-[300px]">
            <div className="rounded-[31px] border border-white/8 bg-[linear-gradient(180deg,#0c1828,#07111d)] px-5 pb-7 pt-4">
              <div className="mx-auto h-1.5 w-16 rounded-full bg-white/12" />
              <div className="mt-6 text-center text-[9px] font-black uppercase tracking-[0.22em] text-cyan-100/45">PLAY AMPLIFIED</div>
              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.045] p-5 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">{step.phoneLabel ?? "LIVE GAME"}</div>
                <div key={`${stepIndex}-phone`} className="mt-3 break-words text-3xl font-black leading-tight tracking-[-0.04em] text-white">
                  {step.phoneBody ?? step.headline}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.12em] text-white/42">Player 1</div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.12em] text-white/42">Player 2</div>
              </div>
              <button type="button" onClick={next} className={`mt-5 w-full rounded-2xl border px-4 py-3.5 text-sm font-black transition hover:brightness-110 ${accentClasses[accent]}`}>
                NEXT MOMENT →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 bg-white/8">
        <div className="h-full bg-white/70 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-white/42 sm:px-6">
        <span>Example flow {stepIndex + 1} of {demo.steps.length}</span>
        <button type="button" onClick={restart} className="font-black uppercase tracking-[0.12em] text-cyan-100/70 hover:text-white">Restart demo</button>
      </div>
    </div>
  );
}
