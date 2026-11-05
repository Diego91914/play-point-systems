"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recoverClearStackHostRoom } from "@/lib/play-point-core/clear-stack-recovery";
import { QRCodeSVG } from "qrcode.react";
import { ClearStackArcadeBoard } from "./ClearStackArcadeBoard";
import { changeStackPlayers, initialStackState, replayStack, startStack, scoreStack, preserveDraftPlayerNames, type StackState, type StackPlayer } from "@/lib/play-point-core/clear-stack-engine";

type Phase = "setup" | "playing" | "finished";
type Player = StackPlayer;
type HostRoom = { id: string; code: string; spectator_token: string; state_version: number; game_state: StackState; };

const DISTANCES = [10, 15, 20, 25, 30];
const STACKS = [5, 10, 15, 20];
const ROUND_VALUES = [2, 1, 0.5] as const;

export function ClearTheStackClient({ recordsEnabled = false }: { recordsEnabled?: boolean }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [distance, setDistance] = useState(20);
  const [stackSize, setStackSize] = useState(10);
  const [playerCount, setPlayerCount] = useState(1);
  const [hostName, setHostName] = useState("");
  const [manualNames, setManualNames] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(0);
  const [turn, setTurn] = useState(0);
  const [recordStatus, setRecordStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [leaderboardRevision, setLeaderboardRevision] = useState(0);
  const [showJoin, setShowJoin] = useState(false);
  const [room, setRoom] = useState<HostRoom | null>(null);
  const [busy, setBusy] = useState(false);
  const [setupSync, setSetupSync] = useState<"idle" | "saving" | "error">("idle");
  const setupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [joinStatus, setJoinStatus] = useState("");
  const [origin, setOrigin] = useState("");

  const current = players[turn];
  const roundValue = ROUND_VALUES[round] ?? 0;
  const maxScore = stackSize * 2;
  const leaderboard = useMemo(() => [...players].sort((a,b) => b.score-a.score), [players]);
  const leader = leaderboard[0];
  const tied = leaderboard.length > 1 && leaderboard[0].score === leaderboard[1].score;
  const watchUrl = room && origin ? `${origin}/games/clear-the-stack/join/${room.spectator_token}` : "";
  useEffect(() => { setOrigin(window.location.origin); }, []);
  function applyState(state: StackState) {
    setPhase(state.phase);
    setDistance(state.distance);
    setStackSize(state.stackSize);
    setPlayers(state.players);
    setRound(state.round);
    setTurn(state.turn);
    if (state.players.length) {
      setPlayerCount(state.players.length);
      setHostName(state.players[0]?.name ?? "");
      setManualNames(state.players.slice(1).map(p => p.name));
    }
  }

  useEffect(() => {
    let cancelled = false;
    let savedDraft: string | null = null;
    try { savedDraft = window.localStorage.getItem("pps-clear-stack-host-draft"); } catch {}
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (Number.isInteger(draft.playerCount) && draft.playerCount >= 1 && draft.playerCount <= 100) {
          setPlayerCount(draft.playerCount);
          setHostName(typeof draft.hostName === "string" ? draft.hostName : "");
          setManualNames(Array.isArray(draft.manualNames) ? draft.manualNames.filter((name: unknown) => typeof name === "string").slice(0, 99) : []);
        }
        if (Number.isInteger(draft.distance) && draft.distance >= 1 && draft.distance <= 100) setDistance(draft.distance);
        if (Number.isInteger(draft.stackSize) && draft.stackSize >= 1 && draft.stackSize <= 100) setStackSize(draft.stackSize);
      } catch { /* Ignore invalid local draft. */ }
    }
    void (async () => {
      try {
        let storage: Storage | null = null;
        try { storage = window.localStorage; } catch {}
        const result = await recoverClearStackHostRoom(storage, fetch);
        if (cancelled || !result) return;
        setRoom(result as HostRoom);
        applyState(result.game_state);
      } catch (e) {
        if (!cancelled) setJoinStatus(e instanceof Error ? e.message : "Could not restore game.");
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (restoring || phase !== "setup") return;
    try {
      window.localStorage.setItem("pps-clear-stack-host-draft", JSON.stringify({
        distance, stackSize, playerCount, hostName, manualNames,
      }));
    } catch { /* Server state remains authoritative when draft storage is unavailable. */ }
  }, [restoring, phase, distance, stackSize, playerCount, hostName, manualNames]);

  // An existing spectator QR must not freeze setup. Publish changes only after
  // a short idle period so custom numeric input can be edited naturally.
  // Scoring and Start are held while an update is in flight to avoid version races.
  useEffect(() => {
    if (setupTimer.current) {
      clearTimeout(setupTimer.current);
      setupTimer.current = null;
    }
    if (restoring || phase !== "setup" || !room || busy) return;
    if (room.game_state?.distance === distance && room.game_state?.stackSize === stackSize) {
      setSetupSync("idle");
      return;
    }
    setupTimer.current = setTimeout(() => {
      setupTimer.current = null;
      setBusy(true);
      setSetupSync("saving");
      void (async () => {
        try {
          await postRoomAction("configure", { distance, stackSize });
          setJoinStatus("");
          setSetupSync("idle");
        } catch (e) {
          setSetupSync("error");
          setJoinStatus(e instanceof Error ? e.message : "Could not sync spectator settings.");
        } finally {
          setBusy(false);
        }
      })();
    }, 500);
    return () => {
      if (setupTimer.current) {
        clearTimeout(setupTimer.current);
        setupTimer.current = null;
      }
    };
  }, [restoring, phase, room, distance, stackSize, busy]);


  function setCount(nextCount: number) {
    const next = Math.max(1, Math.min(100, nextCount));
    setPlayerCount(next);
    // Keep the full draft roster even if the host temporarily selects fewer
    // players (including Solo). Only the visible inputs and active roster change.
    setManualNames((current) => preserveDraftPlayerNames(current, next));
  }

  async function createOrResumeRoom() {
    const response = await fetch("/api/games/clear-the-stack/room", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ distance, stackSize }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Unable to connect your live spectator session.");
    const hostedRoom = payload.room as HostRoom;
    if (!hostedRoom?.id || !hostedRoom?.spectator_token)
      throw new Error("The live room could not be verified. Please retry.");
    setRoom(hostedRoom);
    try { window.localStorage.setItem("pps-clear-stack-host-room", hostedRoom.id); } catch {}
    return { hostedRoom, reused: payload.reused === true };
  }

  async function postRoomAction(
    action: "configure" | "start" | "makes" | "replay" | "change_players" | "close",
    extra: Record<string, unknown> = {},
    targetRoom: HostRoom | null = room,
  ) {
    if (!targetRoom) throw new Error("No shared game is active.");
    const response = await fetch("/api/games/clear-the-stack/room", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: targetRoom.id, version: targetRoom.state_version, action, ...extra }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not save. Do not score again until reconnected.");
    const updated = payload.room as HostRoom;
    setRoom(updated);
    applyState(updated.game_state);
    return updated.game_state;
  }

  async function start() {
    if (busy || restoring) return;
    if (setupTimer.current) {
      clearTimeout(setupTimer.current);
      setupTimer.current = null;
    }
    const names = playerCount === 1 ? ["You"] : [hostName.trim(), ...manualNames.slice(0, playerCount - 1).map(name => name.trim())];
    try {
      // Validate before creating a room; no silent local-only game with a missing QR.
      startStack(initialStackState(distance, stackSize), names, distance, stackSize);
      setBusy(true);
      setJoinStatus("");
      let hostRoom = room;
      if (!hostRoom) {
        const result = await createOrResumeRoom();
        hostRoom = result.hostedRoom;
        if (result.reused && hostRoom.game_state.phase !== "setup") {
          // Another tab/device is already hosting: resume it, never start a second game.
          applyState(hostRoom.game_state);
          setShowJoin(true);
          setJoinStatus("Resumed your existing live game. Your original spectator QR is still valid.");
          return;
        }
      }
      await postRoomAction("start", { names, distance, stackSize }, hostRoom);
      // QR is now guaranteed by the host room, whether Solo or multiplayer.
      setShowJoin(true);
    } catch (e) {
      setJoinStatus(e instanceof Error ? e.message : "Could not start live game. Retry or sign in.");
    } finally { setBusy(false); }
  }

  async function toggleJoin() {
    if (busy || restoring) return;
    if (showJoin) { setShowJoin(false); return; }
    if (room) { setShowJoin(true); return; }
    setJoinStatus("Creating spectator QR…");
    setBusy(true);
    try {
      const { hostedRoom, reused } = await createOrResumeRoom();
      if (reused) applyState(hostedRoom.game_state);
      setShowJoin(true);
      setJoinStatus(reused ? "Resumed your existing live session. No second session was created." : "");
    } catch (e) {
      setJoinStatus(e instanceof Error ? e.message : "Could not create spectator QR.");
    } finally { setBusy(false); }
  }

  async function recordMakes(makes: number) {
    if (!current || busy) return;
    setBusy(true);
    try {
      let next: StackState;
      if (room) next = await postRoomAction("makes", { makes });
      else {
        next = scoreStack({ phase, distance, stackSize, players, round, turn }, makes);
        applyState(next);
      }
      if (next.phase === "finished") {
        // Records are committed atomically with the completed room update.
        // Never send a second, potentially failing score POST from the browser.
        setRecordStatus("saved");
        setLeaderboardRevision(value => value + 1);
      }
      setJoinStatus("");
    } catch (e) {
      setJoinStatus(e instanceof Error ? e.message : "Could not record makes.");
    } finally { setBusy(false); }
  }

  function currentGameState(): StackState {
    return { phase, distance, stackSize, players, round, turn };
  }

  async function playAgain() {
    if (busy || restoring || phase !== "finished") return;
    setBusy(true);
    try {
      // One host room can contain any number of consecutive games.
      if (room) await postRoomAction("replay");
      else applyState(replayStack(currentGameState()));
      setJoinStatus("");
      setRecordStatus("idle");
    } catch (e) {
      setJoinStatus(e instanceof Error ? e.message : "Could not restart the stack.");
    } finally { setBusy(false); }
  }

  async function changePlayers() {
    if (busy || restoring || phase !== "finished") return;
    setBusy(true);
    try {
      // Preserve the QR while returning to editable setup for a new group.
      // applyState intentionally leaves the host roster inputs intact when
      // state.players is empty, so the host can keep or edit the names.
      if (room) await postRoomAction("change_players");
      else applyState(changeStackPlayers(currentGameState()));
      setJoinStatus("");
      setRecordStatus("idle");
    } catch (e) {
      setJoinStatus(e instanceof Error ? e.message : "Could not open player setup.");
    } finally { setBusy(false); }
  }

  async function endSession() {
    if (busy || restoring) return;
    if (!window.confirm(room
      ? "END GAME: This closes the entire live session and disconnects all spectators. To play again with the same QR, choose Start New Game instead. End this session?"
      : "End this game and return to setup?"
    )) return;
    setBusy(true);
    try {
      if (room) await postRoomAction("close");
      setRoom(null);
      setShowJoin(false);
      try { window.localStorage.removeItem("pps-clear-stack-host-room"); } catch {}
      setPhase("setup");
      setPlayers([]);
      setRound(0);
      setTurn(0);
      setJoinStatus("");
      setRecordStatus("idle");
    } catch (e) {
      setJoinStatus(e instanceof Error ? e.message : "Unable to end the session.");
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-7 text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200/60">Backyard & Putting</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">CLEAR THE STACK</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/58 sm:text-base">Three rounds. Clear every disc. Early makes pay more. Anything left costs you.</p>
      </header>

      {restoring ? <p role="status" className="mb-4 text-center text-sm text-cyan-100">Restoring hosted game…</p> : null}
      {joinStatus && phase !== "setup" ? <p role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-center text-sm text-rose-100">{joinStatus}</p> : null}
      {phase === "setup" ? (
        <section className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 sm:p-7">
          <div className="grid gap-7">
            <Choice label="Putting distance" value={distance} options={DISTANCES} suffix=" FT" disabled={busy || restoring} onChange={setDistance} />
            <Choice label="Number of discs" value={stackSize} options={STACKS} disabled={busy || restoring} onChange={setStackSize} />
            <div>
              <label htmlFor="cts-players" className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Players</label>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[1,2,3,4].map(n => <button key={n} type="button" onClick={() => setCount(n)} className={`min-h-12 rounded-2xl border text-sm font-black ${playerCount === n ? "border-cyan-200/40 bg-cyan-300/15 text-cyan-50" : "border-white/10 bg-black/20 text-white/65"}`}>{n === 1 ? "SOLO" : n}</button>)}
              </div>
              <label className="mt-3 block text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Custom<input id="cts-players" aria-label="Custom player count" type="number" min={1} max={100} value={playerCount} onChange={e => setCount(Number(e.target.value) || 1)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white outline-none focus:border-cyan-200/50" /></label>
              {playerCount > 1 ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-100/55">Player roster</div>
                <label className="mt-3 block text-xs font-bold text-white/60">Host<input value={hostName} onChange={e=>setHostName(e.target.value)} placeholder="Host name" className="mt-2 w-full rounded-xl border border-cyan-200/20 bg-black/25 px-3 py-3 text-base font-bold text-white outline-none focus:border-cyan-200/50"/></label>
                <div className="mt-3 grid gap-2">{manualNames.slice(0, Math.max(0, playerCount - 1)).map((name,i)=><input key={i} value={name} onChange={e=>setManualNames(current=>current.map((value,index)=>index===i?e.target.value:value))} placeholder={`Player ${i+2} name`} className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-bold text-white outline-none focus:border-cyan-200/40"/>)}</div>
              </div> : null}
              <button type="button" onClick={toggleJoin} className="mt-3 min-h-11 w-full rounded-2xl border border-cyan-200/20 bg-cyan-300/[.07] text-xs font-black uppercase tracking-[.14em] text-cyan-50">{showJoin ? "HIDE WATCH QR" : "SCAN TO WATCH"}</button>
              {joinStatus ? <div role="alert" className="mt-2 text-center text-xs font-bold text-rose-100">{joinStatus}</div> : null}
              {room ? <p role="status" className="mt-2 text-center text-xs text-white/55">
                {setupSync === "saving" ? "Updating spectator settings…" : setupSync === "error" ? "Spectator settings did not sync. Try another selection or Start Stack." : "Settings may be changed until Start Stack. Spectators update automatically."}
              </p> : null}
              {showJoin ? <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-center">{watchUrl ? <><div className="mx-auto w-fit rounded-2xl bg-white p-2"><QRCodeSVG value={watchUrl} size={176} level="M" includeMargin={false}/></div><div className="mt-2 text-xs text-white/60">Scan to watch the live game. No name entry or scoring access.</div></> : <div className="text-sm text-white/45">{joinStatus || "Creating QR…"}</div>}</div> : null}
            </div>
          </div>
          <div className="mt-7 grid grid-cols-4 gap-2 text-center text-xs font-black">
            <div className="rounded-xl bg-emerald-300/10 p-3 text-emerald-100">R1<br/>+2</div>
            <div className="rounded-xl bg-cyan-300/10 p-3 text-cyan-100">R2<br/>+1</div>
            <div className="rounded-xl bg-violet-300/10 p-3 text-violet-100">R3<br/>+0.5</div>
            <div className="rounded-xl bg-rose-300/10 p-3 text-rose-100">LEFT<br/>−2</div>
          </div>
          <button type="button" onClick={start} disabled={busy || restoring} className="mt-7 min-h-14 w-full rounded-2xl bg-cyan-300 px-5 text-base font-black text-slate-950">START NEW GAME</button>
          {room ? <button type="button" disabled={busy || restoring} onClick={() => void endSession()} className="mt-3 min-h-12 w-full rounded-xl border border-rose-300/30 bg-rose-200/10 px-4 text-sm font-black uppercase text-rose-100">END GAME · CLOSE SESSION</button> : null}
          <p className="mt-5 text-center text-xs text-white/45">Arcade high scores are shown below. Daily and weekly boards are visible to everyone.</p>
        </section>
      ) : null}

      {phase === "playing" && current ? (
        <section className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><div className="text-xs font-black uppercase tracking-[0.18em] text-white/45">{distance} FT · {stackSize} DISC START</div><div className="mt-1 text-2xl font-black text-white">{current.name}</div></div>
            <div className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-50">ROUND {round + 1} · +{roundValue} EACH</div>
          </div>
          <div className="my-8 text-center">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/45">Discs remaining</div>
            <div className="mt-2 text-8xl font-black tracking-[-0.07em] text-white">{current.remaining}</div>
            <p className="mt-3 text-sm text-white/55">Throw all {current.remaining}. Then tap how many you made.</p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Array.from({length: current.remaining + 1}, (_, n) => <button key={n} type="button" disabled={busy} onClick={() => void recordMakes(n)} className="min-h-14 rounded-2xl border border-white/10 bg-black/25 text-lg font-black text-white transition hover:border-cyan-200/30 hover:bg-cyan-300/10">{n}</button>)}
          </div>
          <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/50">Current score: <span className="font-black text-white">{current.score}</span> · Maximum possible: {maxScore}</div>
        </section>
      ) : null}

      {phase !== "setup" && room ? <section className="mt-4 rounded-2xl border border-white/10 bg-white/[.045] p-4 text-center">
        <button type="button" onClick={() => setShowJoin(value => !value)} className="min-h-11 w-full rounded-xl border border-cyan-200/20 text-xs font-black uppercase text-cyan-100">{showJoin ? "HIDE WATCH QR" : "SHOW SPECTATOR QR"}</button>
        {showJoin && watchUrl ? <div className="mt-4"><div className="mx-auto w-fit rounded-2xl bg-white p-2"><QRCodeSVG value={watchUrl} size={176}/></div><p className="mt-2 text-xs text-white/55">Scan to watch live scores only</p></div> : null}
      </section> : null}

      {phase === "playing" ? <button type="button" disabled={busy || restoring} onClick={() => void endSession()} className="mt-3 min-h-12 w-full rounded-xl border border-rose-300/30 bg-rose-200/10 px-4 text-sm font-black uppercase text-rose-100">END GAME {room ? "· CLOSE SESSION" : "· RETURN TO SETUP"}</button> : null}

      {phase === "finished" ? (
        <section className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 sm:p-7">
          <div className="text-center"><div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100/60">Stack complete</div><div className="mt-3 text-4xl font-black text-white">{players.length === 1 ? `${players[0]?.score ?? 0} POINTS` : tied ? "TIE GAME" : `${leader?.name ?? "Winner"} WINS`}</div><div className="mt-2 text-sm text-white/50">{distance} FT · {stackSize} DISCS</div></div>
          <div className="mt-7 grid gap-3">
            {[...players].sort((a,b) => b.score-a.score).map((p,i) => (
              <div key={p.name} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div><div className="font-black text-white">{players.length > 1 ? `#${i+1} · ` : ""}{p.name}</div><div className="mt-1 text-xs text-white/45">R1 {p.rounds[0] ?? 0} · R2 {p.rounds[1] ?? 0} · R3 {p.rounds[2] ?? 0} · {p.remaining} left</div></div>
                <div className="text-2xl font-black text-white">{p.score}</div>
              </div>
            ))}
          </div>
          {players.length === 1 && recordsEnabled ? <div className="mt-5 rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.06] p-4 text-center text-sm text-white/65">{recordStatus === "saved" ? "Game finished · high score recorded on the host leaderboard" : "Your result is shown above; leaderboards appear below."}</div> : null}
          <button type="button" disabled={busy} onClick={() => void playAgain()} className="mt-7 min-h-14 w-full rounded-2xl bg-cyan-300 px-5 font-black text-slate-950">START NEW GAME · SAME PLAYERS</button>
          <button type="button" disabled={busy} onClick={() => void changePlayers()} className="mt-3 min-h-12 w-full rounded-2xl border border-cyan-200/25 bg-cyan-200/10 px-5 text-sm font-black text-cyan-50">NEW GAME · CHANGE PLAYERS / SETTINGS</button>
          <button type="button" disabled={busy || restoring} onClick={() => void endSession()} className="mt-3 min-h-12 w-full rounded-xl border border-rose-300/30 bg-rose-200/10 px-4 text-sm font-black uppercase text-rose-100">END GAME {room ? "· CLOSE SESSION" : "· RETURN TO SETUP"}</button>
        </section>
      ) : null}
      {(phase === "setup" || phase === "finished") ? <ClearStackArcadeBoard distance={distance} stackSize={stackSize} allowAccountViews={recordsEnabled} refreshKey={leaderboardRevision} /> : null}
    </main>
  );
}

function Choice({ label, value, options, suffix = "", disabled = false, onChange }: { label: string; value: number; options: number[]; suffix?: string; disabled?: boolean; onChange: (n:number) => void }) {
  return <div><div className="text-xs font-black uppercase tracking-[0.18em] text-white/55">{label}</div><div className="mt-3 grid grid-cols-5 gap-2">{options.map(n => <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)} className={`min-h-12 rounded-2xl border text-sm font-black ${value === n ? "border-cyan-200/40 bg-cyan-300/15 text-cyan-50" : "border-white/10 bg-black/20 text-white/65"}`}>{n}{suffix}</button>)}</div><label className="mt-3 block text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Custom<input type="number" min={1} max={100} disabled={disabled} value={value} onChange={e => onChange(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white outline-none focus:border-cyan-200/50" /></label></div>;
}
