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

const covers: Record<string, CoverIdentity> = {
  "chain-reaction": { kicker: "SOCIAL", mark: "CR", frame: "from-cyan-500/45 via-slate-950 to-violet-700/35", ink: "text-cyan-50", motif: "chain" },
  "how-close": { kicker: "SOCIAL", mark: "1—100", frame: "from-amber-400/45 via-rose-950 to-fuchsia-700/35", ink: "text-amber-50", motif: "gauge" },
  "on-my-list": { kicker: "SOCIAL", mark: "#1?", frame: "from-fuchsia-500/40 via-slate-950 to-cyan-700/30", ink: "text-fuchsia-50", motif: "ranked" },
  "all-about-you": { kicker: "GUEST OF HONOR", mark: "YOU", frame: "from-amber-300/40 via-rose-950 to-pink-600/35", ink: "text-amber-50", motif: "spotlight" },
  "inside-man": { kicker: "SOCIAL DEDUCTION", mark: "IM", frame: "from-red-600/35 via-slate-950 to-cyan-700/30", ink: "text-red-50", motif: "spy" },
  "phone-holdem": { kicker: "PRIVATE-SEAT POKER", mark: "HOLD'EM", frame: "from-rose-600/40 via-fuchsia-950 to-slate-950", ink: "text-rose-50", motif: "poker" },
  "live-craps": { kicker: "LIVE TABLE", mark: "7 · 11", frame: "from-amber-400/35 via-emerald-950 to-slate-950", ink: "text-amber-50", motif: "dice" },
  "last-call": { kicker: "BLACKWOOD HOUSE", mark: "LAST CALL", frame: "from-amber-200/30 via-rose-950 to-black", ink: "text-amber-50", motif: "mansion" },
  "shot-classic": { kicker: "SHOT CADDY", mark: "CLASSIC", frame: "from-emerald-500/40 via-cyan-950 to-slate-950", ink: "text-emerald-50", motif: "classic" },
  "shot-chaos": { kicker: "SHOT CADDY", mark: "CHAOS", frame: "from-lime-400/40 via-fuchsia-950 to-orange-700/35", ink: "text-lime-50", motif: "chaos" },
  "battle-mode": { kicker: "SHOT CADDY", mark: "VS", frame: "from-cyan-500/35 via-slate-950 to-orange-600/40", ink: "text-cyan-50", motif: "battle" },
  "call-your-score": { kicker: "SHOT CADDY", mark: "CALL IT", frame: "from-sky-500/35 via-indigo-950 to-amber-500/30", ink: "text-sky-50", motif: "prediction" },
  "challenge-skins-pro": { kicker: "SHOT CADDY PRO", mark: "SKINS", frame: "from-amber-300/35 via-emerald-950 to-black", ink: "text-amber-50", motif: "skins" },
  wolf: { kicker: "SHOT CADDY", mark: "WOLF", frame: "from-slate-300/20 via-blue-950 to-slate-950", ink: "text-slate-100", motif: "wolf" },
  "redemption-wolf": { kicker: "SHOT CADDY", mark: "REDEMPTION", frame: "from-orange-400/35 via-red-950 to-slate-950", ink: "text-orange-50", motif: "redemption" },
  "wolf-pack": { kicker: "SHOT CADDY", mark: "PACK", frame: "from-teal-400/30 via-blue-950 to-slate-950", ink: "text-teal-50", motif: "pack" },
  "card-shark-classic": { kicker: "CARD SHARK", mark: "CLASSIC", frame: "from-emerald-500/30 via-slate-950 to-black", ink: "text-emerald-50", motif: "card-classic" },
  "card-shark-stud": { kicker: "CARD SHARK", mark: "STUD", frame: "from-amber-400/30 via-stone-950 to-slate-950", ink: "text-amber-50", motif: "card-stud" },
  "card-shark-draw": { kicker: "CARD SHARK", mark: "DRAW", frame: "from-violet-500/35 via-rose-950 to-slate-950", ink: "text-violet-50", motif: "card-draw" },
  "atw-ladder": { kicker: "AROUND THE WORLD", mark: "LADDER", frame: "from-sky-500/35 via-blue-950 to-amber-500/25", ink: "text-sky-50", motif: "ladder" },
  "atw-sprint": { kicker: "AROUND THE WORLD", mark: "SPRINT", frame: "from-cyan-400/40 via-blue-950 to-lime-500/25", ink: "text-cyan-50", motif: "sprint" },
  "atw-survival": { kicker: "AROUND THE WORLD", mark: "SURVIVAL", frame: "from-red-500/40 via-slate-950 to-orange-500/25", ink: "text-red-50", motif: "survival" },
  "disc-warrior": { kicker: "SHOT CADDY", mark: "WARRIOR", frame: "from-amber-300/35 via-indigo-950 to-cyan-700/30", ink: "text-amber-50", motif: "warrior" },
  "clear-the-stack": { kicker: "PUTTING PRESSURE", mark: "CTS", frame: "from-sky-400/40 via-cyan-950 to-slate-950", ink: "text-sky-50", motif: "stack" },
  "quest-digital": { kicker: "QUEST CADDY", mark: "CHRONICLE", frame: "from-violet-500/45 via-fuchsia-950 to-slate-950", ink: "text-violet-50", motif: "chronicle" },
  "quest-disc-golf": { kicker: "QUEST CADDY", mark: "REAL THROWS", frame: "from-emerald-500/35 via-slate-950 to-amber-500/30", ink: "text-emerald-50", motif: "quest-course" },
  "play-point-trivia": { kicker: "PLAY AMPLIFIED", mark: "TRIVIA", frame: "from-blue-500/40 via-indigo-950 to-cyan-600/35", ink: "text-blue-50", motif: "trivia" },
};

function CoverGlyph({ motif }: { motif: CoverMotif }) {
  const common = "h-full w-full";
  const props = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (motif === "chain") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><circle cx="40" cy="68" r="16"/><circle cx="91" cy="42" r="16"/><circle cx="140" cy="72" r="16"/><path d="M54 60 76 48M106 50l20 13"/><circle cx="91" cy="42" r="5" fill="currentColor" stroke="none"/><path d="M29 91c38 13 79 12 121-3" strokeDasharray="4 7" opacity=".35"/></svg>;
  if (motif === "gauge") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="M34 86a58 58 0 0 1 112 0"/><path d="M48 78 39 73M62 58l-7-8M90 50V37M118 58l7-8M132 78l9-5"/><path d="m90 82 32-31"/><circle cx="90" cy="82" r="7"/><text x="25" y="101" fill="currentColor" stroke="none" fontSize="10" fontWeight="800">1</text><text x="137" y="101" fill="currentColor" stroke="none" fontSize="10" fontWeight="800">100</text></svg>;
  if (motif === "ranked") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><rect x="42" y="20" width="92" height="72" rx="12"/><path d="M59 39h15M59 56h37M59 73h25"/><text x="104" y="44" fill="currentColor" stroke="none" fontSize="16" fontWeight="900">#1</text><path d="M108 59h13M108 68h13M108 77h13" opacity=".45"/><path d="M30 99c37-10 78-10 121 0" strokeDasharray="4 7" opacity=".35"/></svg>;
  if (motif === "spotlight") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="M62 16h56l-14 51H76L62 16Z" opacity=".3"/><circle cx="90" cy="57" r="22"/><path d="M54 101c5-23 17-34 36-34s31 11 36 34"/><path d="M34 28l8 4M146 28l-8 4M52 13l5 8M128 13l-5 8" opacity=".6"/><circle cx="90" cy="57" r="5" fill="currentColor" stroke="none"/></svg>;
  if (motif === "spy") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="M35 61c28-28 82-28 110 0-28 28-82 28-110 0Z"/><circle cx="90" cy="61" r="19"/><circle cx="90" cy="61" r="6" fill="currentColor" stroke="none"/><path d="M47 24h87M54 95h73" strokeDasharray="10 6" opacity=".35"/><path d="M28 37h30M122 84h31" opacity=".5"/></svg>;
  if (motif === "poker") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><rect x="45" y="23" width="48" height="70" rx="8" transform="rotate(-10 45 23)"/><rect x="91" y="21" width="48" height="70" rx="8" transform="rotate(8 91 21)"/><path d="M112 42c4-7 14-3 12 5-2 6-12 13-12 13s-10-7-12-13c-2-8 8-12 12-5Z" fill="currentColor" stroke="none"/><circle cx="51" cy="87" r="13"/><circle cx="51" cy="87" r="7"/></svg>;
  if (motif === "dice") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><rect x="35" y="27" width="56" height="56" rx="10" transform="rotate(-8 35 27)"/><rect x="91" y="35" width="54" height="54" rx="10" transform="rotate(9 91 35)"/>{[[53,45],[72,62],[51,78],[108,51],[128,72],[109,83]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4" fill="currentColor" stroke="none"/>)}<path d="M27 101h126" opacity=".35"/></svg>;
  if (motif === "mansion") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="M36 99h108M45 99V51l45-28 45 28v48M60 99V61h60v38M80 99V76h20v23"/><path d="M64 47h52M72 39h36"/><rect x="111" y="68" width="11" height="14" rx="2"/><path d="M29 101c40 8 81 8 122 0" strokeDasharray="4 8" opacity=".35"/><circle cx="116" cy="74" r="2.5" fill="currentColor" stroke="none"/></svg>;
  if (motif === "classic") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><ellipse cx="47" cy="37" rx="28" ry="8" transform="rotate(-12 47 37)"/><path d="M22 43c20 8 39 8 57-1M122 22v76M102 45h40M106 56h32M111 67h22M116 78h12M96 98h52"/><path d="M73 36c18-2 32 2 46 10" strokeDasharray="5 6" opacity=".5"/></svg>;
  if (motif === "chaos") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="m27 79 29-50 13 25 22-31 17 37 20-20 25 45"/><path d="M118 23v76M99 47h38M104 59h28M109 71h18M114 83h8"/><path d="M33 96c28-17 55-18 80-3" strokeDasharray="3 6" opacity=".45"/><circle cx="56" cy="29" r="5" fill="currentColor" stroke="none"/></svg>;
  if (motif === "battle") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="M33 35h43l17 26-17 26H33L16 61l17-26ZM147 35h-43L87 61l17 26h43l17-26-17-26Z"/><text x="78" y="68" fill="currentColor" stroke="none" fontSize="20" fontWeight="900">VS</text><circle cx="53" cy="61" r="9"/><circle cx="127" cy="61" r="9"/></svg>;
  if (motif === "prediction") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><circle cx="103" cy="61" r="37"/><circle cx="103" cy="61" r="24"/><circle cx="103" cy="61" r="10"/><path d="m32 86 55-25M33 86l14-2-9-10"/><rect x="22" y="24" width="50" height="28" rx="8"/><text x="35" y="43" fill="currentColor" stroke="none" fontSize="12" fontWeight="900">-2</text></svg>;
  if (motif === "skins") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="m90 19 15 26 30 6-21 22 4 30-28-13-28 13 4-30-21-22 30-6 15-26Z"/><circle cx="90" cy="61" r="18"/><path d="M82 61h16M90 53v16"/><path d="M32 102h116" opacity=".35"/></svg>;
  if (motif === "wolf") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="m51 89 12-52 24 16 28-22 15 56-40 18-39-16Z"/><path d="m63 37 13 17M115 31l-15 23M75 72l15 9 17-10M82 91h17"/><circle cx="75" cy="67" r="3" fill="currentColor" stroke="none"/><circle cx="106" cy="66" r="3" fill="currentColor" stroke="none"/><circle cx="137" cy="29" r="15" opacity=".2"/></svg>;
  if (motif === "redemption") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="M25 91c18-8 31-16 42-27 10-11 21-19 34-20 18-2 34 8 53 32"/><path d="M116 32a31 31 0 0 1 31 31"/><path d="M116 22v18M147 31l-13 13M159 62h-18" opacity=".7"/><path d="m58 92 11-44 20 13 22-17 12 46-32 14-33-12Z" opacity=".9"/></svg>;
  if (motif === "pack") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="m31 92 9-39 18 12 18-14 10 39-27 12-28-10ZM94 88l10-44 19 13 21-16 11 45-30 14-31-12Z"/><path d="M72 29c17-11 35-12 54-2" strokeDasharray="5 6" opacity=".4"/><circle cx="125" cy="28" r="16" opacity=".15"/></svg>;
  if (motif === "card-classic") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><rect x="48" y="24" width="46" height="68" rx="7" transform="rotate(-8 48 24)"/><rect x="87" y="22" width="46" height="68" rx="7" transform="rotate(8 87 22)"/><path d="M108 42c4-7 13-3 11 4-1 5-11 12-11 12s-10-7-11-12c-2-7 7-11 11-4Z" fill="currentColor" stroke="none"/><ellipse cx="38" cy="91" rx="18" ry="6"/></svg>;
  if (motif === "card-stud") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}>{[0,1,2,3].map((i)=><rect key={i} x={35+i*25} y={28+(i%2)*5} width="38" height="57" rx="6" transform={`rotate(${i*4-7} ${35+i*25} ${28+(i%2)*5})`}/>)}<path d="M29 99h123" opacity=".35"/><circle cx="52" cy="48" r="4" fill="currentColor" stroke="none"/></svg>;
  if (motif === "card-draw") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><rect x="40" y="30" width="44" height="62" rx="7"/><rect x="95" y="24" width="44" height="62" rx="7" transform="rotate(10 95 24)"/><path d="M74 18c25-12 50-7 67 10M141 28l-12-1 6-10"/><path d="M108 48c4-7 13-3 11 4-1 5-11 12-11 12s-10-7-11-12c-2-7 7-11 11-4Z" fill="currentColor" stroke="none"/></svg>;
  if (motif === "ladder") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><circle cx="90" cy="61" r="43"/><circle cx="90" cy="61" r="7"/><path d="M90 18v43M133 61H90M90 104V61M47 61h43"/><path d="M22 101h32V87h27V73h27V59h29"/><text x="30" y="95" fill="currentColor" stroke="none" fontSize="9" fontWeight="900">1</text><text x="128" y="54" fill="currentColor" stroke="none" fontSize="9" fontWeight="900">4</text></svg>;
  if (motif === "sprint") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><circle cx="105" cy="61" r="35"/><path d="M105 26v35l25 12"/><path d="M24 36h45M14 55h54M29 74h38M43 93h28" opacity=".7"/><circle cx="105" cy="61" r="5" fill="currentColor" stroke="none"/><path d="M91 18h28"/></svg>;
  if (motif === "survival") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><circle cx="88" cy="60" r="43"/><path d="M88 17v43M131 60H88M88 103V60M45 60h43"/><path d="M130 23c4-7 13-3 11 4-1 5-11 12-11 12s-10-7-11-12c-2-7 7-11 11-4ZM145 52c3-6 11-3 10 3-2 5-10 10-10 10s-8-5-10-10c-1-6 7-9 10-3Z" fill="currentColor" stroke="none"/><path d="M121 86l29 18M150 86l-29 18"/></svg>;
  if (motif === "warrior") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="M38 96h19V83h19V70h19V57h19V44h28"/><path d="m62 89 20-47 18 12 19-23 20 54"/><circle cx="140" cy="31" r="9"/><path d="M29 103h125" opacity=".35"/><text x="31" y="91" fill="currentColor" stroke="none" fontSize="9" fontWeight="900">1</text><text x="143" y="42" fill="currentColor" stroke="none" fontSize="9" fontWeight="900">6</text></svg>;
  if (motif === "stack") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><ellipse cx="65" cy="77" rx="31" ry="8"/><ellipse cx="65" cy="61" rx="26" ry="7"/><ellipse cx="65" cy="47" rx="21" ry="6"/><path d="M127 22v78M108 45h38M112 56h30M117 67h20M122 78h10M103 100h48"/><path d="M90 55c14-5 25-5 36 1" strokeDasharray="5 6" opacity=".45"/></svg>;
  if (motif === "chronicle") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="M90 16 126 34v30c0 23-13 38-36 51-23-13-36-28-36-51V34l36-18Z"/><path d="m90 39 8 17 19 3-14 13 4 19-17-9-17 9 4-19-14-13 19-3 8-17Z"/><path d="M28 92c15-19 29-28 43-29M109 63c17 3 31 13 43 30" strokeDasharray="5 6" opacity=".45"/></svg>;
  if (motif === "quest-course") return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="M126 22v78M107 45h38M111 56h30M116 67h20M121 78h10M102 100h48"/><ellipse cx="47" cy="37" rx="26" ry="7" transform="rotate(-12 47 37)"/><path d="M68 38c24 3 41 13 52 30" strokeDasharray="5 6"/><path d="M25 99c26-17 48-23 69-18" opacity=".4"/><path d="m83 76 7 7 7-7 7 7"/></svg>;
  return <svg aria-hidden="true" viewBox="0 0 180 120" className={common} {...props}><path d="M63 43c2-18 14-29 32-29 20 0 34 12 34 30 0 15-8 22-21 30-10 6-13 11-13 21"/><circle cx="95" cy="106" r="5" fill="currentColor" stroke="none"/><path d="M24 31h18M20 54h26M27 79h19M131 81h23" opacity=".6"/><path d="M141 25v11M135 30h12"/></svg>;
}

export function GameCoverArt({ gameId }: { gameId: string }) {
  const identity = covers[gameId] ?? covers["chain-reaction"];
  return (
    <div aria-hidden="true" data-game-cover={gameId} className={`relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br ${identity.frame} ${identity.ink}`}>
      <div className="absolute -right-5 -top-6 h-20 w-20 rounded-full border border-white/10 bg-white/10 blur-xl" />
      <div className="absolute -bottom-7 -left-6 h-20 w-20 rounded-full border border-white/10 bg-black/20 blur-xl" />
      <div className="absolute inset-1 opacity-75"><CoverGlyph motif={identity.motif} /></div>
      <div className="absolute left-2 top-2 text-[6px] font-black uppercase tracking-[0.18em] text-white/55 sm:text-[7px]">{identity.kicker}</div>
      <div className="absolute bottom-2 left-2 rounded-full border border-white/15 bg-black/20 px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[0.12em] text-white/80 backdrop-blur-sm sm:text-[7px]">{identity.mark}</div>
    </div>
  );
}
