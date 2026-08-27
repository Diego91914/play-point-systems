"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  HoldemTableSurface,
  PlayingCard,
  formatChips,
  type SurfacePlayer,
  type SurfaceWinner,
} from "./HoldemTableSurface";

type Card = string;
type TablePlayer = SurfacePlayer & { acted: boolean };
type TableView = {
  code: string;
  status: "lobby" | "playing" | "showdown";
  settings: { startingStack: number; smallBlind: number; bigBlind: number; maxPlayers: number };
  handNumber: number;
  street: string;
  board: Card[];
  currentBet: number;
  pot: number;
  message: string;
  lastAction: string | null;
  winners: SurfaceWinner[];
  players: TablePlayer[];
  me: {
    id: string;
    name: string;
    seat: number;
    stack: number;
    status: string;
    holeCards: Card[];
    isHost: boolean;
    isTurn: boolean;
    toCall: number;
    minRaiseTo: number;
    maxRaiseTo: number;
    raiseLocked: boolean;
    bestHand: { name: string; bestFive: Card[] } | null;
  };
};
type Credentials = { code: string; playerId: string; token: string };

function storageKey(code: string) {
  return `pps-holdem-${code}`;
}

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
  const [origin, setOrigin] = useState("");
  const wasMyTurn = useRef(false);
  const actionPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    const code = new URLSearchParams(window.location.search).get("code")?.toUpperCase() ?? "";
    if (code) {
      setRoomCode(code);
      const saved = localStorage.getItem(storageKey(code));
      if (saved) {
        try {
          setCredentials(JSON.parse(saved));
        } catch {
          localStorage.removeItem(storageKey(code));
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!credentials) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/games/holdem/${credentials.code}`, {
          cache: "no-store",
          headers: {
            "x-holdem-player-id": credentials.playerId,
            "x-holdem-token": credentials.token,
          },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load table.");
        if (!cancelled) {
          setTable(data.table);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load table.");
      }
    };
    void load();
    const timer = window.setInterval(load, 800);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [credentials]);

  useEffect(() => {
    const isTurn = Boolean(table?.me.isTurn);
    if (isTurn && !wasMyTurn.current) {
      navigator.vibrate?.(45);
      window.setTimeout(() => actionPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
    }
    wasMyTurn.current = isTurn;
  }, [table?.me.isTurn]);

  useEffect(() => {
    if (!table?.me.isTurn) return;
    const minimum = Math.min(table.me.maxRaiseTo, table.me.minRaiseTo);
    const suggested = Math.max(minimum, table.currentBet + table.settings.bigBlind);
    setRaiseTo(Math.min(table.me.maxRaiseTo, suggested));
  }, [table?.me.isTurn, table?.me.minRaiseTo, table?.me.maxRaiseTo, table?.currentBet, table?.settings.bigBlind]);

  const inviteUrl = useMemo(() => table && origin ? `${origin}/games/holdem?code=${table.code}` : "", [origin, table]);
  const publicTableUrl = useMemo(() => table && origin ? `${origin}/games/holdem/table?code=${table.code}` : "", [origin, table]);

  async function openTable(intent: "create" | "join") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/games/holdem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          intent === "create"
            ? { intent, name, startingStack, smallBlind, bigBlind, maxPlayers: 8 }
            : { intent, name, code: roomCode }
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to open table.");
      const next = { code: data.table.code, playerId: data.playerId, token: data.token };
      localStorage.setItem(storageKey(next.code), JSON.stringify(next));
      setCredentials(next);
      setTable(data.table);
      setRoomCode(next.code);
      window.history.replaceState({}, "", `/games/holdem?code=${next.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open table.");
    } finally {
      setBusy(false);
    }
  }

  async function act(body: Record<string, unknown>) {
    if (!credentials) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/games/holdem/${credentials.code}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-holdem-player-id": credentials.playerId,
          "x-holdem-token": credentials.token,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Action failed.");
      setTable(data.table);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  function quickRaise(fraction: number) {
    if (!table) return;
    const potAfterCall = table.pot + table.me.toCall;
    const rawTarget = table.currentBet === 0
      ? Math.max(table.settings.bigBlind, Math.floor(table.pot * fraction))
      : table.currentBet + Math.max(table.settings.bigBlind, Math.floor(potAfterCall * fraction));
    const target = Math.min(table.me.maxRaiseTo, Math.max(table.me.minRaiseTo, rawTarget));
    setRaiseTo(target);
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
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={24} className="mt-5 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-emerald-300/60" />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <label className="text-xs text-white/60">Starting stack<input type="number" value={startingStack} onChange={(event) => setStartingStack(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white" /></label>
                <label className="text-xs text-white/60">Small blind<input type="number" value={smallBlind} onChange={(event) => setSmallBlind(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white" /></label>
                <label className="text-xs text-white/60">Big blind<input type="number" value={bigBlind} onChange={(event) => setBigBlind(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white" /></label>
              </div>
              <button disabled={busy} onClick={() => void openTable("create")} className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-3.5 font-black text-emerald-950 transition hover:brightness-105 disabled:opacity-50">Create private table</button>
            </div>

            <div className="rounded-[30px] border border-cyan-300/15 bg-cyan-300/[0.05] p-6">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/70">Join a table</div>
              <input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))} placeholder="ROOM CODE" maxLength={6} className="mt-5 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-white uppercase outline-none focus:border-cyan-300/60" />
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={24} className="mt-3 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-cyan-300/60" />
              <button disabled={busy} onClick={() => void openTable("join")} className="mt-5 w-full rounded-2xl bg-cyan-300 px-5 py-3.5 font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50">Take a seat</button>
            </div>
          </div>

          {error && <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div>}
          <p className="mt-6 text-xs leading-6 text-white/46">Virtual chips only. This MVP does not handle money, deposits, cash-outs, or wagering.</p>
        </div>
      </section>
    );
  }

  const myPlayer = table.players.find((player) => player.id === table.me.id);
  const activePlayer = table.players.find((player) => player.isTurn);
  const canRegularRaise = table.me.isTurn && !table.me.raiseLocked && table.me.maxRaiseTo >= table.me.minRaiseTo && table.me.maxRaiseTo > table.currentBet;
  const actionVerb = table.currentBet === 0 ? "Bet" : "Raise to";

  return (
    <section className="min-h-[82vh] px-3 py-4 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/30 px-5 py-4 shadow-xl backdrop-blur-xl">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Private Hold&apos;em Table</div>
            <div className="mt-1 text-xl font-black text-white">Room <span className="text-emerald-300">{table.code}</span></div>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="text-right"><div className="text-[10px] uppercase tracking-wider text-white/40">Pot</div><div className="text-xl font-black text-amber-300">{formatChips(table.pot)}</div></div>
            <div className="text-right"><div className="text-[10px] uppercase tracking-wider text-white/40">Blinds</div><div className="text-lg font-black text-white">{formatChips(table.settings.smallBlind)}/{formatChips(table.settings.bigBlind)}</div></div>
            <a href={publicTableUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-cyan-300/20 bg-cyan-300/8 px-3 py-2 text-xs font-black text-cyan-50 transition hover:bg-cyan-300/14">Open Table View</a>
          </div>
        </header>

        {table.status === "lobby" ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[32px] border border-emerald-300/15 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),rgba(0,0,0,0.28)_68%)] p-6 sm:p-8">
              <div className="text-center"><div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100/65">Players seated</div><div className="mt-2 text-5xl font-black text-white">{table.players.length}<span className="text-2xl text-white/35">/{table.settings.maxPlayers}</span></div></div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {table.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                    <div><div className="font-black text-white">{player.name}{player.id === table.me.id ? " · You" : ""}</div><div className="mt-1 text-xs text-white/45">Seat {player.seat + 1}</div></div>
                    <div className="font-black text-amber-200">{formatChips(player.stack)}</div>
                  </div>
                ))}
              </div>
              {table.me.isHost
                ? <button disabled={busy || table.players.length < 2} onClick={() => void act({ type: "start_hand" })} className="mt-8 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-lg font-black text-emerald-950 transition hover:brightness-105 disabled:opacity-40">Deal the cards</button>
                : <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center font-semibold text-white/65">Waiting for the host to deal…</div>}
            </div>

            <aside className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 text-center">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Scan to join</div>
              {inviteUrl && <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4"><QRCodeSVG value={inviteUrl} size={220} /></div>}
              <div className="mt-5 text-3xl font-black tracking-[0.25em] text-white">{table.code}</div>
              <p className="mt-3 text-sm leading-6 text-white/55">Each player scans this code on their own phone. Their hole cards stay private on their screen.</p>
              <a href={publicTableUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-xl border border-emerald-300/20 bg-emerald-300/8 px-4 py-2.5 text-xs font-black text-emerald-50 transition hover:bg-emerald-300/14">Put table on TV / iPad</a>
            </aside>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <HoldemTableSurface players={table.players} board={table.board} pot={table.pot} street={table.street} handNumber={table.handNumber} winners={table.winners} viewerId={table.me.id} />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
              <div className="rounded-[30px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(8,38,48,.82),rgba(0,0,0,.42))] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/48">Your hand</div><div className="mt-1 text-xl font-black text-white">{table.me.name}</div></div>
                  <div className="text-right"><div className="text-[10px] uppercase tracking-wider text-white/35">Stack</div><div className="text-xl font-black text-amber-200">{formatChips(table.me.stack)}</div></div>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  {table.me.holeCards.length === 2
                    ? table.me.holeCards.map((card, index) => <PlayingCard key={card} card={card} delay={index * 150} />)
                    : <><PlayingCard hidden /><PlayingCard hidden /></>}
                  <div className="min-w-0 flex-1 pl-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Best hand now</div>
                    <div className="mt-1 text-lg font-black text-white">{table.me.bestHand?.name ?? (table.board.length < 3 ? "Waiting for the flop" : "High card")}</div>
                    {table.me.bestHand && <div className="mt-2 flex -space-x-2">{table.me.bestHand.bestFive.map((card) => <PlayingCard key={`best-${card}`} card={card} small />)}</div>}
                  </div>
                </div>
              </div>

              <div ref={actionPanelRef} className={`rounded-[30px] border p-5 sm:p-6 ${table.me.isTurn ? "border-amber-300/45 bg-amber-300/[0.07] shadow-[0_0_40px_rgba(252,211,77,.08)]" : "border-white/10 bg-white/[0.025]"}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Action</div>
                    <div className="mt-1 text-xl font-black text-white">
                      {table.status === "showdown"
                        ? "Hand complete"
                        : table.me.isTurn
                          ? table.me.toCall > 0 ? `Your turn · ${formatChips(table.me.toCall)} to call` : "Your turn · You can check"
                          : table.me.status === "folded" ? "You folded" : table.me.status === "all_in" ? "You are all-in" : `Waiting on ${activePlayer?.name ?? "the table"}`}
                    </div>
                  </div>
                  {table.currentBet > 0 && <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right"><div className="text-[9px] uppercase tracking-wider text-white/35">Current bet</div><div className="font-black text-white">{formatChips(table.currentBet)}</div></div>}
                </div>

                {table.status === "playing" && table.me.isTurn && (
                  <>
                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <button disabled={busy} onClick={() => void act({ type: "fold" })} className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 font-black text-red-100 transition hover:bg-red-400/16 disabled:opacity-40">Fold</button>
                      {table.me.toCall === 0
                        ? <button disabled={busy} onClick={() => void act({ type: "check" })} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 font-black text-cyan-50 transition hover:bg-cyan-300/16 disabled:opacity-40">Check</button>
                        : <button disabled={busy} onClick={() => void act({ type: "call" })} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 font-black text-cyan-50 transition hover:bg-cyan-300/16 disabled:opacity-40">Call {formatChips(Math.min(table.me.toCall, table.me.stack))}</button>}
                      <button disabled={busy || !canRegularRaise} onClick={() => void act({ type: "raise", raiseTo })} className="rounded-2xl border border-emerald-300/25 bg-emerald-300/12 px-4 py-3 font-black text-emerald-50 transition hover:bg-emerald-300/18 disabled:opacity-35">{actionVerb} {formatChips(raiseTo)}</button>
                      <button disabled={busy || table.me.stack <= 0} onClick={() => void act({ type: "all_in" })} className="rounded-2xl border border-violet-300/25 bg-violet-300/12 px-4 py-3 font-black text-violet-50 transition hover:bg-violet-300/18 disabled:opacity-35">All-in {formatChips(table.me.stack)}</button>
                    </div>

                    {canRegularRaise && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => quickRaise(0.5)} className="rounded-xl bg-white/7 px-3 py-2 text-xs font-black text-white/75 transition hover:bg-white/12">½ Pot</button>
                          <button onClick={() => quickRaise(0.67)} className="rounded-xl bg-white/7 px-3 py-2 text-xs font-black text-white/75 transition hover:bg-white/12">⅔ Pot</button>
                          <button onClick={() => quickRaise(1)} className="rounded-xl bg-white/7 px-3 py-2 text-xs font-black text-white/75 transition hover:bg-white/12">Pot</button>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <input
                            aria-label="Raise amount"
                            type="range"
                            min={table.me.minRaiseTo}
                            max={table.me.maxRaiseTo}
                            step={Math.max(1, table.settings.smallBlind)}
                            value={Math.min(table.me.maxRaiseTo, Math.max(table.me.minRaiseTo, raiseTo))}
                            onChange={(event) => setRaiseTo(Number(event.target.value))}
                            className="min-w-0 flex-1 accent-emerald-300"
                          />
                          <input
                            aria-label="Raise to"
                            type="number"
                            min={table.me.minRaiseTo}
                            max={table.me.maxRaiseTo}
                            value={raiseTo}
                            onChange={(event) => setRaiseTo(Math.min(table.me.maxRaiseTo, Math.max(table.me.minRaiseTo, Number(event.target.value))))}
                            className="w-28 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-right font-black text-white outline-none focus:border-emerald-300/50"
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] font-semibold text-white/35"><span>Minimum {formatChips(table.me.minRaiseTo)}</span><span>Maximum {formatChips(table.me.maxRaiseTo)}</span></div>
                      </div>
                    )}

                    {table.me.raiseLocked && <div className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/8 px-4 py-2.5 text-xs text-amber-100/80">A short all-in did not reopen raising. You can still fold, call/check, or go all-in if applicable.</div>}
                  </>
                )}

                {table.status === "showdown" && (
                  <div className="mt-5">
                    {table.me.isHost
                      ? <button disabled={busy} onClick={() => void act({ type: "start_hand" })} className="w-full rounded-2xl bg-emerald-400 px-5 py-4 text-lg font-black text-emerald-950 transition hover:brightness-105 disabled:opacity-40">Deal next hand</button>
                      : <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center font-semibold text-white/65">Waiting for the host to deal the next hand…</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Latest action</div>
                <div className="mt-1 text-sm font-semibold text-white/78">{table.lastAction ?? table.message}</div>
              </div>
              {table.status === "showdown" && table.winners.length > 0 && (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/8 px-5 py-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/45">Hand result</div>
                  <div className="mt-1 text-sm font-black text-amber-100">{table.winners.map((winner) => `${winner.name} +${formatChips(winner.amount)} · ${winner.handName}`).join(" · ")}</div>
                </div>
              )}
            </div>
          </>
        )}

        {error && <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div>}
        {myPlayer?.status === "out" && <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">You are out of chips for the current table.</div>}
      </div>
    </section>
  );
}
