import { GameScreenshot } from "../../GameScreenshot";

export function GameExperienceDemo({ gameId, title, launchHref }: { gameId: string; title: string; launchHref: string }) {
  const external = launchHref.startsWith("http");
  return (
    <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl sm:p-6">
      <div className="mb-4 text-sm font-black text-white">{title} · interface screenshot</div>
      <GameScreenshot gameId={gameId} detail />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/60">
        <span>Static capture. The game starts only when you open it.</span>
        <a href={launchHref} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="font-black uppercase tracking-[0.12em] text-cyan-100 hover:text-white">Open full game →</a>
      </div>
    </div>
  );
}
