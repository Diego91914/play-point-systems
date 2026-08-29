type Card = string;

export type SurfacePlayer = {
  id: string;
  name: string;
  seat: number;
  stack: number;
  streetBet: number;
  contribution: number;
  status: string;
  sittingOut?: boolean;
  finishPlace?: number | null;
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
  const size = small ? "h-[64px] w-[44px] text-base sm:h-[72px] sm:w-[50px]" : "h-[86px] w-[58px] text-lg sm:h-[108px] sm:w-[72px] sm:text-xl";
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
  const horizontalRadius = total <= 2 ? 0 : total <= 4 ? 39 : 41;
  const verticalRadius = total <= 2 ? 34 : total <= 4 ? 33 : 34;
  return {
    left: `${50 + Math.cos(angle) * horizontalRadius}%`,
    top: `${50 + Math.sin(angle) * verticalRadius}%`,
  };
}

function PlayerSeat({
  player,
  position,
  isMe,
  isWinner = false,
  isResult = false,
}: {
  player: SurfacePlayer;
  position: { left: string; top: string };
  isMe: boolean;
  isWinner?: boolean;
  isResult?: boolean;
}) {
  const eliminated = player.finishPlace != null;
  const folded = player.status === "folded" || player.status === "out" || eliminated;
  const allIn = player.status === "all_in";
  const showHiddenCards = player.holeCards.length === 0 && (player.status === "active" || player.status === "all_in");
  const resultDimmed = isResult && !isWinner && !folded;

  return (
    <div
      className={`absolute w-[112px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-2.5 py-2 text-center shadow-[0_14px_32px_rgba(0,0,0,0.38)] transition duration-300 sm:w-[136px] sm:px-3 sm:py-2.5 ${
        isWinner
          ? "z-50 holdem-winning-seat border-amber-100 bg-[#2b2108]/[.99] shadow-[0_0_0_4px_rgba(252,211,77,.24),0_0_58px_rgba(252,211,77,.48)]"
          : "z-20"
      } ${
        !isWinner && player.isTurn
          ? "holdem-turn-pulse border-amber-300/80 bg-[#221b08]"
          : !isWinner && isMe
            ? "border-cyan-300/45 bg-[#071a21]/95"
            : !isWinner
              ? "border-white/15 bg-black/80"
              : ""
      } ${folded || player.sittingOut ? "opacity-35 grayscale" : resultDimmed ? "opacity-40" : "opacity-100"}`}
      style={position}
    >
      {isWinner && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-white/65 bg-amber-300 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-amber-950 shadow-xl sm:text-[10px]">
          Winner
        </div>
      )}
      <div className="flex min-h-5 items-center justify-center gap-1 text-[9px] font-black uppercase tracking-[0.08em] sm:text-[10px]">
        {player.isDealer && <span className="rounded-full bg-white px-1.5 py-0.5 text-slate-950">D</span>}
        {player.isSmallBlind && <span className="rounded-full bg-cyan-300/18 px-1.5 py-0.5 text-cyan-100">SB</span>}
        {player.isBigBlind && <span className="rounded-full bg-violet-300/18 px-1.5 py-0.5 text-violet-100">BB</span>}
        {allIn && <span className="rounded-full bg-red-400/18 px-1.5 py-0.5 text-red-100">ALL IN</span>}
        {player.sittingOut && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-white/65">SIT OUT</span>}
        {eliminated && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-white/65">#{player.finishPlace}</span>}
      </div>
      <div className="mt-0.5 truncate text-xs font-black text-white sm:text-sm">{player.name}{isMe ? " · You" : ""}</div>
      <div className="mt-0.5 text-[11px] font-bold text-amber-200 sm:text-xs">{formatChips(player.stack)}</div>
      {player.streetBet > 0 && <div className="mt-1 text-[9px] font-semibold text-white/55 sm:text-[10px]">Bet {formatChips(player.streetBet)}</div>}
      {player.status === "folded" && <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-white/40">Folded</div>}
      {(player.holeCards.length > 0 || showHiddenCards) && (
        <div className="mt-1.5 flex justify-center -space-x-2">
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
  const isResult = winners.length > 0;

  return (
    <div className={`holdem-table-surface relative min-h-[440px] overflow-hidden rounded-[34px] border bg-[#04120e] shadow-[0_28px_80px_rgba(0,0,0,0.42)] sm:min-h-[600px] sm:rounded-[42px] ${isResult ? "border-amber-300/40" : "border-emerald-200/20"}`}>
      <style>{`
        @keyframes holdemDeal { 0% { opacity:0; transform:translate(0,-42px) rotate(-8deg) scale(.72); } 70% { transform:translate(0,4px) rotate(1deg) scale(1.03); } 100% { opacity:1; transform:none; } }
        @keyframes holdemReveal { 0% { opacity:0; transform:translateY(-24px) rotateY(90deg) scale(.82); } 55% { opacity:1; transform:translateY(2px) rotateY(-8deg) scale(1.04); } 100% { transform:none; } }
        @keyframes holdemPulse { 0%,100% { box-shadow:0 0 0 1px rgba(252,211,77,.35),0 14px 32px rgba(0,0,0,.38); } 50% { box-shadow:0 0 0 5px rgba(252,211,77,.14),0 0 34px rgba(252,211,77,.30); } }
        @keyframes holdemWinner { 0% { transform:scale(.92); opacity:.25; } 55% { transform:scale(1.035); opacity:1; } 100% { transform:scale(1); opacity:1; } }
        @keyframes holdemWinningSeat { 0% { transform:translate(-50%,-50%) translateY(12px) scale(.94); opacity:.45; box-shadow:0 0 0 2px rgba(252,211,77,.16),0 0 18px rgba(252,211,77,.16); } 45% { transform:translate(-50%,-50%) translateY(-12px) scale(1.12); opacity:1; box-shadow:0 0 0 6px rgba(252,211,77,.28),0 0 64px rgba(252,211,77,.52); } 100% { transform:translate(-50%,-50%) translateY(-8px) scale(1.08); opacity:1; box-shadow:0 0 0 4px rgba(252,211,77,.24),0 0 54px rgba(252,211,77,.44); } }
        .holdem-card-deal { animation:holdemDeal .46s cubic-bezier(.2,.8,.2,1) both; transform-origin:center; }
        .holdem-board-reveal { animation:holdemReveal .52s cubic-bezier(.2,.75,.2,1) both; transform-origin:center; }
        .holdem-turn-pulse { animation:holdemPulse 1.5s ease-in-out infinite; }
        .holdem-winner-pop { animation:holdemWinner .55s ease-out both; }
        .holdem-winning-seat { animation:holdemWinningSeat .62s cubic-bezier(.2,.85,.2,1) both; }
        .holdem-card-back { background:linear-gradient(135deg,rgba(7,58,79,.98),rgba(8,34,54,.98)),repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(255,255,255,.09) 6px,rgba(255,255,255,.09) 8px); }
        @media (prefers-reduced-motion: reduce) { .holdem-card-deal,.holdem-board-reveal,.holdem-turn-pulse,.holdem-winner-pop,.holdem-winning-seat { animation:none !important; } .holdem-winning-seat { transform:translate(-50%,-50%) translateY(-8px) scale(1.08); } }
      `}</style>

      <div className={`absolute inset-[7%] rounded-[46%] border-[9px] border-[#6e4325] bg-[radial-gradient(ellipse_at_center,#147451_0%,#0c5a40_48%,#073c2d_78%,#052a20_100%)] shadow-[inset_0_0_80px_rgba(0,0,0,.55),0_0_0_2px_rgba(255,255,255,.08)] transition sm:border-[13px] ${isResult ? "brightness-[.65] saturate-[.68]" : ""}`} />
      <div className="pointer-events-none absolute inset-[11%] rounded-[46%] border border-emerald-100/10" />
      {isResult && <div className="pointer-events-none absolute inset-0 z-[4] bg-[radial-gradient(circle_at_center,rgba(0,0,0,.08),rgba(0,0,0,.42)_72%)]" />}

      <div className={`absolute left-1/2 top-1/2 w-[82%] -translate-x-1/2 -translate-y-1/2 text-center sm:w-auto ${isResult ? "z-40" : "z-10"}`}>
        <div className={`text-[9px] font-black uppercase tracking-[0.24em] ${isResult ? "text-amber-300" : "text-emerald-100/48"}`}>{isResult ? `Showdown · Hand ${handNumber}` : `Hand ${handNumber} · ${street}`}</div>
        <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-amber-200/80">Pot {formatChips(pot)}</div>
        <div className={`mt-3 flex origin-center justify-center gap-1.5 sm:gap-2 ${isResult ? "scale-[0.68] opacity-70 sm:scale-[0.82]" : "scale-[0.78] sm:scale-100"}`}>
          {Array.from({ length: 5 }, (_, index) => {
            const card = board[index];
            return card
              ? <PlayingCard key={`${index}-${card}`} card={card} reveal delay={index < 3 ? index * 100 : 0} />
              : <div key={`empty-${index}`} className="h-[86px] w-[58px] rounded-xl border border-dashed border-white/12 bg-black/10 sm:h-[108px] sm:w-[72px]" />;
          })}
        </div>

        {isResult && (
          <div className="holdem-winner-pop relative z-40 mx-auto -mt-1 w-full max-w-lg rounded-[24px] border-2 border-amber-200/80 bg-[linear-gradient(145deg,rgba(35,25,3,.99),rgba(0,0,0,.98))] px-4 py-4 shadow-[0_0_72px_rgba(252,211,77,.42)] sm:mt-2 sm:px-6 sm:py-5">
            <div className="text-[10px] font-black uppercase tracking-[0.34em] text-amber-300 sm:text-xs">{winners.length > 1 ? "Hand winners" : "Hand winner"}</div>
            <div className="mt-2 grid gap-3">
              {winners.map((winner) => (
                <div key={`winner-reveal-${winner.playerId}`}>
                  <div className="text-3xl font-black leading-none text-white sm:text-5xl">{winner.name}</div>
                  {winner.handName === "Uncontested" ? (
                    <div className="mt-2 text-base font-black text-amber-200 sm:text-xl">Wins uncontested</div>
                  ) : (
                    <div className="mt-2 text-sm font-black text-white/70 sm:text-lg">Wins with <span className="text-amber-200">{winner.handName}</span></div>
                  )}
                  <div className="mt-1 text-sm font-black text-emerald-200">+{formatChips(winner.amount)} chips</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {ordered.map((player, index) => (
        <PlayerSeat
          key={player.id}
          player={player}
          position={seatPosition(index, ordered.length)}
          isMe={player.id === viewerId}
          isWinner={winningIds.has(player.id)}
          isResult={isResult}
        />
      ))}
    </div>
  );
}
