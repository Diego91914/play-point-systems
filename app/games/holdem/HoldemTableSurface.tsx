type Card = string;

export type SurfacePlayer = {
  id: string;
  name: string;
  seat: number;
  stack: number;
  streetBet: number;
  contribution: number;
  status: string;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isTurn: boolean;
  holeCards: Card[];
};

export type SurfaceWinner = {
  playerId: string;
  name: string;
  amount: number;
  handName: string;
  bestFive: Card[];
};

const rankLabel: Record<string, string> = {
  "14": "A", "13": "K", "12": "Q", "11": "J", "10": "10", "9": "9", "8": "8",
  "7": "7", "6": "6", "5": "5", "4": "4", "3": "3", "2": "2",
};
const suitLabel: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };

function cardParts(card: Card) {
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  return { rank: rankLabel[rank] ?? rank, suit: suitLabel[suit] ?? suit, red: suit === "h" || suit === "d" };
}

export function formatChips(value: number) {
  return new Intl.NumberFormat().format(value);
}

export function PlayingCard({
  card,
  hidden = false,
  small = false,
  delay = 0,
  reveal = false,
}: {
  card?: Card;
  hidden?: boolean;
  small?: boolean;
  delay?: number;
  reveal?: boolean;
}) {
  const size = small ? "h-[66px] w-[46px] text-base sm:h-[74px] sm:w-[52px]" : "h-[92px] w-[62px] text-xl sm:h-[108px] sm:w-[72px]";
  if (hidden || !card) {
    return (
      <div
        className={`${size} holdem-card-back holdem-card-deal shrink-0 rounded-xl border border-cyan-100/30 shadow-[0_10px_28px_rgba(0,0,0,0.4)]`}
        style={{ animationDelay: `${delay}ms` }}
        aria-label="Hidden playing card"
      />
    );
  }
  const { rank, suit, red } = cardParts(card);
  return (
    <div
      className={`${size} ${reveal ? "holdem-board-reveal" : "holdem-card-deal"} flex shrink-0 flex-col justify-between rounded-xl border border-white/90 bg-[linear-gradient(145deg,#fff,#edf1f4)] p-2 font-black shadow-[0_12px_30px_rgba(0,0,0,0.42)] ${red ? "text-red-600" : "text-slate-950"}`}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`${rank}${suit}`}
    >
      <span>{rank}</span>
      <span className="self-end text-2xl leading-none">{suit}</span>
    </div>
  );
}

function orderedAroundViewer(players: SurfacePlayer[], viewerSeat: number | null) {
  if (viewerSeat == null) return [...players].sort((a, b) => a.seat - b.seat);
  return [...players].sort((a, b) => {
    const aOffset = (a.seat - viewerSeat + 8) % 8;
    const bOffset = (b.seat - viewerSeat + 8) % 8;
    return aOffset - bOffset;
  });
}

function seatPosition(index: number, total: number) {
  const angle = ((90 + (index * 360) / Math.max(1, total)) * Math.PI) / 180;
  return {
    left: `${50 + Math.cos(angle) * 42}%`,
    top: `${50 + Math.sin(angle) * 40}%`,
  };
}

function PlayerSeat({ player, position, isMe }: { player: SurfacePlayer; position: { left: string; top: string }; isMe: boolean }) {
  const folded = player.status === "folded" || player.status === "out";
  const allIn = player.status === "all_in";
  const showHiddenCards = player.holeCards.length === 0 && (player.status === "active" || player.status === "all_in");
  return (
    <div
      className={`absolute z-20 w-[112px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-2.5 py-2.5 text-center shadow-[0_14px_32px_rgba(0,0,0,0.38)] transition duration-300 sm:w-[142px] sm:px-3 ${
        player.isTurn
          ? "holdem-turn-pulse border-amber-300/80 bg-[#221b08]"
          : isMe
            ? "border-cyan-300/45 bg-[#071a21]/95"
            : "border-white/15 bg-black/80"
      } ${folded ? "opacity-45 grayscale" : "opacity-100"}`}
      style={position}
    >
      <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-[0.08em] sm:text-[10px]">
        {player.isDealer && <span className="rounded-full bg-white px-1.5 py-0.5 text-slate-950">D</span>}
        {player.isSmallBlind && <span className="rounded-full bg-cyan-300/18 px-1.5 py-0.5 text-cyan-100">SB</span>}
        {player.isBigBlind && <span className="rounded-full bg-violet-300/18 px-1.5 py-0.5 text-violet-100">BB</span>}
        {allIn && <span className="rounded-full bg-red-400/18 px-1.5 py-0.5 text-red-100">ALL IN</span>}
      </div>
      <div className="mt-1 truncate text-xs font-black text-white sm:text-sm">{player.name}{isMe ? " · You" : ""}</div>
      <div className="mt-0.5 text-[11px] font-bold text-amber-200 sm:text-xs">{formatChips(player.stack)}</div>
      {player.streetBet > 0 && <div className="mt-1 text-[9px] font-semibold text-white/55 sm:text-[10px]">Bet {formatChips(player.streetBet)}</div>}
      {player.status === "folded" && <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-white/40">Folded</div>}
      {(player.holeCards.length > 0 || showHiddenCards) && (
        <div className="mt-2 flex justify-center -space-x-2">
          {player.holeCards.length > 0
            ? player.holeCards.map((card, index) => <PlayingCard key={card} card={card} small delay={index * 120} />)
            : [0, 1].map((index) => <PlayingCard key={`hidden-${player.id}-${index}`} hidden small delay={index * 120} />)}
        </div>
      )}
    </div>
  );
}

export function HoldemTableSurface({
  players,
  board,
  pot,
  street,
  handNumber,
  winners,
  viewerId,
  publicMode = false,
}: {
  players: SurfacePlayer[];
  board: Card[];
  pot: number;
  street: string;
  handNumber: number;
  winners: SurfaceWinner[];
  viewerId?: string | null;
  publicMode?: boolean;
}) {
  const viewer = viewerId ? players.find((player) => player.id === viewerId) : null;
  const ordered = orderedAroundViewer(players, publicMode ? null : viewer?.seat ?? null);
  const winningIds = new Set(winners.map((winner) => winner.playerId));

  return (
    <div className="relative min-h-[500px] overflow-hidden rounded-[42px] border border-emerald-200/20 bg-[#04120e] shadow-[0_28px_80px_rgba(0,0,0,0.42)] sm:min-h-[620px]">
      <style>{`
        @keyframes holdemDeal { 0% { opacity:0; transform:translate(0,-42px) rotate(-8deg) scale(.72); } 70% { transform:translate(0,4px) rotate(1deg) scale(1.03); } 100% { opacity:1; transform:none; } }
        @keyframes holdemReveal { 0% { opacity:0; transform:translateY(-24px) rotateY(90deg) scale(.82); } 55% { opacity:1; transform:translateY(2px) rotateY(-8deg) scale(1.04); } 100% { transform:none; } }
        @keyframes holdemPulse { 0%,100% { box-shadow:0 0 0 1px rgba(252,211,77,.35),0 14px 32px rgba(0,0,0,.38); } 50% { box-shadow:0 0 0 5px rgba(252,211,77,.14),0 0 34px rgba(252,211,77,.30); } }
        @keyframes holdemWinner { 0% { transform:scale(.88); opacity:.35; } 55% { transform:scale(1.05); opacity:1; } 100% { transform:scale(1); } }
        .holdem-card-deal { animation:holdemDeal .46s cubic-bezier(.2,.8,.2,1) both; transform-origin:center; }
        .holdem-board-reveal { animation:holdemReveal .52s cubic-bezier(.2,.75,.2,1) both; transform-origin:center; }
        .holdem-turn-pulse { animation:holdemPulse 1.5s ease-in-out infinite; }
        .holdem-winner-pop { animation:holdemWinner .5s ease-out both; }
        .holdem-card-back { background:linear-gradient(135deg,rgba(7,58,79,.98),rgba(8,34,54,.98)),repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(255,255,255,.09) 6px,rgba(255,255,255,.09) 8px); }
        @media (prefers-reduced-motion: reduce) { .holdem-card-deal,.holdem-board-reveal,.holdem-turn-pulse,.holdem-winner-pop { animation:none !important; } }
      `}</style>

      <div className="absolute inset-[7%] rounded-[46%] border-[10px] border-[#6e4325] bg-[radial-gradient(ellipse_at_center,#147451_0%,#0c5a40_48%,#073c2d_78%,#052a20_100%)] shadow-[inset_0_0_80px_rgba(0,0,0,.55),0_0_0_2px_rgba(255,255,255,.08)] sm:border-[14px]" />
      <div className="pointer-events-none absolute inset-[11%] rounded-[46%] border border-emerald-100/10" />

      <div className="absolute left-1/2 top-1/2 z-10 w-[72%] -translate-x-1/2 -translate-y-1/2 text-center sm:w-auto">
        <div className="text-[9px] font-black uppercase tracking-[0.24em] text-emerald-100/48">Hand {handNumber} · {street}</div>
        <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-amber-200/80">Pot {formatChips(pot)}</div>
        <div className="mt-3 flex justify-center gap-1.5 sm:gap-2">
          {Array.from({ length: 5 }, (_, index) => {
            const card = board[index];
            return card
              ? <PlayingCard key={`${index}-${card}`} card={card} reveal delay={index < 3 ? index * 100 : 0} />
              : <div key={`empty-${index}`} className="h-[92px] w-[62px] rounded-xl border border-dashed border-white/12 bg-black/10 sm:h-[108px] sm:w-[72px]" />;
          })}
        </div>
        {winners.length > 0 && (
          <div className="holdem-winner-pop mx-auto mt-4 max-w-sm rounded-2xl border border-amber-300/35 bg-black/75 px-4 py-3 shadow-[0_0_45px_rgba(252,211,77,.18)]">
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-200/65">Winner</div>
            <div className="mt-1 text-lg font-black text-white">{winners.map((winner) => winner.name).join(" · ")}</div>
            <div className="mt-1 text-xs font-semibold text-amber-100/80">{winners.map((winner) => `${winner.handName} · +${formatChips(winner.amount)}`).join(" · ")}</div>
          </div>
        )}
      </div>

      {ordered.map((player, index) => (
        <div key={player.id} className={winningIds.has(player.id) ? "holdem-winner-pop" : "contents"}>
          <PlayerSeat player={player} position={seatPosition(index, ordered.length)} isMe={player.id === viewerId} />
        </div>
      ))}
    </div>
  );
}
