type SceneKind =
  | "chain" | "gauge" | "ranked" | "spotlight" | "spy" | "poker" | "dice" | "mansion"
  | "disc" | "chaos" | "battle" | "target" | "skins" | "wolf" | "pack" | "cards"
  | "ladder" | "sprint" | "survival" | "warrior" | "stack" | "quest" | "quest-course" | "trivia";

type CoverIdentity = {
  kicker: string;
  mark: string;
  frame: string;
  scene: SceneKind;
  glow: string;
};

const covers: Record<string, CoverIdentity> = {
  "chain-reaction": { kicker: "SOCIAL", mark: "CHAIN", frame: "from-cyan-500 via-slate-950 to-violet-950", scene: "chain", glow: "bg-cyan-300/25" },
  "how-close": { kicker: "1 TO 100", mark: "HOW CLOSE?", frame: "from-amber-500 via-rose-950 to-fuchsia-950", scene: "gauge", glow: "bg-amber-300/25" },
  "on-my-list": { kicker: "RANK IT", mark: "#1?", frame: "from-fuchsia-600 via-slate-950 to-cyan-950", scene: "ranked", glow: "bg-fuchsia-300/25" },
  "all-about-you": { kicker: "GUEST OF HONOR", mark: "YOU", frame: "from-amber-500 via-rose-950 to-pink-950", scene: "spotlight", glow: "bg-amber-300/25" },
  "inside-man": { kicker: "SOCIAL DEDUCTION", mark: "INSIDE MAN", frame: "from-red-700 via-slate-950 to-cyan-950", scene: "spy", glow: "bg-red-400/20" },
  "phone-holdem": { kicker: "PRIVATE-SEAT POKER", mark: "HOLD'EM", frame: "from-rose-700 via-fuchsia-950 to-slate-950", scene: "poker", glow: "bg-rose-400/25" },
  "live-craps": { kicker: "LIVE TABLE", mark: "7 · 11", frame: "from-amber-500 via-emerald-950 to-slate-950", scene: "dice", glow: "bg-amber-300/25" },
  "last-call": { kicker: "BLACKWOOD HOUSE", mark: "LAST CALL", frame: "from-amber-500 via-rose-950 to-black", scene: "mansion", glow: "bg-amber-200/20" },

  "shot-classic": { kicker: "SHOT CADDY", mark: "CLASSIC", frame: "from-emerald-600 via-cyan-950 to-slate-950", scene: "disc", glow: "bg-emerald-300/25" },
  "shot-chaos": { kicker: "SHOT CADDY", mark: "CHAOS", frame: "from-lime-500 via-fuchsia-950 to-orange-950", scene: "chaos", glow: "bg-lime-300/25" },
  "battle-mode": { kicker: "SHOT CADDY", mark: "BATTLE", frame: "from-cyan-600 via-slate-950 to-orange-950", scene: "battle", glow: "bg-orange-300/20" },
  "call-your-score": { kicker: "SHOT CADDY", mark: "CALL IT", frame: "from-sky-600 via-indigo-950 to-amber-950", scene: "target", glow: "bg-sky-300/25" },
  "challenge-skins-pro": { kicker: "SHOT CADDY PRO", mark: "SKINS", frame: "from-amber-500 via-emerald-950 to-black", scene: "skins", glow: "bg-amber-300/20" },
  wolf: { kicker: "SHOT CADDY", mark: "WOLF", frame: "from-slate-500 via-blue-950 to-slate-950", scene: "wolf", glow: "bg-slate-200/20" },
  "redemption-wolf": { kicker: "SHOT CADDY", mark: "REDEEM", frame: "from-orange-600 via-red-950 to-slate-950", scene: "wolf", glow: "bg-orange-300/25" },
  "wolf-pack": { kicker: "SHOT CADDY", mark: "PACK", frame: "from-teal-600 via-blue-950 to-slate-950", scene: "pack", glow: "bg-teal-300/20" },

  "card-shark-classic": { kicker: "CARD SHARK", mark: "CLASSIC", frame: "from-emerald-600 via-slate-950 to-black", scene: "cards", glow: "bg-emerald-300/20" },
  "card-shark-stud": { kicker: "CARD SHARK", mark: "STUD", frame: "from-amber-600 via-stone-950 to-slate-950", scene: "cards", glow: "bg-amber-300/20" },
  "card-shark-draw": { kicker: "CARD SHARK", mark: "DRAW", frame: "from-violet-600 via-rose-950 to-slate-950", scene: "cards", glow: "bg-violet-300/20" },
  "atw-ladder": { kicker: "AROUND THE WORLD", mark: "LADDER", frame: "from-sky-600 via-blue-950 to-amber-950", scene: "ladder", glow: "bg-sky-300/20" },
  "atw-sprint": { kicker: "AROUND THE WORLD", mark: "SPRINT", frame: "from-cyan-500 via-blue-950 to-lime-950", scene: "sprint", glow: "bg-cyan-300/20" },
  "atw-survival": { kicker: "AROUND THE WORLD", mark: "SURVIVE", frame: "from-red-600 via-slate-950 to-orange-950", scene: "survival", glow: "bg-red-300/20" },
  "disc-warrior": { kicker: "SHOT CADDY", mark: "WARRIOR", frame: "from-amber-500 via-indigo-950 to-cyan-950", scene: "warrior", glow: "bg-amber-300/20" },
  "clear-the-stack": { kicker: "PUTTING PRESSURE", mark: "STACK", frame: "from-sky-500 via-cyan-950 to-slate-950", scene: "stack", glow: "bg-sky-300/25" },

  "quest-digital": { kicker: "QUEST CADDY", mark: "QUEST", frame: "from-violet-600 via-fuchsia-950 to-slate-950", scene: "quest", glow: "bg-violet-300/25" },
  "quest-disc-golf": { kicker: "QUEST CADDY", mark: "THROWS", frame: "from-emerald-600 via-slate-950 to-amber-950", scene: "quest-course", glow: "bg-emerald-300/20" },
  "play-point-trivia": { kicker: "LIVE GAME SHOW", mark: "TRIVIA", frame: "from-blue-600 via-indigo-950 to-cyan-950", scene: "trivia", glow: "bg-blue-300/25" },
};

function Scene({ kind }: { kind: SceneKind }) {
  const common = "h-full w-full text-white";
  if (kind === "mansion") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><path fill="currentColor" opacity=".12" d="M0 148h320v42H0z"/><path fill="currentColor" opacity=".86" d="M70 145V82l91-56 89 56v63h-28V91l-61-38-63 38v54H70Z"/><path fill="currentColor" opacity=".35" d="M112 145V98h35v47h-35Zm63 0V98h35v47h-35Z"/><path fill="currentColor" d="M146 145v-32h31v32h-31Z"/><circle cx="243" cy="40" r="23" fill="currentColor" opacity=".18"/><path fill="currentColor" opacity=".5" d="M35 146c22-22 38-34 57-39l3 39H35Zm248 0c-22-22-38-34-57-39l-3 39h60Z"/></svg>;
  if (kind === "poker") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><ellipse cx="160" cy="128" rx="124" ry="50" fill="currentColor" opacity=".12"/><rect x="99" y="43" width="58" height="82" rx="9" transform="rotate(-9 99 43)" fill="currentColor" opacity=".88"/><rect x="161" y="39" width="58" height="82" rx="9" transform="rotate(8 161 39)" fill="currentColor" opacity=".7"/><text x="113" y="75" fill="#111827" fontSize="28" fontWeight="900">A</text><text x="181" y="72" fill="#111827" fontSize="28" fontWeight="900">K</text><rect x="240" y="72" width="42" height="76" rx="10" fill="none" stroke="currentColor" strokeWidth="5" opacity=".65"/><circle cx="61" cy="136" r="20" fill="none" stroke="currentColor" strokeWidth="6" opacity=".65"/><circle cx="78" cy="126" r="20" fill="none" stroke="currentColor" strokeWidth="6" opacity=".38"/></svg>;
  if (kind === "dice") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><path d="M20 120c55-45 224-45 280 0v50H20v-50Z" fill="currentColor" opacity=".11"/><g transform="translate(98 50) rotate(-8)"><rect width="70" height="70" rx="13" fill="currentColor" opacity=".85"/><circle cx="19" cy="19" r="6" fill="#052e2b"/><circle cx="51" cy="51" r="6" fill="#052e2b"/></g><g transform="translate(168 55) rotate(10)"><rect width="70" height="70" rx="13" fill="currentColor" opacity=".62"/><circle cx="18" cy="18" r="5" fill="#052e2b"/><circle cx="52" cy="18" r="5" fill="#052e2b"/><circle cx="35" cy="35" r="5" fill="#052e2b"/><circle cx="18" cy="52" r="5" fill="#052e2b"/><circle cx="52" cy="52" r="5" fill="#052e2b"/></g><rect x="38" y="98" width="25" height="45" rx="6" fill="none" stroke="currentColor" strokeWidth="4" opacity=".55"/><rect x="260" y="100" width="25" height="45" rx="6" fill="none" stroke="currentColor" strokeWidth="4" opacity=".55"/></svg>;
  if (kind === "gauge") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><path d="M55 145a108 108 0 0 1 210 0" fill="none" stroke="currentColor" strokeWidth="8" opacity=".7"/><path d="M160 145 230 72" stroke="currentColor" strokeWidth="8"/><circle cx="160" cy="145" r="13" fill="currentColor"/><text x="44" y="166" fill="currentColor" fontWeight="900" fontSize="22">1</text><text x="246" y="166" fill="currentColor" fontWeight="900" fontSize="22">100</text></svg>;
  if (kind === "spy") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><path d="M47 96c60-62 166-62 226 0-60 62-166 62-226 0Z" fill="none" stroke="currentColor" strokeWidth="7" opacity=".75"/><circle cx="160" cy="96" r="43" fill="currentColor" opacity=".12"/><circle cx="160" cy="96" r="17" fill="currentColor" opacity=".9"/><path d="M52 34h128M78 154h185" stroke="currentColor" strokeWidth="12" opacity=".16"/></svg>;
  if (kind === "chain") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><path d="M44 125 119 77l78 40 78-62" fill="none" stroke="currentColor" strokeWidth="7" opacity=".72"/><circle cx="44" cy="125" r="24" fill="none" stroke="currentColor" strokeWidth="6"/><circle cx="119" cy="77" r="29" fill="currentColor" opacity=".22"/><circle cx="197" cy="117" r="31" fill="none" stroke="currentColor" strokeWidth="6"/><circle cx="275" cy="55" r="21" fill="currentColor" opacity=".8"/></svg>;
  if (kind === "ranked") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><rect x="83" y="30" width="156" height="132" rx="22" fill="currentColor" opacity=".12"/><text x="107" y="84" fill="currentColor" fontSize="48" fontWeight="900">#1?</text><path d="M106 108h90M106 133h62M205 108h17M205 133h17" stroke="currentColor" strokeWidth="7" opacity=".65"/></svg>;
  if (kind === "spotlight") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><path d="M104 0h112l-30 130h-52L104 0Z" fill="currentColor" opacity=".12"/><circle cx="160" cy="91" r="39" fill="none" stroke="currentColor" strokeWidth="6" opacity=".7"/><path d="M90 180c8-49 31-72 70-72s62 23 70 72" fill="currentColor" opacity=".15"/></svg>;
  if (kind === "wolf" || kind === "pack") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><circle cx="240" cy="48" r="38" fill="currentColor" opacity=".12"/><path d="m160 38 31 21 33-13-13 49c0 39-23 62-51 78-28-16-51-39-51-78L96 46l33 13 31-21Z" fill="currentColor" opacity=".72"/>{kind === "pack" ? <><path d="m62 89 19 13 20-8-8 31c0 23-14 37-31 47-17-10-31-24-31-47l-8-31 20 8 19-13Z" fill="currentColor" opacity=".3"/><path d="m259 89 19 13 20-8-8 31c0 23-14 37-31 47-17-10-31-24-31-47l-8-31 20 8 19-13Z" fill="currentColor" opacity=".3"/></> : null}</svg>;
  if (kind === "cards") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><rect x="76" y="42" width="72" height="104" rx="12" transform="rotate(-9 76 42)" fill="currentColor" opacity=".72"/><rect x="154" y="35" width="72" height="104" rx="12" transform="rotate(8 154 35)" fill="currentColor" opacity=".4"/><path d="M56 162c68-22 139-22 208 0" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="9 10" opacity=".35"/></svg>;
  if (kind === "disc" || kind === "chaos" || kind === "battle" || kind === "target" || kind === "skins" || kind === "warrior" || kind === "ladder" || kind === "sprint" || kind === "survival" || kind === "stack" || kind === "quest-course") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><ellipse cx="83" cy="78" rx="51" ry="15" transform="rotate(-10 83 78)" fill="currentColor" opacity=".72"/><path d="M120 79c54 2 82 19 111 53" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="10 10" opacity=".45"/><path d="M250 43v113M222 76h56M228 91h44M234 106h32M240 121h20" stroke="currentColor" strokeWidth="5" opacity=".68"/>{kind === "chaos" ? <path d="m116 45 28 27 24-37 27 42 34-31" fill="none" stroke="currentColor" strokeWidth="8" opacity=".65"/> : null}{kind === "battle" ? <text x="142" y="102" fill="currentColor" fontSize="38" fontWeight="900">VS</text> : null}{kind === "target" ? <><circle cx="171" cy="91" r="38" fill="none" stroke="currentColor" strokeWidth="5" opacity=".35"/><circle cx="171" cy="91" r="18" fill="currentColor" opacity=".4"/></> : null}{kind === "stack" ? <g opacity=".65"><ellipse cx="67" cy="139" rx="46" ry="11" fill="none" stroke="currentColor" strokeWidth="5"/><ellipse cx="67" cy="119" rx="38" ry="9" fill="none" stroke="currentColor" strokeWidth="5"/><ellipse cx="67" cy="102" rx="30" ry="8" fill="none" stroke="currentColor" strokeWidth="5"/></g> : null}</svg>;
  if (kind === "quest") return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><path d="M29 53c44-19 84-15 119 10v103c-37-22-77-25-119-11V53Zm262 0c-44-19-84-15-119 10v103c37-22 77-25 119-11V53Z" fill="currentColor" opacity=".14"/><path d="m160 23 53 26v48c0 38-20 65-53 84-33-19-53-46-53-84V49l53-26Z" fill="none" stroke="currentColor" strokeWidth="6" opacity=".74"/><path d="m160 61 12 24 27 4-20 19 5 27-24-13-24 13 5-27-20-19 27-4 12-24Z" fill="currentColor" opacity=".5"/></svg>;
  return <svg aria-hidden="true" viewBox="0 0 320 190" className={common}><path d="M35 48h250v112H35z" fill="currentColor" opacity=".09"/><path d="M35 82h250M97 48v112M223 48v112" stroke="currentColor" strokeWidth="5" opacity=".25"/><circle cx="95" cy="118" r="17" fill="currentColor" opacity=".5"/><circle cx="225" cy="118" r="17" fill="currentColor" opacity=".5"/><rect x="123" y="84" width="74" height="50" rx="12" fill="currentColor" opacity=".35"/><text x="148" y="119" fill="currentColor" fontSize="34" fontWeight="900">?</text></svg>;
}

export function EditorialGameCoverArt({ gameId, immersive = false }: { gameId: string; immersive?: boolean }) {
  const cover = covers[gameId];
  if (!cover) throw new Error(`Missing game cover identity: ${gameId}`);

  return (
    <div
      data-game-cover={gameId}
      className={`relative overflow-hidden bg-gradient-to-br ${cover.frame} text-white ${immersive ? "h-full min-h-full" : "aspect-[4/3] min-h-full"}`}
    >
      <div className={`absolute -right-[12%] -top-[18%] h-[70%] w-[70%] rounded-full blur-3xl ${cover.glow}`} />
      <div className="absolute -bottom-[20%] -left-[15%] h-[65%] w-[65%] rounded-full bg-black/45 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_28%,transparent_70%,rgba(255,255,255,0.04))]" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/55 to-transparent" />
      <div className={`absolute inset-x-[4%] ${immersive ? "top-[8%] h-[82%]" : "top-[14%] h-[66%]"}`}><Scene kind={cover.scene} /></div>
      <div className={`absolute left-4 top-4 z-10 rounded-full bg-black/28 px-2.5 py-1.5 font-black uppercase tracking-[0.16em] text-white/68 backdrop-blur-md ${immersive ? "text-[8px] sm:text-[9px]" : "text-[6px]"}`}>{cover.kicker}</div>
      {!immersive ? <div className="absolute bottom-4 left-4 z-10 text-[10px] font-black uppercase tracking-[0.02em] text-white drop-shadow-2xl sm:text-xs">{cover.mark}</div> : null}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
    </div>
  );
}
