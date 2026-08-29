type PreviewKind = "quick-score" | "trivia" | "venue" | "shot-caddy";

export function ProductPreview({ kind, compact = false }: { kind: PreviewKind; compact?: boolean }) {
  if (kind === "quick-score") {
    return (
      <div className={`overflow-hidden rounded-[24px] border border-amber-300/30 bg-[linear-gradient(145deg,#11110f,#07090c)] shadow-[0_18px_50px_rgba(0,0,0,.34)] ${compact ? "p-3" : "p-4"}`} aria-label="Score Caddy live scoring interface preview">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-amber-100/80">
          <span>Live Score</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.8)]" />Live</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[["Home", "18"], ["Away", "14"]].map(([name, score]) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 shadow-inner shadow-black/20">
              <div className="text-xs font-semibold text-white/64">{name}</div>
              <div className="mt-1 text-3xl font-black text-white">{score}</div>
              <div className="mt-3 flex gap-1.5">
                {[1, 2, 3].map((point) => <span key={point} className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-amber-300/15 bg-amber-300/10 text-xs font-black text-amber-100">+{point}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "trivia") {
    return (
      <div className={`overflow-hidden rounded-[24px] border border-violet-300/20 bg-[linear-gradient(145deg,#151028,#080d19)] ${compact ? "p-3" : "p-4"}`} aria-label="Play Point Trivia interface preview">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-violet-100/75">
          <span>Bible Gold</span><span className="rounded-full bg-amber-300/15 px-2 py-1 text-amber-100">7 sec</span>
        </div>
        <div className="mt-3 text-lg font-black leading-6 text-white">Which city&apos;s walls fell after seven days?</div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-white/82">
          {["Jericho", "Bethlehem", "Nineveh", "Damascus"].map((choice, index) => (
            <div key={choice} className={`rounded-xl border px-3 py-2.5 ${index === 0 ? "border-violet-300/35 bg-violet-400/15 text-violet-50" : "border-white/10 bg-white/[0.04]"}`}>{choice}</div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "venue") {
    return (
      <div className={`overflow-hidden rounded-[24px] border border-amber-300/20 bg-[linear-gradient(145deg,#1f1608,#080d16)] ${compact ? "p-3" : "p-4"}`} aria-label="Venue reward board interface preview">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-amber-100/75">
          <span>Game Night</span><span>End Q3</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <div><div className="text-xs text-white/58">Bears</div><div className="text-3xl font-black text-white">24</div></div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">Reward reveal</div>
          <div className="text-right"><div className="text-xs text-white/58">Packers</div><div className="text-3xl font-black text-white">20</div></div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black">
          {["4-0", "7-3", "1-7"].map((square, index) => <div key={square} className={`rounded-xl border px-2 py-3 ${index === 0 ? "border-amber-300/35 bg-amber-400/15 text-amber-50" : "border-white/10 bg-white/[0.04] text-white/70"}`}>{square}</div>)}
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[24px] border border-emerald-300/20 bg-[linear-gradient(145deg,#0d2018,#080d16)] ${compact ? "p-3" : "p-4"}`} aria-label="Shot Caddy round interface preview">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100/75">
        <span>Round card</span><span>Hole 12</span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/58">Pine Ridge</div>
          <div className="mt-1 text-xl font-black text-white">Par 3 · 286 ft</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full w-2/3 rounded-full bg-emerald-300" /></div>
        </div>
        <div className="flex min-w-20 flex-col items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-amber-100/70">Round</div>
          <div className="mt-1 text-3xl font-black text-white">-2</div>
        </div>
      </div>
    </div>
  );
}
