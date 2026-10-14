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

function Disc({ x, y, rotate = 0, scale = 1 }: { x: number; y: number; rotate?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="24" ry="7" />
      <path d="M-21 3c14 6 28 6 42 0" opacity=".7" />
    </g>
  );
}

function PhoneSeat({ x, y, rotate = 0, scale = 1 }: { x: number; y: number; rotate?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <rect x="-14" y="-23" width="28" height="46" rx="6" />
      <path d="M-5 17h10" opacity=".55" />
    </g>
  );
}

function CoverGlyph({ motif }: { motif: CoverMotif }) {
  if (motif === "chain") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><circle cx="31" cy="67" r="15"/><circle cx="82" cy="42" r="17"/><circle cx="139" cy="66" r="19"/><path d="m45 60 21-11M99 49l21 9" strokeWidth="3.4"/><circle cx="82" cy="42" r="6" fill="currentColor" stroke="none"/><circle cx="139" cy="66" r="27" opacity=".18"/><circle cx="139" cy="66" r="34" opacity=".08"/><path d="m120 58 9 8-9 8"/><path d="M22 99c45-12 91-12 136 0" strokeDasharray="4 7" opacity=".28"/></svg>;
  }

  if (motif === "gauge") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M27 91a64 64 0 0 1 126 0"/><path d="m43 83-12-6M57 61l-8-10M90 51V35M123 61l8-10M137 83l12-6"/><path d="m90 88 39-39" strokeWidth="4"/><circle cx="90" cy="88" r="8" fill="currentColor" stroke="none"/><text x="24" y="107" fill="currentColor" stroke="none" fontSize="12" fontWeight="900">1</text><text x="137" y="107" fill="currentColor" stroke="none" fontSize="12" fontWeight="900">100</text></svg>;
  }

  if (motif === "ranked") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><rect x="37" y="14" width="106" height="86" rx="13"/><rect x="51" y="25" width="78" height="25" rx="7" fill="currentColor" stroke="none" opacity=".1"/><text x="58" y="43" fill="currentColor" stroke="none" fontSize="18" fontWeight="900">#1 ?</text><path d="M53 62h48M53 79h34M111 61h16M111 70h16M111 79h16"/><path d="m133 31 9 7-9 7" opacity=".65"/></svg>;
  }

  if (motif === "spotlight") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M55 8h70l-17 59H72L55 8Z" fill="currentColor" opacity=".09"/><circle cx="90" cy="57" r="23"/><circle cx="90" cy="57" r="31" opacity=".18"/><path d="M50 104c6-25 19-37 40-37s34 12 40 37"/><path d="M27 28l11 5M153 28l-11 5M48 11l6 10M132 11l-6 10" opacity=".6"/>{[[35,18],[145,17],[29,67],[151,64],[46,88],[136,88]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="2.5" fill="currentColor" stroke="none" opacity=".65"/>)}<circle cx="90" cy="57" r="5" fill="currentColor" stroke="none"/></svg>;
  }

  if (motif === "spy") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M25 61c34-34 96-34 130 0-34 34-96 34-130 0Z"/><circle cx="90" cy="61" r="21"/><circle cx="90" cy="61" r="7" fill="currentColor" stroke="none"/><path d="M32 23h88M48 96h92" strokeWidth="7" opacity=".28"/><path d="m133 18 20 20M153 18l-20 20" opacity=".7"/></svg>;
  }

  if (motif === "poker") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><PhoneSeat x={133} y={59} rotate={7} scale={1.08}/><PlayingCard x={31} y={27} rotate={-10} label="A"/><PlayingCard x={73} y={22} rotate={7} label="K"/><path d="M96 45c5-9 17-4 14 6-2 7-14 16-14 16s-12-9-14-16c-3-10 9-15 14-6Z" fill="currentColor" stroke="none"/><circle cx="42" cy="94" r="13"/><circle cx="42" cy="94" r="7"/></svg>;
  }

  if (motif === "dice") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M16 101c37-15 111-15 148 0M28 91c32-12 92-12 124 0" opacity=".45"/><PhoneSeat x={27} y={73} rotate={-12} scale={0.55}/><PhoneSeat x={151} y={73} rotate={12} scale={0.55}/><rect x="35" y="18" width="56" height="56" rx="11" transform="rotate(-8 35 18)"/><rect x="91" y="28" width="55" height="55" rx="11" transform="rotate(9 91 28)"/>{[[53,36],[73,55],[52,71],[108,45],[131,66],[109,78]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4.5" fill="currentColor" stroke="none"/>)}<path d="M72 14c21-8 43-5 62 8" strokeDasharray="5 6" opacity=".35"/></svg>;
  }

  if (motif === "mansion") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M25 103h130M41 103V52l49-31 49 31v51M57 103V64h66v39M80 103V77h20v26"/><path d="M64 49h52M73 40h34"/><path d="M132 26 145 14M142 39l16-4" opacity=".45"/><path d="M28 104c42 8 83 8 124 0" strokeDasharray="4 7" opacity=".3"/><g transform="translate(113 72)"><path d="M0 0h15l-3 13H3L0 0Z"/><path d="M7.5 13v9M2 22h11"/></g></svg>;
  }

  if (motif === "classic") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><Disc x={48} y={39} rotate={-12} scale={1.25}/><Basket x={117} y={19} scale={1.05}/><path d="M76 38c18-2 32 3 45 11" strokeDasharray="5 6" opacity=".55"/></svg>;
  }

  if (motif === "chaos") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><Basket x={116} y={18}/><path d="m24 78 26-49 14 27 22-34 18 39 18-22 27 45" strokeWidth="3.2"/><path d="M25 98c35-24 67-23 95-2M34 24c32 16 55 14 75-6" strokeDasharray="4 6" opacity=".45"/><circle cx="50" cy="29" r="5" fill="currentColor" stroke="none"/><path d="m29 35 10 4-7 8M90 18l7 9-10 3M151 48l-10 5 7 8"/></svg>;
  }

  if (motif === "battle") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M31 34h43l18 27-18 27H31L13 61l18-27ZM149 34h-43L88 61l18 27h43l18-27-18-27Z"/><text x="76" y="69" fill="currentColor" stroke="none" fontSize="23" fontWeight="900">VS</text><Disc x={51} y={61} rotate={-12} scale={0.48}/><Disc x={129} y={61} rotate={12} scale={0.48}/><path d="M19 25h47M114 97h47" strokeDasharray="4 6" opacity=".35"/></svg>;
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
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><PlayingCard x={42} y={21} rotate={-7} label="A"/><PlayingCard x={88} y={20} rotate={7} label="K"/><Disc x={38} y={94} rotate={-5} scale={0.55}/><path d="M65 91c23-7 44-6 64 4" strokeDasharray="4 6" opacity=".35"/></svg>;
  }

  if (motif === "card-stud") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><PlayingCard x={21} y={24} rotate={-9} label="A"/><PlayingCard x={68} y={17} label="Q"/><PlayingCard x={115} y={24} rotate={9} label="9"/><Disc x={90} y={101} scale={0.5}/><path d="M25 101h43M112 101h43" opacity=".3"/></svg>;
  }

  if (motif === "card-draw") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><PlayingCard x={27} y={27} rotate={-9} label="7"/><PlayingCard x={71} y={21} rotate={3} label="J"/><path d="M126 25c20 9 29 25 24 46M150 71l-7-9 11-2"/><path d="M144 88c-18 9-36 6-50-8M94 80l7 9-11 2"/><Disc x={49} y={99} scale={0.48}/></svg>;
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
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M27 99h91M39 86h79M51 73h67M63 60h55M75 47h43M87 34h31" strokeWidth="5"/><Disc x={137} y={29} rotate={-12} scale={1.05}/><path d="M111 33c-11 4-20 11-27 21" strokeDasharray="4 6" opacity=".5"/><path d="M128 73 144 89l23-32" strokeWidth="4"/><circle cx="28" cy="99" r="4" fill="currentColor" stroke="none"/><circle cx="39" cy="86" r="4" fill="currentColor" stroke="none"/></svg>;
  }

  if (motif === "stack") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><ellipse cx="64" cy="78" rx="34" ry="9"/><ellipse cx="64" cy="61" rx="29" ry="8"/><ellipse cx="64" cy="46" rx="24" ry="7"/><ellipse cx="64" cy="33" rx="18" ry="6"/><Basket x={117} y={18}/><path d="M92 49c13-5 23-5 31 0" strokeDasharray="5 6" opacity=".5"/></svg>;
  }

  if (motif === "chronicle") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M20 30c21-8 42-6 63 7v63c-21-12-42-14-63-7V30ZM160 30c-21-8-42-6-63 7v63c21-12 42-14 63-7V30Z" opacity=".45"/><path d="M90 14 119 28v24c0 20-11 34-29 44-18-10-29-24-29-44V28L90 14Z"/><path d="m90 35 6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2 6-13Z"/><path d="M27 83c16-21 31-28 46-26M108 58c17 1 32 9 47 26" strokeDasharray="5 7" opacity=".6"/><circle cx="28" cy="83" r="4" fill="currentColor" stroke="none"/><circle cx="154" cy="84" r="4" fill="currentColor" stroke="none"/></svg>;
  }

  if (motif === "quest-course") {
    return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><Disc x={43} y={34} rotate={-13} scale={1.05}/><path d="M70 35c22 1 39 9 51 23" strokeDasharray="5 6" opacity=".62"/><path d="M128 18 154 32v23c0 19-10 31-26 40-16-9-26-21-26-40V32l26-14Z"/><path d="m128 35 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2 5-10Z" opacity=".7"/><Basket x={118} y={61} scale={0.5}/><path d="M28 100c36-12 76-12 120 0" strokeDasharray="4 7" opacity=".28"/></svg>;
  }

  return <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" {...svgProps}><path d="M20 28h140v68H20z"/><path d="M20 45h140M53 28v68M127 28v68" opacity=".4"/><path d="M31 18 43 28M149 18l-12 10M90 12v16" strokeWidth="3"/><circle cx="44" cy="70" r="9"/><circle cx="136" cy="70" r="9"/><rect x="64" y="51" width="52" height="31" rx="7" fill="currentColor" stroke="none" opacity=".13"/><text x="84" y="72" fill="currentColor" stroke="none" fontSize="19" fontWeight="900">?</text><path d="M36 88h16M128 88h16" strokeWidth="4"/><circle cx="44" cy="88" r="3" fill="currentColor" stroke="none"/><circle cx="136" cy="88" r="3" fill="currentColor" stroke="none"/></svg>;
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

      <div className="absolute left-2 top-2 z-10 max-w-[82%] truncate rounded-full border border-white/10 bg-black/20 px-1.5 py-1 text-[5px] font-black uppercase tracking-[0.16em] text-white/75 backdrop-blur-sm sm:text-[6px]">
        {cover.kicker}
      </div>

      <div className="absolute inset-x-0 top-[15%] h-[65%] px-1 text-white/76">
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
