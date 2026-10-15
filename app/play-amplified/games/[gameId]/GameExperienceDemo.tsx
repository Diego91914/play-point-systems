import { MASTER_GAME_CATALOG } from "@/lib/play-point-core/master-game-catalog";
import { getGameExperienceDemo } from "@/lib/play-point-core/game-experience-demos";

const accentClasses = {
  cyan: "border-cyan-200/20 bg-cyan-300/[0.06] text-cyan-100",
  amber: "border-amber-200/20 bg-amber-300/[0.06] text-amber-100",
  emerald: "border-emerald-200/20 bg-emerald-300/[0.06] text-emerald-100",
  violet: "border-violet-200/20 bg-violet-300/[0.06] text-violet-100",
  rose: "border-rose-200/20 bg-rose-300/[0.06] text-rose-100",
} as const;

export function GameExperienceDemo({ gameId, title, launchHref }: { gameId: string; title: string; launchHref: string }) {
  const game = MASTER_GAME_CATALOG.find((entry) => entry.id === gameId);
  if (!game) throw new Error(`Missing game catalog entry: ${gameId}`);

  const demo = getGameExperienceDemo(game);
  const external = launchHref.startsWith("http");

  return (
    <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl sm:p-8">
      <div className="max-w-3xl">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">How {title} plays</div>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Understand the experience before you play.</h2>
        <p className="mt-4 text-sm leading-7 text-white/58 sm:text-base">
          Here is the actual flow of the game: what happens first, what players do, and where the payoff comes from.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {demo.steps.map((step, index) => {
          const accent = step.accent ?? "cyan";
          return (
            <article key={`${step.eyebrow}-${index}`} className="rounded-[26px] border border-white/10 bg-black/20 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Step {index + 1}</div>
                <div className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${accentClasses[accent]}`}>{step.eyebrow}</div>
              </div>
              <h3 className="mt-5 text-2xl font-black leading-tight tracking-[-0.025em] text-white">{step.headline}</h3>
              <p className="mt-3 text-sm leading-7 text-white/58">{step.detail}</p>
              {step.phoneLabel || step.phoneBody ? (
                <div className={`mt-5 rounded-2xl border p-4 ${accentClasses[accent]}`}>
                  {step.phoneLabel ? <div className="text-[9px] font-black uppercase tracking-[0.16em] opacity-65">{step.phoneLabel}</div> : null}
                  {step.phoneBody ? <div className="mt-2 text-lg font-black text-white">{step.phoneBody}</div> : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col gap-5 border-t border-white/10 pt-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">At a glance</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {demo.facts.map((fact) => (
              <span key={fact} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/58">{fact}</span>
            ))}
          </div>
        </div>
        <a href={launchHref} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-300/12 px-6 py-3.5 text-sm font-black text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/18">
          Open full game →
        </a>
      </div>
    </div>
  );
}
