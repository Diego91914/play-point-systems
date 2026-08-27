"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Card = string;
type TablePlayer = {
  id: string; name: string; seat: number; stack: number; streetBet: number; contribution: number;
  status: string; acted: boolean; isDealer: boolean; isSmallBlind: boolean; isBigBlind: boolean; isTurn: boolean; holeCards: Card[];
};
type TableView = {
  code: string; status: "lobby" | "playing" | "showdown"; settings: { startingStack: number; smallBlind: number; bigBlind: number; maxPlayers: number };
  handNumber: number; street: string; board: Card[]; currentBet: number; pot: number; message: string; lastAction: string | null;
  winners: Array<{ playerId: string; name: string; amount: number; handName: string; bestFive: Card[] }>;
  players: TablePlayer[];
  me: { id: string; name: string; seat: number; stack: number; status: string; holeCards: Card[]; isHost: boolean; isTurn: boolean; toCall: number; minRaiseTo: number; maxRaiseTo: number; raiseLocked: boolean; bestHand: { name: string; bestFive: Card[] } | null };
};
type Credentials = { code: string; playerId: string; token: string };

const rankLabel: Record<string, string> = { "14": "A", "13": "K", "12": "Q", "11": "J", "10": "10", "9": "9", "8": "8", "7": "7", "6": "6", "5": "5", "4": "4", "3": "3", "2": "2" };
const suitLabel: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };

function cardParts(card: Card) {
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  return { rank: rankLabel[rank] ?? rank, suit: suitLabel[suit] ?? suit, red: suit === "h" || suit === "d" };
}

function PlayingCard({ card, hidden = false, small = false }: { card?: Card; hidden?: boolean; small?: boolean }) {
  if (hidden || !card) return <div className={`${small ? "h-16 w-11" : "h-24 w-16"} rounded-xl border border-cyan-200/30 bg-[repeating-linear-gradient(45deg,#0f3856,#0f3856_7px,#12304a_7px,#12304a_14px)] shadow-lg`} />;
  const { rank, suit, red } = cardParts(card);
  return (
    <div className={`${small ? "h-16 w-11 text-base" : "h-24 w-16 text-xl"} flex flex-col justify-between rounded-xl border border-white/80 bg-white p-2 font-black shadow-xl ${red ? "text-red-600" : "text-slate-950"}`}>
      <span>{rank}</span><span className="self-end text-2xl leading-none">{suit}</span>
    </div>
  );
}

function storageKey(code: string) { return `pps-holdem-${code}`; }
function formatChips(value: number) { return new Intl.NumberFormat().format(value); }

export function HoldemClient() {
  const [table, setTable] = useState<TableView | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [startingStack, setStartingStack] = useState(10000);
  const [smallBlind, setSmallBlind] = useState(50);
  const [bigBlind, setBigBlind] = useState(100);
  const [raiseTo, setRaiseTo] = useState(200);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")?.toUpperCase() ?? "";
    if (code) {
      setRoomCode(code);
      const saved = localStorage.getItem(storageKey(code));
      if (saved) {
        try { setCredentials(JSON.parse(saved)); } catch { localStorage.removeItem(storageKey(code)); }
      }
    }
  }, []);

  useEffect(() => {
    if (!credentials) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/games/holdem/${credentials.code}`, { cache: "no-store", headers: { "x-holdem-player-id": credentials.playerId, "x-holdem-token": credentials.token } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load table.");
        if (!cancelled) { setTable(data.table); setError(""); }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load table."); }
    };
    void load();
    const timer = window.setInterval(load, 900);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [credentials]);

  useEffect(() => {
    if (!table?.me.isTurn) return;
    setRaiseTo(Math.min(table.me.maxRaiseTo, Math.max(table.me.minRaiseTo, table.currentBet + table.settings.bigBlind)));
  }, [table?.me.isTurn, table?.me.minRaiseTo, table?.me.maxRaiseTo, table?.currentBet, table?.settings.bigBlind]);

  const inviteUrl = useMemo(() => table ? `${window.location.origin}/games/holdem?code=${table.code}` : "", [table]);

  async function openTable(intent: "create" | "join") {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/games/holdem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(intent === "create" ? { intent, name, startingStack, smallBlind, bigBlind, maxPlayers: 8 } : { intent, name, code: roomCode }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to open table.");
      const next = { code: data.table.code, playerId: data.playerId, token: data.token };
      localStorage.setItem(storageKey(next.code), JSON.stringify(next));
      setCredentials(next); setTable(data.table); setRoomCode(next.code);
      window.history.replaceState({}, "", `/games/holdem?code=${next.code}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to open table."); }
    finally { setBusy(false); }
  }

  async function act(body: Record<string, unknown>) {
    if (!credentials) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/games/holdem/${credentials.code}`, { method: "POST", headers: { "content-type": "application/json", "x-holdem-player-id": credentials.playerId, "x-holdem-token": credentials.token }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Action failed.");
      setTable(data.table);
    } catch (err) { setError(err instanceof Error ? err.message : "Action failed."); }
    finally { setBusy(false); }
  }

  if (!table) {
    return (
      <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-100">Play Point Games · MVP</div>
            <h1 className="marketing-headline mt-6 lg:text-7xl">Texas Hold&apos;em. Everyone&apos;s phone is their seat.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/74">No cards. No chips. No dealer mistakes. Create a private table, let everyone scan or enter the room code, and play face-to-face with virtual chips.</p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[30px] border border-emerald-300/15 bg-emerald-300/[0.06] p-6">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100/70">Host a table</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={24} className="mt-5 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-emerald-300/60" />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <label className="text-xs text-white/60">Starting stack<input type="number" value={startingStack} onChange={(e) => setStartingStack(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white" /></label>
                <label className="text-xs text-white/60">Small blind<input type="number" value={smallBlind} onChange={(e) => setSmallBlind(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white" /></label>
                <label className="text-xs text-white/60">Big blind<input type="number" value={bigBlind} onChange={(e) => setBigBlind(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white" /></label>
              </div>
              <button disabled={busy} onClick={() => void openTable("create")} className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-3.5 font-black text-emerald-950 disabled:opacity-50">Create private table</button>
            </div>
            <div className="rounded-[30px] border border-cyan-300/15 bg-cyan-300/[0.05] p-6">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/70">Join a table</div>
              <input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))} placeholder="ROOM CODE" maxLength={6} className="mt-5 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-white uppercase outline-none focus:border-cyan-300/60" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={24} className="mt-3 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-cyan-300/60" />
              <button disabled={busy} onClick={() => void openTable("join")} className="mt-5 w-full rounded-2xl bg-cyan-300 px-5 py-3.5 font-black text-slate-950 disabled:opacity-50">Take a seat</button>
            </div>
          </div>
          {error && <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div>}
          <p className="mt-6 text-xs leading-6 text-white/46">Virtual chips only. This MVP does not handle money, deposits, cash-outs, or wagering.</p>
        </div>
      </section>
    );
  }

  const myPlayer = table.players.find((player) => player.id === table.me.id)!;
  return (
    <section className="min-h-[80vh] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
          <div><div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Private Hold&apos;em Table</div><div className="mt-1 text-xl font-black text-white">Room <span className="text-emerald-300">{table.code}</span></div></div>
          <div className="flex gap-5 text-right"><div><div className="text-[10px] uppercase tracking-wider text-white/40">Pot</div><div className="text-xl font-black text-amber-300">{formatChips(table.pot)}</div></div><div><div className="text-[10px] uppercase tracking-wider text-white/40">Blinds</div><div className="text-xl font-black text-white">{formatChips(table.settings.smallBlind)}/{formatChips(table.settings.bigBlind)}</div></div></div>
        </header>

        {table.status === "lobby" ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[32px] border border-emerald-300/15 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),rgba(0,0,0,0.28)_68%)] p-6 sm:p-8">
              <div className="text-center"><div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100/65">Players seated</div><div className="mt-2 text-5xl font-black text-white">{table.players.length}<span className="text-2xl text-white/35">/{table.settings.maxPlayers}</span></div></div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">{table.players.map((player) => <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-4"><div><div className="font-black text-white">{player.name}{player.id === table.me.id ? " · You" : ""}</div><div className="mt-1 text-xs text-white/45">Seat {player.seat + 1}</div></div><div className="font-black text-amber-200">{formatChips(player.stack)}</div></div>)}</div>
              {table.me.isHost ? <button disabled={busy || table.players.length < 2} onClick={() => void act({ type: "start_hand" })} className="mt-8 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-lg font-black text-emerald-950 disabled:opacity-40">Deal the cards</button> : <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center font-semibold text-white/65">Waiting for the host to deal…</div>}
            </div>
            <aside className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 text-center"><div className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Scan to join</div><div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4"><QRCodeSVG value={inviteUrl} size={220} /></div><div className="mt-5 text-3xl font-black tracking-[0.25em] text-white">{table.code}</div><p className="mt-3 text-sm leading-6 text-white/55">Each player scans this code on their own phone. Their hole cards stay private on their screen.</p></aside>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-[36px] border border-emerald-300/15 bg-[radial-gradient(ellipse_at_center,rgba(6,95,70,0.62),rgba(1,32,29,0.92)_58%,rgba(0,0,0,0.94))] p-4 shadow-[inset_0_0_70px_rgba(0,0,0,0.45)] sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{table.players.map((player) => <div key={player.id} className={`rounded-2xl border px-4 py-3 ${player.isTurn ? "border-amber-300 bg-amber-300/12 shadow-[0_0_24px_rgba(252,211,77,0.16)]" : "border-white/10 bg-black/25"}`}><div className="flex items-start justify-between gap-3"><div><div className="font-black text-white">{player.name}{player.id === table.me.id ? " · You" : ""}</div><div className="mt-1 flex flex-wrap gap-1 text-[9px] font-black uppercase tracking-wider text-white/45">{player.isDealer && <span>D</span>}{player.isSmallBlind && <span>SB</span>}{player.isBigBlind && <span>BB</span>}<span>{player.status.replace("_", " ")}</span></div></div><div className="text-right"><div className="font-black text-amber-200">{formatChips(player.stack)}</div>{player.streetBet > 0 && <div className="text-[10px] text-white/45">Bet {formatChips(player.streetBet)}</div>}</div></div>{player.holeCards.length > 0 && player.id !== table.me.id && <div className="mt-3 flex gap-2">{player.holeCards.map((card) => <PlayingCard key={card} card={card} small />)}</div>}</div>)}</div>
              <div className="my-8 text-center"><div className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-100/50">{table.street} · Hand {table.handNumber}</div><div className="mt-4 flex min-h-24 justify-center gap-2 sm:gap-3">{Array.from({ length: 5 }, (_, i) => table.board[i] ? <PlayingCard key={i} card={table.board[i]} /> : <div key={i} className="h-24 w-16 rounded-xl border border-dashed border-white/12 bg-black/10" />)}</div><div className="mt-5 text-sm font-semibold text-white/65">{table.message}</div></div>
            </div>

            <div className={`sticky bottom-3 z-10 mt-5 rounded-[28px] border p-4 shadow-2xl backdrop-blur-xl sm:p-5 ${table.me.isTurn ? "border-amber-300/50 bg-slate-950/95" : "border-white/10 bg-slate-950/90"}`}>
              <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                <div className="flex items-center gap-3"><div className="flex gap-2">{table.me.holeCards.length ? table.me.holeCards.map((card) => <PlayingCard key={card} card={card} />) : <><PlayingCard hidden /><PlayingCard hidden /></>}</div><div><div className="text-xs font-bold uppercase tracking-wider text-white/40">Your hand</div><div className="mt-1 font-black text-white">{table.me.bestHand?.name ?? (table.status === "showdown" ? "Hand complete" : "Waiting for board")}</div><div className="mt-1 text-xs text-amber-200">{formatChips(myPlayer.stack)} chips</div></div></div>
                <div className="text-center"><div className={`text-sm font-black ${table.me.isTurn ? "text-amber-300" : "text-white/50"}`}>{table.me.isTurn ? `YOUR TURN${table.me.toCall ? ` · ${formatChips(table.me.toCall)} TO CALL` : ""}` : table.status === "showdown" ? "SHOWDOWN" : "Waiting for action…"}</div>{error && <div className="mt-2 text-xs text-red-300">{error}</div>}</div>
                {table.status === "showdown" ? (table.me.isHost ? <button disabled={busy} onClick={() => void act({ type: "start_hand" })} className="rounded-2xl bg-emerald-400 px-6 py-3.5 font-black text-emerald-950">Deal next hand</button> : <div className="text-sm text-white/50">Host deals next hand</div>) : table.me.isTurn ? <div className="grid min-w-[310px] grid-cols-3 gap-2"><button disabled={busy} onClick={() => void act({ type: "fold" })} className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-3 font-black text-red-100">Fold</button>{table.me.toCall === 0 ? <button disabled={busy} onClick={() => void act({ type: "check" })} className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 font-black text-cyan-100">Check</button> : <button disabled={busy} onClick={() => void act({ type: "call" })} className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 font-black text-cyan-100">Call {formatChips(Math.min(table.me.toCall, table.me.stack))}</button>}<button disabled={busy} onClick={() => void act({ type: "all_in" })} className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-3 font-black text-amber-100">All-in</button>{!table.me.raiseLocked && table.me.maxRaiseTo > table.currentBet && <><input type="range" min={Math.min(table.me.minRaiseTo, table.me.maxRaiseTo)} max={table.me.maxRaiseTo} step={table.settings.bigBlind} value={Math.min(raiseTo, table.me.maxRaiseTo)} onChange={(e) => setRaiseTo(Number(e.target.value))} className="col-span-2" /><button disabled={busy || raiseTo <= table.currentBet} onClick={() => void act({ type: "raise", raiseTo })} className="rounded-xl bg-emerald-400 px-3 py-3 font-black text-emerald-950">Raise {formatChips(raiseTo)}</button></>}</div> : <div className="text-sm text-white/45">{table.players.find((p) => p.isTurn)?.name ? `${table.players.find((p) => p.isTurn)?.name}'s turn` : "Resolving hand"}</div>}
              </div>
            </div>
            {table.status === "showdown" && table.winners.length > 0 && <div className="mt-5 grid gap-3 sm:grid-cols-2">{table.winners.map((winner) => <div key={winner.playerId} className="rounded-2xl border border-amber-300/20 bg-amber-300/8 p-5"><div className="text-xs font-bold uppercase tracking-wider text-amber-200/65">Winner</div><div className="mt-1 text-2xl font-black text-white">{winner.name}</div><div className="mt-1 text-sm text-amber-200">+{formatChips(winner.amount)} · {winner.handName}</div></div>)}</div>}
          </>
        )}
      </div>
    </section>
  );
}
