"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoomJoinPanel } from "@/app/games/_components/RoomJoinPanel";

type Player = { id: string; name: string; seat: number };
type Question = { id: string; label: string };
type CaseFile = {
  evidence: { index: number; title: string; text: string }[];
  privateClues: { index: number; text: string }[];
  interruptions: { label: string; title: string; text: string }[];
  interviews: { questioner: string; target: string; question: string; answer: string }[];
};
type Game = {
  code: string;
  status: "lobby" | "interrogation" | "evidence" | "accusation" | "reveal";
  players: Player[];
  message: string;
  currentQuestioner: { id: string; name: string } | null;
  pendingQuestion: null | {
    questioner: string;
    target: string;
    questionId: string;
    questionLabel: string;
    isTarget: boolean;
    answerPrompt: { mustReveal: string; mayHide?: string } | null;
  };
  questions: Question[];
  questionCount: number;
  evidenceIndex: number;
  caseFile: CaseFile;
  evidence: null | {
    index: number;
    total: number;
    title: string;
    publicText: string;
    privateText: string | null;
    interruption: null | { label: string; title: string; text: string };
    acknowledged: boolean;
  };
  me: {
    id: string;
    isHost: boolean;
    role: null | {
      title: string;
      publicBio: string;
      memory: string[];
      isMurderer: boolean;
    };
  };
};
type CaseLead = { id: string; title: string; text: string; source: "private-clue" | "personal-discovery" | "suspicious" };
type CaseOption = { id: string; label: string };
type CaseState = {
  status: Game["status"];
  players: { id: string; name: string }[];
  isMurderer: boolean;
  privateLeads: CaseLead[];
  caseReadiness: { canSubmit: boolean; selectableSupportCount: number; fairConvictionPathAvailable: boolean; noteTakingRequired: boolean };
  options: { motives: CaseOption[]; locations: CaseOption[]; windows: CaseOption[] };
  submittedCount: number;
  playerCount: number;
  mySubmission: null | { locked: true; score?: number; convicted?: boolean };
  reveal: null | {
    murderer: { id: string; name: string; role: string };
    winner: null | { playerId: string; name: string; score: number; convicted: boolean; supportCorrect: number };
    murdererWins: boolean;
    standings: { playerId: string; name: string; isMurderer: boolean; score: number; convicted: boolean; supportCorrect: number }[];
    solution: string;
  };
};
type Session = { code: string; playerId: string; token: string };

const KEY = "pps-mystery-session";
const ROUND_LABELS = ["Establish the Timeline", "Something Doesn't Fit", "Break the Alibis", "Last Chance to Build Your Case"];

export function MysteryClient() {
  const [game, setGame] = useState<Game | null>(null);
  const [caseState, setCaseState] = useState<CaseState | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [targetId, setTargetId] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [suspectId, setSuspectId] = useState("");
  const [motiveId, setMotiveId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [windowId, setWindowId] = useState("");
  const [supportIds, setSupportIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [briefingAccepted, setBriefingAccepted] = useState(false);

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Something went wrong.");
    return json;
  }, []);

  useEffect(() => {
    const invited = new URLSearchParams(location.search).get("code");
    if (invited) setCode(invited.toUpperCase());
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  const refreshCase = useCallback(async (activeSession: Session) => {
    const json = await request(`/api/games/mystery/${activeSession.code}/case?playerId=${encodeURIComponent(activeSession.playerId)}&token=${encodeURIComponent(activeSession.token)}`);
    setCaseState(json.state);
  }, [request]);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const targetQuery = targetId ? `&targetId=${encodeURIComponent(targetId)}` : "";
      const json = await request(`/api/games/mystery/${session.code}?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}${targetQuery}`);
      setGame(json.state);
      if (json.state.status === "accusation" || json.state.status === "reveal") await refreshCase(session);
      else setCaseState(null);
    } catch {}
  }, [request, session, targetId, refreshCase]);

  useEffect(() => {
    if (!session) return;
    void refresh();
    const timer = window.setInterval(refresh, 900);
    return () => window.clearInterval(timer);
  }, [refresh, session]);

  async function open(intent: "create" | "join") {
    setBusy(true);
    setError("");
    try {
      const json = await request("/api/games/mystery", { method: "POST", body: JSON.stringify({ intent, name, code }) });
      const nextSession = { code: json.code, playerId: json.playerId, token: json.token };
      localStorage.setItem(KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setGame(json.state);
      setCaseState(null);
      setBriefingAccepted(false);
      history.replaceState(null, "", `/games/mystery?code=${json.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to join.");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: string, payload: Record<string, unknown> = {}) {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const json = await request(`/api/games/mystery/${session.code}`, {
        method: "POST",
        body: JSON.stringify({ ...session, action, payload }),
      });
      setGame(json.state);
      if (action === "ask") {
        setTargetId("");
        setQuestionId("");
      }
      if (action === "start" || action === "restart") {
        setBriefingAccepted(false);
        setCaseState(null);
        setSuspectId("");
        setMotiveId("");
        setLocationId("");
        setWindowId("");
        setSupportIds([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCase() {
    if (!session || !caseState) return;
    setBusy(true);
    setError("");
    try {
      const json = await request(`/api/games/mystery/${session.code}/case`, {
        method: "POST",
        body: JSON.stringify({
          playerId: session.playerId,
          token: session.token,
          payload: { suspectId, motiveId, locationId, windowId, supportIds },
        }),
      });
      setCaseState(json.state);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to lock your case.");
    } finally {
      setBusy(false);
    }
  }

  const toggleSupport = (id: string) => {
    setSupportIds(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 4 ? [...current, id] : current);
  };

  const validCode = /^[A-Z2-9]{6}$/.test(code);
  const joinUrl = game && typeof window !== "undefined" ? `${window.location.origin}/games/mystery?code=${game.code}` : "";
  const otherPlayers = useMemo(() => game?.players.filter(player => player.id !== game.me.id) ?? [], [game]);
  const showBriefing = game?.status !== "lobby" && Boolean(game?.me.role) && !briefingAccepted;
  const roundNumber = game ? Math.min(4, Math.max(1, game.evidenceIndex + 2)) : 1;
  const roundLabel = ROUND_LABELS[roundNumber - 1];
  const readyToLock = Boolean(suspectId && motiveId && locationId && windowId && supportIds.length >= 2 && caseState?.caseReadiness.canSubmit);

  if (!game) {
    return (
      <main className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-xl rounded-[32px] border border-rose-300/20 bg-rose-300/[.05] p-7">
          <div className="text-xs font-black uppercase tracking-[.24em] text-rose-200">Play Amplified · Phone Mystery</div>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-white">Last Call</h1>
          <p className="mt-3 text-lg font-bold text-white/80">Murder at Blackwood House</p>
          <p className="mt-4 leading-7 text-white/60">The phone is the brain and guide. You do the questioning, bluffing, accusing, and solving face-to-face.</p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/55">4–8 players · No required note-taking · One host creates the room · Everyone else joins by code or QR</div>
          <input className="mt-6 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-lg text-white" placeholder="Your first name" value={name} onChange={e => setName(e.target.value)} />
          {!validCode && <button disabled={busy} onClick={() => open("create")} className="mt-3 w-full rounded-2xl bg-rose-200 px-5 py-4 font-black text-slate-950 disabled:opacity-40">CREATE MYSTERY</button>}
          {!validCode && <div className="my-5 text-center text-xs font-black uppercase tracking-widest text-white/35">or join a room</div>}
          <input className={`${validCode ? "mt-3" : ""} w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-center text-xl font-black uppercase tracking-[.3em] text-white`} placeholder="ROOM CODE" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))} />
          <button disabled={busy || !validCode} onClick={() => open("join")} className="mt-3 w-full rounded-2xl border border-white/15 px-5 py-4 font-black text-white disabled:opacity-40">JOIN MYSTERY</button>
          {error && <p className="mt-4 text-sm text-rose-200">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-7 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.2em] text-rose-200">Last Call · Murder at Blackwood House</div>
            <div className="mt-1 text-sm text-white/50">Room <b className="text-white">{game.code}</b></div>
          </div>
          <div className="text-right text-xs font-black uppercase tracking-widest text-white/40">{game.status.replace("-", " ")}</div>
        </header>

        {game.status !== "lobby" && game.status !== "accusation" && game.status !== "reveal" && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">Investigation round {roundNumber} of 4</div>
              <div className="text-xs font-black text-cyan-100">{roundLabel}</div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">{ROUND_LABELS.map((_, index) => <div key={index} className={`h-1.5 rounded-full ${index < roundNumber ? "bg-cyan-200" : "bg-white/10"}`} />)}</div>
          </div>
        )}

        {game.status === "lobby" && (
          <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.035] p-6">
            <h2 className="text-2xl font-black text-white">Get the suspects together</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">This mystery needs at least 4 players and supports up to 8. Four players get a complete solvable story; added players deepen the web of suspects and secrets.</p>
            <RoomJoinPanel code={game.code} joinUrl={joinUrl} gameName="Last Call" />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{game.players.map(player => <div key={player.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center text-sm font-bold text-white">{player.name}</div>)}</div>
            {game.me.isHost ? <button disabled={busy || game.players.length < 4} onClick={() => act("start")} className="mt-5 w-full rounded-2xl bg-rose-200 px-4 py-4 font-black text-slate-950 disabled:opacity-40">{game.players.length < 4 ? `NEED ${4 - game.players.length} MORE PLAYER${4 - game.players.length === 1 ? "" : "S"}` : "BEGIN THE MYSTERY"}</button> : <p className="mt-5 text-center text-sm text-white/50">Waiting for the host to begin…</p>}
          </section>
        )}

        {showBriefing && game.me.role && (
          <section className="mt-6 rounded-[30px] border border-amber-200/25 bg-amber-200/[.06] p-6 sm:p-7">
            <div className="text-xs font-black uppercase tracking-[.22em] text-amber-100">Before the mystery begins</div>
            <h2 className="mt-2 text-3xl font-black text-white">How to play</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">Read this privately. Everyone has secrets — even innocent players. Your phone will tell you what the room is allowed to know.</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><b className="text-white">1. Keep your phone private.</b><p className="mt-1 text-sm leading-6 text-white/60">Do not show anyone your character, memories, private clues, or private instructions.</p></div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[.06] p-4"><b className="text-emerald-100">2. MUST REVEAL means tell it.</b><p className="mt-1 text-sm leading-6 text-white/65">When someone asks you a question, say the information your phone tells you to reveal — in your own words.</p></div>
              <div className="rounded-2xl border border-rose-300/20 bg-rose-300/[.06] p-4"><b className="text-rose-100">3. MAY HIDE means it is your choice.</b><p className="mt-1 text-sm leading-6 text-white/65">You may keep that information secret, dodge around it, or reveal it strategically. Do not invent facts or contradict information you are required to reveal.</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><b className="text-white">4. Talk to the people, not the phones.</b><p className="mt-1 text-sm leading-6 text-white/60">Question, bluff, defend, accuse, and debate face-to-face. The phone is the brain and guide; the people are the game.</p></div>
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-4"><b className="text-cyan-100">5. Follow the evidence.</b><p className="mt-1 text-sm leading-6 text-white/60">New evidence appears as the investigation progresses. Your Case File automatically remembers evidence and spoken interview answers, so no notepad is required.</p></div>
              <div className="rounded-2xl border border-amber-200/15 bg-amber-200/[.04] p-4"><b className="text-amber-100">6. Build your case.</b><p className="mt-1 text-sm leading-6 text-white/60">At the end, you will name a suspect, motive, crime location, murder window, and 2–4 facts from your own Case File that prove your theory.</p></div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-center text-sm font-black leading-6 text-white">Never announce whether your private screen says you are innocent or the murderer. Play your character and protect your secrets.</div>
            <button onClick={() => setBriefingAccepted(true)} className="mt-5 w-full rounded-2xl bg-amber-200 px-4 py-4 font-black text-slate-950">I UNDERSTAND — SHOW MY CHARACTER</button>
          </section>
        )}

        {!showBriefing && game.status !== "lobby" && game.me.role && game.status !== "reveal" && (
          <section className={`mt-5 rounded-[28px] border p-6 ${game.me.role.isMurderer ? "border-rose-300/35 bg-rose-300/[.08]" : "border-amber-200/15 bg-amber-200/[.05]"}`}>
            <div className="text-[10px] font-black uppercase tracking-[.24em] text-white/45">Your character · private</div>
            <h2 className="mt-2 text-2xl font-black text-white">{game.me.role.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">{game.me.role.publicBio}</p>
            {game.me.role.isMurderer && <div className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm font-black text-rose-100">YOU ARE THE MURDERER. Protect your cover story.</div>}
            <details className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <summary className="cursor-pointer text-sm font-black text-white">MY STORY / MEMORY</summary>
              <div className="mt-3 space-y-2">{game.me.role.memory.map((item, index) => <p key={index} className="text-sm leading-6 text-white/65">• {item}</p>)}</div>
            </details>
            <details className="mt-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-4">
              <summary className="cursor-pointer text-sm font-black text-cyan-100">CASE FILE · AUTO-SAVED</summary>
              <div className="mt-4 space-y-5">
                <div><div className="text-[10px] font-black uppercase tracking-widest text-white/40">Evidence</div>{game.caseFile.evidence.length ? game.caseFile.evidence.map(item => <div key={item.index} className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-sm font-black text-white">{item.index}. {item.title}</div><p className="mt-1 text-xs leading-5 text-white/55">{item.text}</p></div>) : <p className="mt-2 text-xs text-white/40">No evidence has dropped yet.</p>}</div>
                {game.caseFile.privateClues.length > 0 && <div><div className="text-[10px] font-black uppercase tracking-widest text-amber-100">Your private clues</div>{game.caseFile.privateClues.map((item, index) => <p key={`${item.index}-${index}`} className="mt-2 text-xs leading-5 text-white/65">• {item.text}</p>)}</div>}
                {game.caseFile.interruptions.length > 0 && <div><div className="text-[10px] font-black uppercase tracking-widest text-rose-100">Developments</div>{game.caseFile.interruptions.map((item, index) => <div key={index} className="mt-2 rounded-xl border border-rose-300/15 bg-rose-300/[.05] p-3"><div className="text-xs font-black uppercase text-rose-100">{item.label} · {item.title}</div><p className="mt-1 text-xs leading-5 text-white/55">{item.text}</p></div>)}</div>}
                <div><div className="text-[10px] font-black uppercase tracking-widest text-white/40">Interview record</div>{game.caseFile.interviews.length ? game.caseFile.interviews.map((item, index) => <div key={index} className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-xs font-black text-white">{item.questioner} → {item.target}</div><div className="mt-1 text-xs text-cyan-100">{item.question}</div><p className="mt-1 text-xs leading-5 text-white/55">{item.answer}</p></div>) : <p className="mt-2 text-xs text-white/40">Spoken answers will be recorded here automatically.</p>}</div>
              </div>
            </details>
          </section>
        )}

        {!showBriefing && game.status === "interrogation" && !game.pendingQuestion && game.currentQuestioner?.id === game.me.id && (
          <section className="mt-5 rounded-[28px] border border-cyan-300/20 bg-cyan-300/[.05] p-6">
            <div className="text-xs font-black uppercase tracking-[.2em] text-cyan-200">Your turn to investigate</div>
            <h3 className="mt-2 text-3xl font-black text-white">Choose a person. Choose a question.</h3>
            <p className="mt-2 text-sm text-white/45">Your phone surfaces up to six questions that matter at this stage. Later rounds reopen timelines, contradictions, routes, and motive pressure.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">{otherPlayers.map(player => <button key={player.id} onClick={() => { setTargetId(player.id); setQuestionId(""); }} className={`rounded-2xl border px-4 py-4 text-left font-black ${targetId === player.id ? "border-cyan-300/50 bg-cyan-300/15 text-white" : "border-white/10 bg-black/20 text-white/70"}`}>{player.name}</button>)}</div>
            {targetId && <div className="mt-5 grid gap-2">{game.questions.map(question => <button key={question.id} onClick={() => setQuestionId(question.id)} className={`rounded-2xl border px-4 py-4 text-left text-sm font-bold ${questionId === question.id ? "border-amber-200/45 bg-amber-200/10 text-white" : "border-white/10 bg-black/20 text-white/70"}`}>{question.label}</button>)}</div>}
            {targetId && game.questions.length === 0 && <p className="mt-4 text-sm text-white/45">Loading the best available questions for this suspect…</p>}
            <button disabled={busy || !targetId || !questionId} onClick={() => act("ask", { targetId, questionId })} className="mt-5 w-full rounded-2xl bg-cyan-200 px-4 py-4 font-black text-slate-950 disabled:opacity-40">ASK THE QUESTION</button>
          </section>
        )}

        {!showBriefing && game.status === "interrogation" && !game.pendingQuestion && game.currentQuestioner?.id !== game.me.id && (
          <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[.035] p-7 text-center">
            <div className="text-xs font-black uppercase tracking-widest text-white/40">Investigator up</div>
            <div className="mt-2 text-3xl font-black text-white">{game.currentQuestioner?.name}</div>
            <p className="mt-2 text-sm text-white/50">Their phone is guiding the next question.</p>
          </section>
        )}

        {!showBriefing && game.status === "interrogation" && game.pendingQuestion && (
          <section className={`mt-5 rounded-[28px] border p-6 ${game.pendingQuestion.isTarget ? "border-amber-200/30 bg-amber-200/[.07]" : "border-white/10 bg-white/[.035]"}`}>
            <div className="text-xs font-black uppercase tracking-[.2em] text-white/45">{game.pendingQuestion.questioner} asks {game.pendingQuestion.target}</div>
            <h3 className="mt-3 text-2xl font-black text-white">“{game.pendingQuestion.questionLabel}”</h3>
            {game.pendingQuestion.isTarget && game.pendingQuestion.answerPrompt ? <>
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Say this information out loud, in your own words</div>
                <p className="mt-2 text-lg font-bold leading-7 text-white">{game.pendingQuestion.answerPrompt.mustReveal}</p>
              </div>
              {game.pendingQuestion.answerPrompt.mayHide && <div className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-300/[.07] p-4"><div className="text-[10px] font-black uppercase tracking-widest text-rose-200">You may keep this private</div><p className="mt-2 text-sm leading-6 text-white/65">{game.pendingQuestion.answerPrompt.mayHide}</p></div>}
              <button disabled={busy} onClick={() => act("answered")} className="mt-5 w-full rounded-2xl bg-amber-200 px-4 py-4 font-black text-slate-950 disabled:opacity-40">I ANSWERED OUT LOUD</button>
            </> : <p className="mt-4 text-sm leading-6 text-white/55">{game.pendingQuestion.target}'s phone is prompting the information they know. Listen to their answer.</p>}
          </section>
        )}

        {!showBriefing && game.status === "evidence" && game.evidence && (
          <section className="mt-5 rounded-[28px] border border-rose-300/25 bg-rose-300/[.07] p-6">
            <div className="text-xs font-black uppercase tracking-[.22em] text-rose-200">🚨 New evidence · {game.evidence.index}/{game.evidence.total}</div>
            <h3 className="mt-3 text-3xl font-black text-white">{game.evidence.title}</h3>
            <p className="mt-3 text-base leading-7 text-white/75">{game.evidence.publicText}</p>
            {game.evidence.interruption && <div className="mt-4 rounded-2xl border border-rose-200/25 bg-black/25 p-4"><div className="text-[10px] font-black uppercase tracking-widest text-rose-100">{game.evidence.interruption.label}</div><div className="mt-1 text-lg font-black text-white">{game.evidence.interruption.title}</div><p className="mt-2 text-sm leading-6 text-white/65">{game.evidence.interruption.text}</p></div>}
            {game.evidence.privateText && <div className="mt-4 rounded-2xl border border-amber-200/25 bg-amber-200/[.08] p-4"><div className="text-[10px] font-black uppercase tracking-widest text-amber-100">Only your phone shows this</div><p className="mt-2 text-sm leading-6 text-white/70">{game.evidence.privateText}</p></div>}
            <button disabled={busy || game.evidence.acknowledged} onClick={() => act("ack-evidence")} className="mt-5 w-full rounded-2xl bg-rose-200 px-4 py-4 font-black text-slate-950 disabled:opacity-40">{game.evidence.acknowledged ? "WAITING FOR EVERYONE…" : "I'VE SEEN THE EVIDENCE"}</button>
          </section>
        )}

        {!showBriefing && game.status === "accusation" && caseState && (
          <section className="mt-5 rounded-[30px] border border-amber-200/30 bg-[linear-gradient(145deg,rgba(251,191,36,.09),rgba(255,255,255,.025))] p-6 sm:p-7">
            <div className="text-xs font-black uppercase tracking-[.24em] text-amber-100">Finale · Build Your Case</div>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-white">Don't just name the killer. Prove it.</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">Your theory is private until everyone locks in. A correct suspect alone is not enough for a conviction.</p>

            {caseState.isMurderer && <div className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-300/[.08] p-4 text-sm leading-6 text-rose-100"><b>Protect the cover.</b> Build the most believable alternate case you can from facts your phone actually gives you.</div>}

            {caseState.mySubmission ? (
              <div className="mt-6 rounded-[24px] border border-emerald-300/25 bg-emerald-300/[.07] p-6 text-center">
                <div className="text-xs font-black uppercase tracking-[.2em] text-emerald-100">Case locked</div>
                <div className="mt-2 text-3xl font-black text-white">No changing your story now.</div>
                <p className="mt-3 text-sm text-white/55">{caseState.submittedCount} of {caseState.playerCount} players have locked their cases.</p>
              </div>
            ) : <>
              <div className="mt-6">
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">1 · Who killed Adrian?</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">{caseState.players.map(player => <button key={player.id} onClick={() => setSuspectId(player.id)} className={`rounded-2xl border px-4 py-4 text-left font-black ${suspectId === player.id ? "border-rose-300/50 bg-rose-300/12 text-white" : "border-white/10 bg-black/20 text-white/65"}`}>{player.name}</button>)}</div>
              </div>

              <div className="mt-6">
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">2 · Why?</div>
                <div className="mt-2 grid gap-2">{caseState.options.motives.map(option => <button key={option.id} onClick={() => setMotiveId(option.id)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold ${motiveId === option.id ? "border-amber-200/45 bg-amber-200/10 text-white" : "border-white/10 bg-black/20 text-white/65"}`}>{option.label}</button>)}</div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">3 · Where?</div><div className="mt-2 grid gap-2">{caseState.options.locations.map(option => <button key={option.id} onClick={() => setLocationId(option.id)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold ${locationId === option.id ? "border-cyan-200/45 bg-cyan-200/10 text-white" : "border-white/10 bg-black/20 text-white/65"}`}>{option.label}</button>)}</div></div>
                <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">4 · When?</div><div className="mt-2 grid gap-2">{caseState.options.windows.map(option => <button key={option.id} onClick={() => setWindowId(option.id)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold ${windowId === option.id ? "border-cyan-200/45 bg-cyan-200/10 text-white" : "border-white/10 bg-black/20 text-white/65"}`}>{option.label}</button>)}</div></div>
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">5 · What proves it?</div><div className="mt-1 text-sm font-black text-white">Choose 2–4 connections from your private Case File.</div></div><div className="text-xs font-black text-amber-100">{supportIds.length}/4</div></div>
                <div className="mt-3 grid gap-2">{caseState.privateLeads.map(lead => <button key={lead.id} onClick={() => toggleSupport(lead.id)} className={`rounded-2xl border p-4 text-left ${supportIds.includes(lead.id) ? "border-amber-200/45 bg-amber-200/10" : "border-white/10 bg-black/20"}`}><div className="flex items-center justify-between gap-3"><div className="text-sm font-black text-white">{lead.title}</div><div className="text-[9px] font-black uppercase tracking-widest text-white/35">{lead.source === "personal-discovery" ? "Connection made" : lead.source === "private-clue" ? "Private clue" : "Suspicious"}</div></div><p className="mt-1 text-xs leading-5 text-white/55">{lead.text}</p></button>)}</div>
                {!caseState.privateLeads.length && <p className="mt-3 text-sm text-white/45">Your Case File is resolving the final connections. Keep this screen open.</p>}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-5 text-white/45">Conviction standard: the correct suspect, a strong overall theory, and at least two supporting links that actually fit the case.</div>
              <button disabled={busy || !readyToLock} onClick={submitCase} className="mt-4 w-full rounded-2xl bg-amber-200 px-4 py-4 font-black text-slate-950 disabled:opacity-40">LOCK MY CASE</button>
            </>}
          </section>
        )}

        {!showBriefing && game.status === "reveal" && caseState?.reveal && (
          <section className="mt-5 overflow-hidden rounded-[32px] border border-rose-300/30 bg-[radial-gradient(circle_at_top,rgba(251,113,133,.16),transparent_38%),rgba(255,255,255,.025)] p-6 sm:p-8">
            <div className="text-center">
              <div className="text-xs font-black uppercase tracking-[.3em] text-rose-200">The truth</div>
              <div className="mt-4 text-5xl font-black tracking-tight text-white sm:text-6xl">{caseState.reveal.murderer.name}</div>
              <div className="mt-2 text-xl font-black text-rose-100">{caseState.reveal.murderer.role}</div>
              <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-white/10 bg-black/25 p-5 text-left text-sm leading-7 text-white/70">{caseState.reveal.solution}</div>
            </div>

            <div className={`mt-7 rounded-[24px] border p-5 text-center ${caseState.reveal.murdererWins ? "border-rose-300/25 bg-rose-300/[.08]" : "border-emerald-300/25 bg-emerald-300/[.07]"}`}>
              {caseState.reveal.murdererWins ? <><div className="text-xs font-black uppercase tracking-widest text-rose-100">The murderer got away with it</div><div className="mt-2 text-3xl font-black text-white">Nobody built a complete conviction.</div></> : <><div className="text-xs font-black uppercase tracking-widest text-emerald-100">Case solved</div><div className="mt-2 text-3xl font-black text-white">{caseState.reveal.winner?.name} built the strongest case.</div><div className="mt-1 text-sm text-white/55">Conviction score: {caseState.reveal.winner?.score}/12</div></>}
            </div>

            <div className="mt-7">
              <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">How everyone did</div>
              <div className="mt-3 space-y-2">{caseState.reveal.standings.map((row, index) => <div key={row.playerId} className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${row.isMurderer ? "border-rose-300/20 bg-rose-300/[.06]" : "border-white/10 bg-black/20"}`}><div><div className="text-sm font-black text-white">{row.isMurderer ? "☠ " : `${index + 1}. `}{row.name}</div><div className="mt-1 text-xs text-white/45">{row.isMurderer ? "The murderer" : row.convicted ? "Valid conviction" : "Case did not clear conviction"}</div></div>{!row.isMurderer && <div className="text-right"><div className="text-xl font-black text-white">{row.score}/12</div><div className="text-[10px] text-white/40">{row.supportCorrect} support links</div></div>}</div>)}</div>
            </div>

            {caseState.mySubmission && !caseState.isMurderer && <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] p-4 text-center"><div className="text-[10px] font-black uppercase tracking-widest text-cyan-100">Your case</div><div className="mt-1 text-2xl font-black text-white">{caseState.mySubmission.score}/12</div><div className="mt-1 text-xs text-white/50">{caseState.mySubmission.convicted ? "You reached the conviction standard." : "You had pieces of it, but not enough for conviction."}</div></div>}
            {caseState.isMurderer && <div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-300/[.06] p-4 text-center text-sm font-black text-rose-100">{caseState.reveal.murdererWins ? "YOU GOT AWAY WITH IT." : `THE CASE BROKE YOUR COVER. ${caseState.reveal.winner?.name ?? "The room"} put the pieces together.`}</div>}

            {game.me.isHost && <button disabled={busy} onClick={() => act("restart")} className="mt-7 w-full rounded-2xl border border-white/15 bg-white/[.06] px-4 py-4 font-black text-white disabled:opacity-40">PLAY AGAIN</button>}
          </section>
        )}

        {error && <p className="mt-4 text-center text-sm text-rose-200">{error}</p>}
      </div>
    </main>
  );
}
