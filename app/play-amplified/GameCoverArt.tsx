type CoverMotif =
  | "chain"
  | "gauge"
  | "ranked"
  | "spotlight"
  | "spy"
  | "poker"
  | "dice"
  | "mansion"
  | "classic"
  | "chaos"
  | "battle"
  | "prediction"
  | "skins"
  | "wolf"
  | "redemption"
  | "pack"
  | "card-classic"
  | "card-stud"
  | "card-draw"
  | "ladder"
  | "sprint"
  | "survival"
  | "warrior"
  | "stack"
  | "chronicle"
  | "quest-course"
  | "trivia";

type CoverIdentity = {
  kicker: string;
  mark: string;
  frame: string;
  ink: string;
  motif: CoverMotif;
};

// Cover marks are intentionally short: these render at roughly 96–112px wide in
// the mobile library, so each identity must read before the adjacent title does.
const covers: Record<string, CoverIdentity> = {
  "chain-reaction": { kicker: "SOCIAL", mark: "CHAIN", frame: "from-cyan-400/50 via-slate-950 to-violet-700/45", ink: "text-cyan-50", motif: "chain" },
  "how-close": { kicker: "1 TO 100", mark: "HOW CLOSE?", frame: "from-amber-300/50 via-rose-950 to-fuchsia-700/45", ink: "text-amber-50", motif: "gauge" },
  "on-my-list": { kicker: "RANK IT", mark: "#1?", frame: "from-fuchsia-500/45 via-slate-950 to-cyan-700/35", ink: "text-fuchsia-50", motif: "ranked" },
  "all-about-you": { kicker: "GUEST OF HONOR", mark: "YOU", frame: "from-amber-300/45 via-rose-950 to-pink-600/40", ink: "text-amber-50", motif: "spotlight" },
  "inside-man": { kicker: "SOCIAL DEDUCTION", mark: "INSIDE MAN", frame: "from-red-600/45 via-slate-950 to-cyan-700/35", ink: "text-red-50", motif: "spy" },
  "phone-holdem": { kicker: "PRIVATE-SEAT POKER", mark: "HOLD'EM", frame: "from-rose-600/45 via-fuchsia-950 to-slate-950", ink: "text-rose-50", motif: "poker" },
  "live-craps": { kicker: "LIVE TABLE", mark: "7 · 11", frame: "from-amber-400/40 via-emerald-950 to-slate-950", ink: "text-amber-50", motif: "dice" },
  "last-call": { kicker: "BLACKWOOD HOUSE", mark: "LAST CALL", frame: "from-amber-200/35 via-rose-950 to-black", ink: "text-amber-50", motif: "mansion" },

  "shot-classic": { kicker: "SHOT CADDY", mark: "CLASSIC", frame: "from-emerald-500/45 via-cyan-950 to-slate-950", ink: "text-emerald-50", motif: "classic" },
  "shot-chaos": { kicker: "SHOT CADDY", mark: "CHAOS", frame: "from-lime-400/45 via-fuchsia-950 to-orange-700/45", ink: "text-lime-50", motif: "chaos" },
  "battle-mode": { kicker: "SHOT CADDY", mark: "VS", frame: "from-cyan-500/40 via-slate-950 to-orange-600/45", ink: "text-cyan-50", motif: "battle" },
  "call-your-score": { kicker: "SHOT CADDY", mark: "CALL IT", frame: "from-sky-500/40 via-indigo-950 to-amber-500/35", ink: "text-sky-50", motif: "prediction" },
  "challenge-skins-pro": { kicker: "SHOT CADDY PRO", mark: "SKINS", frame: "from-amber-300/40 via-emerald-950 to-black", ink: "text-amber-50", motif: "skins" },
  wolf: { kicker: "SHOT CADDY", mark: "WOLF", frame: "from-slate-300/25 via-blue-950 to-slate-950", ink: "text-slate-100", motif: "wolf" },
  "redemption-wolf": { kicker: "SHOT CADDY", mark: "REDEEM", frame: "from-orange-400/40 via-red-950 to-slate-950", ink: "text-orange-50", motif: "redemption" },
  "wolf-pack": { kicker: "SHOT CADDY", mark: "PACK", frame: "from-teal-400/35 via-blue-950 to-slate-950", ink: "text-teal-50", motif: "pack" },

  "card-shark-classic": { kicker: "CARD SHARK", mark: "CLASSIC", frame: "from-emerald-500/35 via-slate-950 to-black", ink: "text-emerald-50", motif: "card-classic" },
  "card-shark-stud": { kicker: "CARD SHARK", mark: "STUD", frame: "from-amber-400/35 via-stone-950 to-slate-950", ink: "text-amber-50", motif: "card-stud" },
  "card-shark-draw": { kicker: "CARD SHARK", mark: "DRAW", frame: "from-violet-500/40 via-rose-950 to-slate-950", ink: "text-violet-50", motif: "card-draw" },

  "atw-ladder": { kicker: "AROUND THE WORLD", mark: "LADDER", frame: "from-sky-500/40 via-blue-950 to-amber-500/30", ink: "text-sky-50", motif: "ladder" },
  "atw-sprint": { kicker: "AROUND THE WORLD", mark: "SPRINT", frame: "from-cyan-400/45 via-blue-950 to-lime-500/30", ink: "text-cyan-50", motif: "sprint" },
  "atw-survival": { kicker: "AROUND THE WORLD", mark: "SURVIVE", frame: "from-red-500/45 via-slate-950 to-orange-500/30", ink: "text-red-50", motif: "survival" },
  "disc-warrior": { kicker: "SHOT CADDY", mark: "WARRIOR", frame: "from-amber-300/40 via-indigo-950 to-cyan-700/35", ink: "text-amber-50", motif: "warrior" },
  "clear-the-stack": { kicker: "PUTTING PRESSURE", mark: "STACK", frame: "from-sky-400/45 via-cyan-950 to-slate-950", ink: "text-sky-50", motif: "stack" },

  "quest-digital": { kicker: "QUEST CADDY", mark: "QUEST", frame: "from-violet-500/50 via-fuchsia-950 to-slate-950", ink: "text-violet-50", motif: "chronicle" },
  "quest-disc-golf": { kicker: "QUEST CADDY", mark: "THROWS", frame: "from-emerald-500/40 via-slate-950 to-amber-500/35", ink: "text-emerald-50", motif: "quest-course" },
  "play-point-trivia": { kicker: "LIVE GAME SHOW", mark: "TRIVIA", frame: "from-blue-500/45 via-indigo-950 to-cyan-600/40", ink: "text-blue-50", motif: "trivia" },
};

const svgProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Basket({ x = 116, y = 18, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M18 0v70M2 20h32M5 30h26M9 40h18M13 50h10M-4 70h44" />
      <circle cx="18" cy="0" r="3" fill="currentColor" stroke="none" />
    </g>
  );
}

function WolfHead({ x = 90, y = 62, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="m-34-29 18 8L0-31l16 10 18-8-7 29c0 22-13 38-27 46C-14 38-27 22-27 0l-7-29Z" />
      <path d="m-15 6 10 5M15 6l-10 5M-8 25 0 30l8-5" />
      <circle cx="-11" cy="7" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7" r="2.5" fill="currentColor" stroke="none" />
    </g>
  );
}

function PlayingCard({ x, y, rotate = 0, label }: { x: number; y: number; rotate?: number; label?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect width="40" height="58" rx="6" />
      {label ? <text x="8" y="19" fill="currentColor" stroke="none" fontSize="12" fontWeight="900">{label}</text> : null}
    </g>
  );
}

function CoverGlyph({ motif }: { motif: CoverMotif }) {
  if (motif === "chain") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><circle cx="35" cy="68" r="17"/><circle cx="90" cy="39" r="17"/><circle cx="145" cy="69" r="17"/><path d="m50 60 24-13M106 47l24 13"/><circle cx="90" cy="39" r="6" fill="currentColor" stroke="none"/><path d="M22 99c45-12 91-12 136 0" strokeDasharray="4 7" opacity=".28"/></svg>;
  }

  if (motif === "gauge") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M27 91a64 64 0 0 1 126 0"/><path d="m43 83-12-6M57 61l-8-10M90 51V35M123 61l8-10M137 83l12-6"/><path d="m90 88 39-39" strokeWidth="4"/><circle cx="90" cy="88" r="8" fill="currentColor" stroke="none"/><text x="24" y="107" fill="currentColor" stroke="none" fontSize="12" fontWeight="900">1</text><text x="137" y="107" fill="currentColor" stroke="none" fontSize="12" fontWeight="900">100</text></svg>;
  }

  if (motif === "ranked") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><rect x="41" y="16" width="98" height="82" rx="13"/><path d="M59 38h25M59 57h46M59 76h33"/><text x="104" y="43" fill="currentColor" stroke="none" fontSize="20" fontWeight="900">#1</text><path d="M111 60h14M111 70h14M111 80h14" opacity=".45"/></svg>;
  }

  if (motif === "spotlight") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M55 10h70l-17 57H72L55 10Z" fill="currentColor" opacity=".08"/><circle cx="90" cy="57" r="23"/><path d="M50 104c6-25 19-37 40-37s34 12 40 37"/><path d="M27 28l11 5M153 28l-11 5M48 11l6 10M132 11l-6 10" opacity=".6"/><circle cx="90" cy="57" r="5" fill="currentColor" stroke="none"/></svg>;
  }

  if (motif === "spy") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M25 61c34-34 96-34 130 0-34 34-96 34-130 0Z"/><circle cx="90" cy="61" r="21"/><circle cx="90" cy="61" r="7" fill="currentColor" stroke="none"/><path d="M32 23h88M48 96h92" strokeWidth="7" opacity=".28"/><path d="m133 18 20 20M153 18l-20 20" opacity=".7"/></svg>;
  }

  if (motif === "poker") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><PlayingCard x={37} y={26} rotate={-10} label="A"/><PlayingCard x={86} y={20} rotate={8} label="K"/><path d="M111 45c5-9 17-4 14 6-2 7-14 16-14 16s-12-9-14-16c-3-10 9-15 14-6Z" fill="currentColor" stroke="none"/><circle cx="46" cy="91" r="14"/><circle cx="46" cy="91" r="8"/></svg>;
  }

  if (motif === "dice") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><rect x="30" y="22" width="61" height="61" rx="11" transform="rotate(-8 30 22)"/><rect x="92" y="31" width="58" height="58" rx="11" transform="rotate(9 92 31)"/>{[[49,40],[72,59],[49,77],[109,48],[133,70],[110,84]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4.5" fill="currentColor" stroke="none"/>)}<path d="M22 103h136" opacity=".35"/></svg>;
  }

  if (motif === "mansion") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M25 103h130M41 103V52l49-31 49 31v51M57 103V64h66v39M80 103V77h20v26"/><path d="M64 49h52M73 40h34"/><path d="M132 26 145 14M142 39l16-4" opacity=".45"/><path d="M28 104c42 8 83 8 124 0" strokeDasharray="4 7" opacity=".3"/><g transform="translate(113 72)"><path d="M0 0h15l-3 13H3L0 0Z"/><path d="M7.5 13v9M2 22h11"/></g></svg>;
  }

  if (motif === "classic") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><ellipse cx="48" cy="39" rx="30" ry="9" transform="rotate(-12 48 39)"/><path d="M21 46c21 8 41 8 60-2"/><Basket x={117} y={19} scale={1.05}/><path d="M76 38c18-2 32 3 45 11" strokeDasharray="5 6" opacity=".55"/></svg>;
  }

  if (motif === "chaos") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><Basket x={116} y={18}/><path d="m24 78 26-49 14 27 22-34 18 39 18-22 27 45" strokeWidth="3.2"/><path d="M25 98c35-24 67-23 95-2M34 24c32 16 55 14 75-6" strokeDasharray="4 6" opacity=".45"/><circle cx="50" cy="29" r="5" fill="currentColor" stroke="none"/></svg>;
  }

  if (motif === "battle") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M31 34h43l18 27-18 27H31L13 61l18-27ZM149 34h-43L88 61l18 27h43l18-27-18-27Z"/><text x="76" y="69" fill="currentColor" stroke="none" fontSize="23" fontWeight="900">VS</text><circle cx="52" cy="61" r="10"/><circle cx="128" cy="61" r="10"/></svg>;
  }

  if (motif === "prediction") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><circle cx="110" cy="63" r="38"/><circle cx="110" cy="63" r="24"/><circle cx="110" cy="63" r="9" fill="currentColor" stroke="none"/><path d="m29 91 65-30M30 91l15-1-9-12"/><rect x="20" y="20" width="57" height="30" rx="8"/><text x="33" y="40" fill="currentColor" stroke="none" fontSize="12" fontWeight="900">CALL</text></svg>;
  }

  if (motif === "skins") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M90 16 121 28v26c0 22-12 37-31 48-19-11-31-26-31-48V28L90 16Z"/><circle cx="90" cy="56" r="18"/><path d="m90 43 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2 5-10Z" fill="currentColor" stroke="none" opacity=".7"/><path d="M30 91h27M123 91h27" opacity=".45"/></svg>;
  }

  if (motif === "wolf") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><circle cx="132" cy="33" r="25" fill="currentColor" stroke="none" opacity=".08"/><WolfHead x={84} y={63} scale={0.9}/><path d="M129 60v42M118 74h22M121 82h16M124 90h10" opacity=".45"/></svg>;
  }

  if (motif === "redemption") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><circle cx="138" cy="91" r="28" fill="currentColor" stroke="none" opacity=".1"/><path d="M15 91h151"/><path d="M24 89c28-31 50-31 69-17 19 14 36 9 59-20" strokeWidth="4"/><path d="m141 50 14-2-3 14"/><WolfHead x={65} y={62} scale={0.62}/></svg>;
  }

  if (motif === "pack") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><WolfHead x={90} y={62} scale={0.72}/><WolfHead x={45} y={72} scale={0.42}/><WolfHead x={135} y={72} scale={0.42}/><path d="M25 103c43-14 87-14 130 0" strokeDasharray="4 7" opacity=".3"/></svg>;
  }

  if (motif === "card-classic") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><PlayingCard x={42} y={25} rotate={-7} label="A"/><PlayingCard x={88} y={23} rotate={7} label="K"/><circle cx="36" cy="91" r="13"/><path d="M30 91h12M36 85v12"/></svg>;
  }

  if (motif === "card-stud") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><PlayingCard x={22} y={28} rotate={-9} label="A"/><PlayingCard x={68} y={20} label="Q"/><PlayingCard x={114} y={28} rotate={9} label="9"/><path d="M25 101h130" opacity=".35"/></svg>;
  }

  if (motif === "card-draw") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><PlayingCard x={32} y={29} rotate={-9} label="7"/><PlayingCard x={78} y={24} rotate={3} label="J"/><path d="M130 31c17 9 24 23 20 40M150 71l-7-9 11-2"/><path d="M144 88c-17 8-32 5-44-8M100 80l7 9-11 2"/></svg>;
  }

  if (motif === "ladder") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><circle cx="92" cy="61" r="45"/><circle cx="92" cy="61" r="31" opacity=".55"/><circle cx="92" cy="61" r="17" opacity=".35"/><path d="M24 98h24V82h24V66h24V50h24V34h24"/><circle cx="92" cy="61" r="4" fill="currentColor" stroke="none"/></svg>;
  }

  if (motif === "sprint") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><circle cx="105" cy="61" r="34"/><path d="M105 61 122 43M105 28v8M105 86v8M72 61h8M130 61h8"/><circle cx="105" cy="61" r="5" fill="currentColor" stroke="none"/><path d="M18 38h43M12 57h52M22 76h39" strokeWidth="4" opacity=".55"/></svg>;
  }

  if (motif === "survival") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><circle cx="90" cy="60" r="42"/><path d="M90 18v18M90 84v18M48 60h18M114 60h18"/><path d="M78 58c5-9 17-4 15 6-2 7-15 17-15 17s-13-10-15-17c-2-10 10-15 15-6Z" fill="currentColor" stroke="none"/><path d="m117 39 16-16M128 23h5v5" opacity=".7"/></svg>;
  }

  if (motif === "warrior") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M34 96h84M45 84h73M56 72h62M67 60h51M78 48h40M89 36h29" strokeWidth="5"/><ellipse cx="132" cy="31" rx="24" ry="7" transform="rotate(-12 132 31)"/><path d="M108 35c-9 4-16 10-22 18" strokeDasharray="4 6" opacity=".5"/><path d="M129 73 144 88l22-30" strokeWidth="4"/></svg>;
  }

  if (motif === "stack") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><ellipse cx="64" cy="78" rx="34" ry="9"/><ellipse cx="64" cy="61" rx="29" ry="8"/><ellipse cx="64" cy="46" rx="24" ry="7"/><ellipse cx="64" cy="33" rx="18" ry="6"/><Basket x={117} y={18}/><path d="M92 49c13-5 23-5 31 0" strokeDasharray="5 6" opacity=".5"/></svg>;
  }

  if (motif === "chronicle") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M90 14 122 29v28c0 23-13 38-32 49-19-11-32-26-32-49V29L90 14Z"/><path d="m90 37 7 14 15 2-11 11 3 15-14-8-14 8 3-15-11-11 15-2 7-14Z"/><path d="M18 92c21-26 40-35 59-34M103 58c20 1 39 12 59 35" strokeDasharray="5 7" opacity=".45"/><circle cx="20" cy="92" r="5"/><circle cx="160" cy="93" r="5"/></svg>;
  }

  if (motif === "quest-course") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><ellipse cx="47" cy="35" rx="25" ry="7" transform="rotate(-13 47 35)"/><path d="M20 41c18 7 34 7 52-1"/><path d="M75 35c20 1 35 9 46 23" strokeDasharray="5 6" opacity=".55"/><path d="M128 26 150 38v19c0 16-9 27-22 34-13-7-22-18-22-34V38l22-12Z"/><Basket x={118} y={49} scale={0.55}/></svg>;
  }

  return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M22 31h136v66H22z"/><path d="M22 49h136M56 31v66M124 31v66" opacity=".45"/><rect x="65" y="56" width="50" height="27" rx="7" fill="currentColor" stroke="none" opacity=".12"/><text x="78" y="75" fill="currentColor" stroke="none" fontSize="14" fontWeight="900">?</text><path d="M32 20l8 6M148 20l-8 6M90 14v10"/><circle cx="42" cy="73" r="7"/><circle cx="138" cy="73" r="7"/></svg>;
}

export function GameCoverArt({ gameId }: { gameId: string }) {
  const cover = covers[gameId];
  if (!cover) throw new Error(`Missing game cover identity: ${gameId}`);

  return (
    <div
      data-game-cover={gameId}
      className={`relative aspect-[4/3] min-h-full overflow-hidden bg-gradient-to-br ${cover.frame} ${cover.ink}`}
    >
      <div aria-hidden="true" className="absolute -right-5 -top-7 h-20 w-20 rounded-full border border-white/10 bg-white/10 blur-xl" />
      <div aria-hidden="true" className="absolute -bottom-8 -left-6 h-20 w-20 rounded-full border border-white/10 bg-black/20 blur-xl" />

      <div className="absolute inset-x-2 top-2 z-10 truncate text-[6px] font-black uppercase tracking-[0.16em] text-white/70 sm:text-[7px]">
        {cover.kicker}
      </div>

      <div className="absolute inset-x-0 top-[15%] h-[65%] px-1 text-white/72">
        <CoverGlyph motif={cover.motif} />
      </div>

      <div className="absolute inset-x-2 bottom-2 z-10">
        <div className="h-px bg-white/20" />
        <div className="mt-1.5 truncate text-[9px] font-black uppercase leading-none tracking-[0.04em] text-white sm:text-[10px]">
          {cover.mark}
        </div>
      </div>
    </div>
  );
}
