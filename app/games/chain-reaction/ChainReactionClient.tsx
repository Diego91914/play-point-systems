"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { RoomJoinPanel } from "@/app/games/_components/RoomJoinPanel";

type Player = { id: string; name: string; score: number; seat: number };
type Link = { id: string; word: string; playerId: string | null };
type Vote = "counts" | "no_way";
type RoundOutcome = "other_hit" | "self_hit" | "miss" | "rejected";
type RoundResult = {
  round: number;
  secretPlayerId: string;
  targetWord: string;
  hitterId: string | null;
  secretPoints: number;
  hitterPoints: number;
  linksUsed: number;
  outcome: RoundOutcome;
};
type Game = {
  code: string;
  status: "lobby" | "playing" | "review" | "round_end" | "finished";
  hostPlayerId: string;
  players: Player[];
  links: Link[];
  turnSeat: number;
  maxLinks: number;
  challenge: null | {
    challengerId: string;
    linkId: string;
    votes: Record<string, Vote>;
  };
  targetReview: null | {
    linkId: string;
    hitterId: string;
    votes: Record<string, Vote>;
  };
  message: string;
  round: number;
  maxRounds: number;
  results: RoundResult[];
  secret: { targetWord: string } | null;
  revealedTarget: string | null;
  revealedSecretPlayerId: string | null;
  me: { id: string; isHost: boolean };
};
type Session = { code: string; playerId: string; token: string };

const KEY = "pps-chain-reaction-session";

export function ChainReactionClient() {
  const [game, setGame] = useState<Game | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        ...(init?.headers || {}),
      },
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Something went wrong.");
    return json;
  }, []);

  function store(nextSession: Session, nextGame: Game) {
    localStorage.setItem(KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setGame(nextGame);
  }

  useEffect(() => {
    const requestedCode = new URLSearchParams(location.search).get("code")?.toUpperCase();
    if (requestedCode) setCode(requestedCode);

    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Session;

      // A scanned invite must always win over a stale room saved on the device.
      if (!requestedCode || saved.code === requestedCode) {
        setSession(saved);
      }
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const json = await request(
        `/api/games/chain-reaction/${session.code}?playerId=${encodeURIComponent(
          session.playerId,
        )}&token=${encodeURIComponent(session.token)}`,
      );
      setGame(json.state);
    } catch {}
  }, [request, session]);

  useEffect(() => {
    if (!session) return;
    void refresh();
    const timer = setInterval(refresh, 1200);
    return () => clearInterval(timer);
  }, [session, refresh]);

  async function open(intent: "create" | "join") {
    setBusy(true);
    setError("");
    try {
      const json = await request("/api/games/chain-reaction", {
        method: "POST",
        body: JSON.stringify({ intent, name, code }),
      });
      store({ code: json.code, playerId: json.playerId, token: json.token }, json.state);
      history.replaceState(null, "", `/games/chain-reaction?code=${json.code}`);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Unable to join.");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: string, payload: Record<string, unknown> = {}) {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const json = await request(`/api/games/chain-reaction/${session.code}`, {
        method: "POST",
        body: JSON.stringify({ ...session, action, payload }),
      });
      setGame(json.state);
      setWord("");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  const me = game?.players.find((player) => player.id === session?.playerId);
  const current = game?.players.find((player) => player.seat === game.turnSeat);
  const latest = game?.links.at(-1);
  const previous = game && game.links.length > 1 ? game.links.at(-2) : null;
  const challenged = game?.challenge
    ? game.links.find((link) => link.id === game.challenge!.linkId)
    : null;
  const challengedAuthor = challenged
    ? game?.players.find((player) => player.id === challenged.playerId)
    : null;
  const hasChallengeVoted = Boolean(session && game?.challenge?.votes[session.playerId]);
  const reviewHitter = game?.targetReview
    ? game.players.find((player) => player.id === game.targetReview!.hitterId)
    : null;
  const hasReviewVoted = Boolean(session && game?.targetReview?.votes[session.playerId]);
  const myTurn = game?.status === "playing" && !game.challenge && me?.seat === game.turnSeat;
  const joinUrl =
    game && typeof window !== "undefined"
      ? `${window.location.origin}/games/chain-reaction?code=${game.code}`
      : "";
  const lastResult = game?.results.at(-1) ?? null;
  const revealedSecret = game?.revealedSecretPlayerId
    ? game.players.find((player) => player.id === game.revealedSecretPlayerId)
    : null;
  const resultHitter = lastResult?.hitterId
    ? game?.players.find((player) => player.id === lastResult.hitterId)
    : null;
  const isLastRound = Boolean(game && game.round + 1 >= game.maxRounds);

  const standings = useMemo(
    () => (game ? [...game.players].sort((a, b) => b.score - a.score || a.seat - b.seat) : []),
    [game],
  );
  const winningScore = standings[0]?.score ?? 0;
  const winners = standings.filter((player) => player.score === winningScore);

  if (!game) {
    return (
      <main className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-[32px] border border-cyan-300/20 bg-cyan-300/[0.06] p-7">
            <div className="text-xs font-black uppercase tracking-[.24em] text-cyan-200">Play Point Games</div>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-white">Chain Reaction</h1>
            <p className="mt-4 leading-7 text-white/65">
              Everyone builds the chain. One player secretly knows where they want it to end.
            </p>
            <input
              className="mt-7 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-lg text-white"
              placeholder="Your first name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              disabled={busy || !name.trim()}
              onClick={() => void open("create")}
              className="mt-3 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-black text-slate-950 disabled:opacity-40"
            >
              CREATE FAMILY GAME
            </button>
            <div className="my-5 text-center text-xs font-black uppercase tracking-widest text-white/35">or join a table</div>
            <input
              className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-center text-xl font-black uppercase tracking-[.3em] text-white"
              placeholder="ROOM CODE"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
            <button
              disabled={busy || !name.trim() || code.length !== 6}
              onClick={() => void open("join")}
              className="mt-3 w-full rounded-2xl border border-white/15 px-5 py-4 font-black text-white disabled:opacity-40"
            >
              JOIN GAME
            </button>
            {error && <p className="mt-4 text-sm text-rose-200">{error}</p>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-7 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.2em] text-cyan-200">Chain Reaction</div>
            <div className="mt-1 text-sm text-white/50">
              Room <b className="text-white">{game.code}</b>
            </div>
          </div>
          <div className="text-right text-xs text-white/45">
            {game.status === "lobby"
              ? "Lobby"
              : `Round ${Math.min(game.round + 1, game.maxRounds)}/${game.maxRounds} · ${Math.max(0, game.links.length - 1)}/${game.maxLinks} links`}
          </div>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {game.players.map((player) => (
            <div
              key={player.id}
              className={`rounded-2xl border p-3 ${
                player.seat === game.turnSeat && game.status === "playing"
                  ? "border-cyan-300/45 bg-cyan-300/10"
                  : "border-white/10 bg-white/[.03]"
              }`}
            >
              <div className="truncate text-sm font-bold text-white">
                {player.name}{player.id === session?.playerId ? " · You" : ""}
              </div>
              <div className="mt-1 text-2xl font-black text-cyan-100">{player.score}</div>
            </div>
          ))}
        </div>

        {game.status === "lobby" && (
          <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.04] p-6">
            <h2 className="text-2xl font-black text-white">Get the table together</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Everyone gets one turn holding the Secret Target. A round can last up to 20 links.
            </p>
            <RoomJoinPanel code={game.code} joinUrl={joinUrl} gameName="Chain Reaction" />

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/65">
                <b className="text-cyan-100">+3</b> if somebody else says your target.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/65">
                <b className="text-cyan-100">+1</b> if you say your own target validly.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/65">
                <b className="text-cyan-100">+1</b> to the player who lands somebody else&apos;s target.
              </div>
            </div>

            {game.me.isHost ? (
              <>
                {game.players.length < 2 && (
                  <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-center text-sm font-bold text-amber-100">
                    1 more player needs to join room {game.code} before the game can start.
                  </div>
                )}
                <button
                  disabled={busy || game.players.length < 2}
                  onClick={() => void act("start")}
                  className="mt-4 w-full rounded-2xl bg-cyan-300 px-4 py-4 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {game.players.length < 2 ? "WAITING FOR 1 MORE PLAYER" : "START CHAIN REACTION"}
                </button>
              </>
            ) : (
              <p className="mt-4 text-center text-sm text-white/50">Waiting for the host to start…</p>
            )}
          </section>
        )}

        {game.status !== "lobby" && game.status !== "finished" && (
          <>
            {game.secret ? (
              <section className="mt-6 rounded-[30px] border border-amber-300/25 bg-amber-300/10 p-6 text-center shadow-[0_18px_70px_rgba(251,191,36,.08)]">
                <div className="text-xs font-black uppercase tracking-[.24em] text-amber-100">Your secret target</div>
                <div className="mt-3 text-5xl font-black tracking-tight text-white">{game.secret.targetWord}</div>
                <p className="mt-4 text-sm leading-6 text-white/70">
                  Steer naturally. Get somebody else to say it for <b className="text-white">3 points</b>, or play it yourself when it truly connects for <b className="text-white">1 point</b>.
                </p>
              </section>
            ) : game.status === "playing" || game.status === "review" ? (
              <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.035] p-5 text-center">
                <div className="text-xs font-black uppercase tracking-[.22em] text-white/40">Hidden destination</div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Someone at the table knows the Secret Target. Make honest connections—you may be the player who lands it.
                </p>
              </section>
            ) : null}

            <section className="mt-4 rounded-[30px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.13),transparent_55%)] p-6">
              <div className="text-center text-xs font-black uppercase tracking-[.22em] text-white/45">
                {game.status === "review"
                  ? "Connection review"
                  : game.challenge
                    ? "Challenge at the table"
                    : myTurn
                      ? "Your turn"
                      : `${current?.name ?? "Next player"}'s turn`}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {game.links.slice(-7).map((link, index, visibleLinks) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <span
                      className={`rounded-2xl px-4 py-3 text-xl font-black ${
                        index === visibleLinks.length - 1 ? "bg-cyan-300 text-slate-950" : "bg-white/8 text-white"
                      }`}
                    >
                      {link.word}
                    </span>
                    {index < visibleLinks.length - 1 && <span className="text-white/25">→</span>}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-sm text-white/55">{game.message}</p>
            </section>

            {game.status === "review" && game.targetReview ? (
              <section className="mt-4 rounded-[28px] border border-amber-300/25 bg-amber-300/10 p-6 text-center">
                <div className="text-xs font-black uppercase tracking-widest text-amber-100">The target was played</div>
                <div className="mt-3 text-2xl font-black text-white">{previous?.word} → {latest?.word}</div>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  Before any points count, the table decides whether that connection is legitimate.
                  {reviewHitter ? ` ${reviewHitter.name} made the link and does not vote.` : ""}
                </p>
                {game.targetReview.hitterId !== session?.playerId && !hasReviewVoted ? (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button disabled={busy} onClick={() => void act("review_vote", { vote: "counts" })} className="rounded-2xl bg-emerald-300 px-3 py-4 font-black text-slate-950 disabled:opacity-40">COUNTS</button>
                    <button disabled={busy} onClick={() => void act("review_vote", { vote: "no_way" })} className="rounded-2xl bg-rose-300 px-3 py-4 font-black text-slate-950 disabled:opacity-40">NO WAY</button>
                  </div>
                ) : (
                  <p className="mt-5 text-sm font-bold text-white/55">Waiting for the table&apos;s decision…</p>
                )}
              </section>
            ) : game.challenge ? (
              <section className="mt-4 rounded-[28px] border border-amber-300/25 bg-amber-300/10 p-6 text-center">
                <div className="text-xs font-black uppercase tracking-widest text-amber-100">Defend the connection aloud</div>
                <div className="mt-2 text-3xl font-black text-white">{challenged?.word}</div>
                <p className="mt-2 text-sm text-white/60">
                  {challengedAuthor?.name} explains it. Everyone else decides. No points are won or lost on a challenge.
                </p>
                {challenged?.playerId !== session?.playerId && !hasChallengeVoted ? (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button disabled={busy} onClick={() => void act("vote", { vote: "counts" })} className="rounded-2xl bg-emerald-300 px-3 py-4 font-black text-slate-950 disabled:opacity-40">COUNTS</button>
                    <button disabled={busy} onClick={() => void act("vote", { vote: "no_way" })} className="rounded-2xl bg-rose-300 px-3 py-4 font-black text-slate-950 disabled:opacity-40">NO WAY</button>
                  </div>
                ) : (
                  <p className="mt-5 text-sm font-bold text-white/55">Waiting for the table&apos;s decision…</p>
                )}
              </section>
            ) : game.status === "playing" ? (
              <section className="mt-4 rounded-[28px] border border-white/10 bg-white/[.035] p-5">
                {myTurn ? (
                  <form onSubmit={(event: FormEvent) => { event.preventDefault(); void act("word", { word }); }}>
                    <label className="text-xs font-black uppercase tracking-widest text-white/45">Connect to {latest?.word}</label>
                    <div className="mt-3 flex gap-2">
                      <input
                        autoFocus
                        value={word}
                        onChange={(event) => setWord(event.target.value)}
                        placeholder="Your connection"
                        className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-lg font-bold uppercase text-white"
                      />
                      <button disabled={busy || !word.trim()} className="rounded-2xl bg-cyan-300 px-5 font-black text-slate-950 disabled:opacity-40">LINK</button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center text-white/55">Listen to the chain and be ready when it reaches you.</div>
                )}

                {latest?.playerId && latest.playerId !== session?.playerId && (
                  <button disabled={busy} onClick={() => void act("challenge")} className="mt-4 w-full rounded-2xl border border-amber-300/25 px-4 py-3 text-sm font-black text-amber-100 disabled:opacity-40">THAT DOESN&apos;T CONNECT</button>
                )}
              </section>
            ) : null}

            {game.status === "round_end" && lastResult && (
              <section className="mt-4 rounded-[30px] border border-emerald-300/20 bg-emerald-300/10 p-7 text-center">
                <div className="text-xs font-black uppercase tracking-[.22em] text-emerald-100">Target revealed</div>
                <div className="mt-3 text-5xl font-black text-white">{game.revealedTarget}</div>
                <p className="mt-4 text-sm leading-6 text-white/65">{game.message}</p>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-black/20 p-4">
                    <div className="text-xs font-black uppercase tracking-widest text-white/40">Secret player</div>
                    <div className="mt-1 text-xl font-black text-white">{revealedSecret?.name ?? "—"}</div>
                    <div className="mt-1 text-sm text-emerald-100">+{lastResult.secretPoints}</div>
                  </div>
                  <div className="rounded-2xl bg-black/20 p-4">
                    <div className="text-xs font-black uppercase tracking-widest text-white/40">Target hitter</div>
                    <div className="mt-1 text-xl font-black text-white">{resultHitter?.name ?? "Nobody"}</div>
                    <div className="mt-1 text-sm text-emerald-100">+{lastResult.hitterPoints}</div>
                  </div>
                </div>

                <div className="mt-4 text-xs font-bold uppercase tracking-widest text-white/40">
                  {lastResult.linksUsed} link{lastResult.linksUsed === 1 ? "" : "s"} used
                </div>

                {game.me.isHost ? (
                  <button disabled={busy} onClick={() => void act("next_round")} className="mt-5 w-full rounded-2xl bg-white px-5 py-4 font-black text-slate-950 disabled:opacity-40">
                    {isLastRound ? "SEE FINAL SCORE" : "NEXT SECRET TARGET"}
                  </button>
                ) : (
                  <p className="mt-5 text-sm text-white/50">Waiting for the host…</p>
                )}
              </section>
            )}
          </>
        )}

        {game.status === "finished" && (
          <section className="mt-6 rounded-[30px] border border-cyan-300/20 bg-cyan-300/[0.08] p-7 text-center">
            <div className="text-xs font-black uppercase tracking-[.22em] text-cyan-100">Final score</div>
            <h2 className="mt-3 text-4xl font-black text-white">
              {winners.length > 1 ? `${winners.map((player) => player.name).join(" & ")} tie!` : `${winners[0]?.name ?? "Table"} wins!`}
            </h2>

            <div className="mt-6 space-y-2">
              {standings.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <span className="font-bold text-white">{index + 1}. {player.name}</span>
                  <span className="text-2xl font-black text-cyan-100">{player.score}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4 text-left">
              <div className="text-xs font-black uppercase tracking-widest text-white/40">Round recap</div>
              <div className="mt-3 space-y-2">
                {game.results.map((result) => {
                  const secretPlayer = game.players.find((player) => player.id === result.secretPlayerId);
                  return (
                    <div key={`${result.round}-${result.secretPlayerId}`} className="text-sm text-white/65">
                      <b className="text-white">{result.round + 1}.</b> {secretPlayer?.name ?? "Player"} had <b className="text-cyan-100">{result.targetWord}</b> · +{result.secretPoints}
                    </div>
                  );
                })}
              </div>
            </div>

            {game.me.isHost && (
              <button disabled={busy} onClick={() => void act("restart")} className="mt-6 w-full rounded-2xl bg-white px-5 py-4 font-black text-slate-950 disabled:opacity-40">PLAY AGAIN</button>
            )}
          </section>
        )}

        {error && <p className="mt-4 text-center text-sm text-rose-200">{error}</p>}
      </div>
    </main>
  );
}
