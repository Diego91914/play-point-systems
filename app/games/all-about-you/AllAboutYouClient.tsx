"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoomJoinPanel } from "@/app/games/_components/RoomJoinPanel";

type Player = { id: string; name: string; score: number; seat: number };
type Choice = { value: string; label: string };
type Prompt = { id: string; type: "pick" | "finish" | "rank" | "who" | "memory"; text: string; choices: Choice[] };
type MemoryEntry = { id: string; text: string; authorId?: string };
type Recap = { type: string; prompt: string; answer: string };
type Game = {
  code: string;
  status: "lobby" | "guest-answer" | "guessing" | "judge" | "reveal" | "memory-submit" | "memory-pick" | "finished" | "closed";
  hostPlayerId: string;
  guestId: string | null;
  players: Player[];
  round: number;
  guestAnswer: string | string[] | null;
  guesses: Record<string, string | string[]>;
  roundPoints: Record<string, number>;
  judgedPlayerIds: string[];
  memoryEntries: MemoryEntry[];
  memoryFavoriteId: string | null;
  recap: Recap[];
  message: string;
  me: { id: string; isHost: boolean; isGuest: boolean } | null;
  guest: { id: string; name: string } | null;
  currentPrompt: Prompt | null;
  answeredCount: number;
  guesserCount: number;
};
type Session = { code: string; playerId: string; token: string };

const KEY = "pps-all-about-you-session";

export function AllAboutYouClient() {
  const [game, setGame] = useState<Game | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [text, setText] = useState("");
  const [rank, setRank] = useState<string[]>([]);
  const [judged, setJudged] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, { ...init, cache: "no-store", headers: { "content-type": "application/json", ...(init?.headers || {}) } });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Something went wrong.");
    return json;
  }, []);

  useEffect(() => {
    const queryCode = new URLSearchParams(location.search).get("code");
    if (queryCode) setCode(queryCode.toUpperCase());
    try { const raw = localStorage.getItem(KEY); if (raw) setSession(JSON.parse(raw)); } catch {}
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const json = await request(`/api/games/all-about-you/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`);
      setGame(json.state);
    } catch {}
  }, [request, session]);

  useEffect(() => { if (!session) return; void refresh(); const timer = setInterval(refresh, 1000); return () => clearInterval(timer); }, [refresh, session]);
  useEffect(() => { setText(""); setRank([]); setJudged([]); }, [game?.round, game?.status]);

  async function open(intent: "create" | "join" | "rejoin_host") {
    setBusy(true); setError("");
    try {
      const json = await request("/api/games/all-about-you", { method: "POST", body: JSON.stringify({ intent, name, code }) });
      const next = { code: json.code, playerId: json.playerId, token: json.token };
      localStorage.setItem(KEY, JSON.stringify(next)); setSession(next); setGame(json.state);
      history.replaceState(null, "", `/games/all-about-you?code=${json.code}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to join."); }
    finally { setBusy(false); }
  }

  async function act(action: string, payload: Record<string, unknown> = {}) {
    if (!session) return;
    setBusy(true); setError("");
    try {
      const json = await request(`/api/games/all-about-you/${session.code}`, { method: "POST", body: JSON.stringify({ ...session, action, payload }) });
      setGame(json.state);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Try again."); }
    finally { setBusy(false); }
  }

  function leave() { localStorage.removeItem(KEY); setSession(null); setGame(null); setCode(""); history.replaceState(null, "", "/games/all-about-you"); }
  function toggleRank(value: string) { setRank(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]); }
  function toggleJudged(id: string) { setJudged(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }

  const sorted = useMemo(() => [...(game?.players ?? [])].filter(player => player.id !== game?.guestId).sort((a, b) => b.score - a.score || a.seat - b.seat), [game?.players, game?.guestId]);
  const validCode = /^[A-Z2-9]{6}$/.test(code);
  const joinUrl = game && typeof window !== "undefined" ? `${window.location.origin}/games/all-about-you?code=${game.code}` : "";

  if (!game) return <main className="px-5 py-10 sm:px-8"><div className="mx-auto max-w-xl rounded-[32px] border border-fuchsia-300/20 bg-fuchsia-300/[.06] p-7">
    <div className="text-xs font-black uppercase tracking-[.24em] text-fuchsia-200">Play Amplified · Guest of Honor</div>
    <h1 className="mt-3 text-5xl font-black tracking-tight text-white">All About You</h1>
    <p className="mt-4 leading-7 text-white/65">One person is the star of the whole game. Everyone else predicts their answers, ranks their favorites, and shares memories to see who knows them best tonight.</p>
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/60"><b className="text-white">3–10 people · about 15–25 minutes.</b><br/>Perfect for birthdays, retirements, graduations, going-away nights, or any reason to put one person at center stage.</div>
    <input className="mt-6 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-lg text-white" placeholder="Your first name" value={name} onChange={event => setName(event.target.value)} />
    {!validCode && <><button disabled={busy || !name.trim()} onClick={() => open("create")} className="mt-3 w-full rounded-2xl bg-fuchsia-300 px-5 py-4 font-black text-slate-950 disabled:opacity-40">CREATE GAME</button><div className="my-5 text-center text-xs font-black uppercase tracking-widest text-white/35">or join a room</div></>}
    <input className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-center text-xl font-black uppercase tracking-[.3em] text-white" placeholder="ROOM CODE" value={code} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))} />
    <button disabled={busy || !validCode || !name.trim()} onClick={() => open("join")} className="mt-3 w-full rounded-2xl border border-white/15 px-5 py-4 font-black text-white disabled:opacity-40">JOIN GAME</button>
    {validCode && <button disabled={busy} onClick={() => open("rejoin_host")} className="mt-3 w-full rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-50 disabled:opacity-40">REJOIN AS HOST</button>}
    {error && <p className="mt-4 text-sm text-rose-200">{error}</p>}
  </div></main>;

  const prompt = game.currentPrompt;
  const myGuess = session ? game.guesses[session.playerId] : undefined;

  return <main className="px-4 py-7 sm:px-8"><div className="mx-auto max-w-3xl">
    <header className="flex items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[.22em] text-fuchsia-200">All About You</div><div className="mt-1 text-sm text-white/50">Room <b className="text-white">{game.code}</b>{game.guest ? <> · ⭐ <b className="text-white">{game.guest.name}</b></> : null}</div></div><button onClick={leave} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/60">LEAVE</button></header>

    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{game.players.map(player => <div key={player.id} className={`rounded-2xl border p-3 ${player.id === game.guestId ? "border-fuchsia-300/35 bg-fuchsia-300/10" : "border-white/10 bg-white/[.03]"}`}><div className="truncate text-sm font-bold text-white">{player.id === game.guestId ? "⭐ " : ""}{player.name}{player.id === session?.playerId ? " · You" : ""}</div><div className="mt-1 text-2xl font-black text-fuchsia-100">{player.id === game.guestId ? "STAR" : player.score}</div></div>)}</div>

    {game.status === "lobby" && <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.04] p-6"><h2 className="text-2xl font-black text-white">Choose the Guest of Honor</h2><p className="mt-2 text-sm leading-6 text-white/60">The star stays at center stage for all five rounds. Everyone else competes to prove who knows them best.</p><RoomJoinPanel code={game.code} joinUrl={joinUrl} gameName="All About You"/><div className="mt-5 grid grid-cols-2 gap-2">{game.players.map(player => <button key={player.id} disabled={busy || !game.me?.isHost} onClick={() => act("set-guest", { guestId: player.id })} className={`rounded-2xl border px-3 py-3 text-sm font-black ${player.id === game.guestId ? "border-fuchsia-300/50 bg-fuchsia-300/15 text-fuchsia-50" : "border-white/10 bg-black/20 text-white/70"}`}>{player.id === game.guestId ? "⭐ " : ""}{player.name}</button>)}</div>{game.me?.isHost ? <button disabled={busy || game.players.length < 3 || !game.guestId} onClick={() => act("start")} className="mt-5 w-full rounded-2xl bg-fuchsia-300 px-4 py-4 font-black text-slate-950 disabled:opacity-40">START · 5 ROUNDS</button> : <p className="mt-5 text-center text-sm text-white/50">Waiting for the host…</p>}<p className="mt-3 text-center text-xs text-white/35">At least 3 people total.</p></section>}

    {prompt && !["lobby", "finished", "closed"].includes(game.status) && <section className="mt-6 rounded-[28px] border border-fuchsia-300/15 bg-fuchsia-300/[.06] p-6 text-center"><div className="text-xs font-black uppercase tracking-[.22em] text-amber-200">Round {game.round + 1} of 5 · {prompt.type === "pick" ? "Pick Me" : prompt.type === "finish" ? "Finish Me" : prompt.type === "rank" ? "Rank Me" : prompt.type === "who" ? "Who Would I Pick?" : "Memory Match"}</div><h2 className="mt-3 text-2xl font-black leading-tight text-white">{prompt.text.replaceAll("Guest of Honor", game.guest?.name ?? "the Guest of Honor")}</h2><p className="mt-3 text-sm text-white/50">{game.message}</p></section>}

    {game.status === "guest-answer" && prompt && <section className="mt-4 rounded-[28px] border border-white/10 bg-white/[.035] p-6">{game.me?.isGuest ? <AnswerControl prompt={prompt} rank={rank} text={text} busy={busy} onText={setText} onRank={toggleRank} onSubmit={answer => act("guest-answer", { answer })} /> : <Waiting title={`${game.guest?.name} is answering privately…`} body="Your prediction screen will unlock as soon as the real answer is sealed." />}</section>}

    {game.status === "guessing" && prompt && <section className="mt-4 rounded-[28px] border border-white/10 bg-white/[.035] p-6">{game.me?.isGuest ? <Waiting title="Your answer is locked." body={`${game.answeredCount}/${game.guesserCount} predictions are in.`} /> : myGuess !== undefined ? <Waiting title="Prediction locked." body={`${game.answeredCount}/${game.guesserCount} predictions are in. No changing it now.`} /> : <AnswerControl prompt={prompt} rank={rank} text={text} busy={busy} onText={setText} onRank={toggleRank} onSubmit={answer => act("guess", { answer })} />}</section>}

    {game.status === "judge" && <section className="mt-4 rounded-[28px] border border-amber-300/20 bg-amber-300/[.07] p-6">{game.me?.isGuest ? <><div className="text-sm font-black uppercase tracking-widest text-amber-100">You decide what counts</div><p className="mt-2 text-sm text-white/55">Your real answer: <b className="text-white">{String(game.guestAnswer ?? "")}</b>. Tap every prediction that is close enough in meaning.</p><div className="mt-4 space-y-2">{game.players.filter(player => player.id !== game.guestId).map(player => <button key={player.id} onClick={() => toggleJudged(player.id)} className={`w-full rounded-2xl border p-4 text-left ${judged.includes(player.id) ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/10 bg-black/20"}`}><b className="text-white">{player.name}</b><span className="ml-2 text-white/65">{String(game.guesses[player.id] ?? "")}</span>{judged.includes(player.id) && <span className="float-right font-black text-emerald-200">COUNTS</span>}</button>)}</div><button disabled={busy} onClick={() => act("judge-finish", { playerIds: judged })} className="mt-5 w-full rounded-2xl bg-amber-200 px-4 py-4 font-black text-slate-950 disabled:opacity-40">LOCK THE REVEAL</button></> : <Waiting title={`${game.guest?.name} is judging the answers…`} body="For this round, close enough counts if the Guest of Honor says it does." />}</section>}

    {game.status === "memory-submit" && prompt && <section className="mt-4 rounded-[28px] border border-white/10 bg-white/[.035] p-6">{game.me?.isGuest ? <Waiting title="You get to enjoy this one." body="Everyone else is privately sending in a memory. You will read them anonymously." /> : game.memoryEntries.length && game.memoryEntries.some(entry => entry.text === text) ? <Waiting title="Memory locked." body="Waiting for the rest of the table…" /> : <><textarea value={text} onChange={event => setText(event.target.value)} maxLength={140} placeholder="Write the memory in a sentence or two…" className="min-h-32 w-full rounded-2xl border border-white/15 bg-black/25 p-4 text-white"/><button disabled={busy || !text.trim()} onClick={() => act("memory-submit", { text })} className="mt-3 w-full rounded-2xl bg-fuchsia-300 px-4 py-4 font-black text-slate-950 disabled:opacity-40">SEND MEMORY PRIVATELY</button></>}</section>}

    {game.status === "memory-pick" && <section className="mt-4 rounded-[28px] border border-fuchsia-300/20 bg-fuchsia-300/[.06] p-6">{game.me?.isGuest ? <><div className="text-sm font-black uppercase tracking-widest text-fuchsia-100">Anonymous memories</div><p className="mt-2 text-sm text-white/55">Choose the one that hits home tonight. You will see who wrote it only after you pick.</p><div className="mt-4 space-y-2">{game.memoryEntries.map(entry => <button key={entry.id} disabled={busy} onClick={() => act("memory-pick", { entryId: entry.id })} className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left text-white/80">“{entry.text}”</button>)}</div></> : <Waiting title={`${game.guest?.name} is reading the memories…`} body="The names are hidden until a favorite is chosen." />}</section>}

    {game.status === "reveal" && <section className="mt-4 rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 p-6"><div className="text-center text-xs font-black uppercase tracking-[.2em] text-emerald-100">THIS IS {game.guest?.name?.toUpperCase()}</div>{prompt?.type !== "memory" && <div className="mt-3 text-center text-3xl font-black text-white">{Array.isArray(game.guestAnswer) ? game.guestAnswer.join(" → ") : String(game.guestAnswer ?? "")}</div>}<div className="mt-5 space-y-2">{sorted.map(player => <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><span className="font-bold text-white">{player.name}</span><span className="font-black text-emerald-100">+{game.roundPoints[player.id] ?? 0}</span></div>)}</div>{game.me?.isHost ? <button disabled={busy} onClick={() => act("next")} className="mt-5 w-full rounded-2xl bg-white px-4 py-4 font-black text-slate-950">{game.round >= 4 ? "SEE THE FINALE" : "NEXT ROUND"}</button> : <p className="mt-4 text-center text-sm text-white/50">Waiting for the host…</p>}</section>}

    {game.status === "finished" && <section className="mt-6 rounded-[32px] border border-fuchsia-300/25 bg-fuchsia-300/[.08] p-7 text-center"><div className="text-xs font-black uppercase tracking-[.28em] text-fuchsia-100">Tonight was all about</div><h2 className="mt-2 text-5xl font-black text-white">{game.guest?.name}</h2>{sorted[0] && <div className="mt-6 rounded-3xl border border-amber-300/25 bg-amber-300/10 p-5"><div className="text-xs font-black uppercase tracking-widest text-amber-100">Knows {game.guest?.name} best tonight</div><div className="mt-2 text-4xl font-black text-white">{sorted[0].name}</div><div className="mt-1 text-amber-100">{sorted[0].score} points</div></div>}<div className="mt-6 text-left"><div className="text-xs font-black uppercase tracking-widest text-white/45">Apparently {game.guest?.name}…</div><div className="mt-3 space-y-2">{game.recap.map((item, index) => <div key={`${item.prompt}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-xs text-white/40">{item.prompt}</div><div className="mt-1 font-black text-white">{item.answer}</div></div>)}</div></div>{game.me?.isHost && <div className="mt-6 grid grid-cols-2 gap-3"><button onClick={() => act("restart")} className="rounded-2xl bg-white px-4 py-4 font-black text-slate-950">START OVER</button><button onClick={() => act("quit")} className="rounded-2xl border border-white/15 px-4 py-4 font-black text-white">QUIT</button></div>}</section>}

    {game.status === "closed" && <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.04] p-7 text-center"><h2 className="text-3xl font-black text-white">Game ended</h2><p className="mt-2 text-white/50">{game.message}</p><button onClick={leave} className="mt-5 rounded-2xl bg-white px-5 py-3 font-black text-slate-950">BACK TO PLAY AMPLIFIED</button></section>}

    {error && <p className="mt-4 text-center text-sm text-rose-200">{error}</p>}
    {game.me?.isHost && !["lobby", "finished", "closed"].includes(game.status) && <button disabled={busy} onClick={() => { if (window.confirm("End this game for everyone?")) void act("quit"); }} className="mx-auto mt-6 block text-xs font-black uppercase tracking-widest text-white/30 hover:text-white/60">End game</button>}
  </div></main>;
}

function Waiting({ title, body }: { title: string; body: string }) { return <div className="py-8 text-center"><div className="text-xl font-black text-white">{title}</div><p className="mt-2 text-sm text-white/50">{body}</p></div>; }

function AnswerControl({ prompt, rank, text, busy, onText, onRank, onSubmit }: { prompt: Prompt; rank: string[]; text: string; busy: boolean; onText: (value: string) => void; onRank: (value: string) => void; onSubmit: (answer: string | string[]) => void }) {
  if (prompt.type === "finish") return <><input value={text} onChange={event => onText(event.target.value)} maxLength={60} placeholder="Your answer…" className="w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-lg text-white"/><button disabled={busy || !text.trim()} onClick={() => onSubmit(text)} className="mt-3 w-full rounded-2xl bg-fuchsia-300 px-4 py-4 font-black text-slate-950 disabled:opacity-40">LOCK ANSWER</button></>;
  if (prompt.type === "rank") return <><div className="mb-3 text-sm text-white/55">Tap in order from <b className="text-white">#1 most</b> to <b className="text-white">#4 least</b>.</div><div className="grid grid-cols-2 gap-2">{prompt.choices.map(choice => { const index = rank.indexOf(choice.value); return <button key={choice.value} onClick={() => onRank(choice.value)} className={`rounded-2xl border p-4 text-left font-black ${index >= 0 ? "border-fuchsia-300/40 bg-fuchsia-300/10 text-white" : "border-white/10 bg-black/20 text-white/70"}`}>{index >= 0 ? `#${index + 1} · ` : ""}{choice.label}</button>; })}</div><button disabled={busy || rank.length !== prompt.choices.length} onClick={() => onSubmit(rank)} className="mt-3 w-full rounded-2xl bg-fuchsia-300 px-4 py-4 font-black text-slate-950 disabled:opacity-40">LOCK RANKING</button></>;
  return <div className="grid gap-2">{prompt.choices.map(choice => <button key={choice.value} disabled={busy} onClick={() => onSubmit(choice.value)} className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[.06] p-4 text-left font-black text-white hover:bg-fuchsia-300/10 disabled:opacity-40">{choice.label}</button>)}</div>;
}
