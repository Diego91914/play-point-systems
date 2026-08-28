"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RoomJoinPanel } from "@/app/games/_components/RoomJoinPanel";

type Player = { id: string; name: string; score: number; seat: number };
type Link = { id: string; word: string; playerId: string | null };
type Game = {
  code: string;
  status: "lobby" | "playing" | "finished";
  hostPlayerId: string;
  players: Player[];
  links: Link[];
  turnSeat: number;
  maxLinks: number;
  challenge: null | {
    challengerId: string;
    linkId: string;
    votes: Record<string, string>;
  };
  message: string;
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
    const requestedCode = new URLSearchParams(location.search)
      .get("code")
      ?.toUpperCase();

    if (requestedCode) setCode(requestedCode);

    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Session;

      // A scanned invite must win over a stale room saved on this device.
      // Restore the saved room only when there is no invite code, or when the
      // saved session belongs to the exact room being opened.
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
          session.playerId
        )}&token=${encodeURIComponent(session.token)}`
      );
      setGame(json.state);
    } catch {}
  }, [request, session]);

  useEffect(() => {
    if (!session) return;
    void refresh();
    const timer = setInterval(refresh, 1500);
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
      store(
        { code: json.code, playerId: json.playerId, token: json.token },
        json.state
      );
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
  const challenged = game?.challenge
    ? game.links.find((link) => link.id === game.challenge!.linkId)
    : null;
  const challengedAuthor = challenged
    ? game?.players.find((player) => player.id === challenged.playerId)
    : null;
  const myTurn =
    game?.status === "playing" && !game.challenge && me?.seat === game.turnSeat;
  const joinUrl =
    game && typeof window !== "undefined"
      ? `${window.location.origin}/games/chain-reaction?code=${game.code}`
      : "";

  if (!game) {
    return (
      <main className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-[32px] border border-cyan-300/20 bg-cyan-300/[0.06] p-7">
            <div className="text-xs font-black uppercase tracking-[.24em] text-cyan-200">
              Play Point Games
            </div>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-white">
              Chain Reaction
            </h1>
            <p className="mt-4 text-white/65">
              Connect the words. Keep the chain alive. Challenge anything that
              makes the table say “What?!”
            </p>
            <input
              className="mt-7 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-lg text-white"
              placeholder="Your first name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              disabled={busy}
              onClick={() => void open("create")}
              className="mt-3 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-black text-slate-950"
            >
              CREATE FAMILY GAME
            </button>
            <div className="my-5 text-center text-xs font-black uppercase tracking-widest text-white/35">
              or join a table
            </div>
            <input
              className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-center text-xl font-black uppercase tracking-[.3em] text-white"
              placeholder="ROOM CODE"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
            <button
              disabled={busy}
              onClick={() => void open("join")}
              className="mt-3 w-full rounded-2xl border border-white/15 px-5 py-4 font-black text-white"
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
            <div className="text-xs font-black uppercase tracking-[.2em] text-cyan-200">
              Chain Reaction
            </div>
            <div className="mt-1 text-sm text-white/50">
              Room <b className="text-white">{game.code}</b>
            </div>
          </div>
          <div className="text-right text-xs text-white/45">
            {game.links.length ? `${game.links.length - 1}/${game.maxLinks} links` : "Lobby"}
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
                {player.name}
                {player.id === session?.playerId ? " · You" : ""}
              </div>
              <div className="mt-1 text-2xl font-black text-cyan-100">
                {player.score}
              </div>
            </div>
          ))}
        </div>

        {game.status === "lobby" && (
          <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.04] p-6">
            <h2 className="text-2xl font-black text-white">Get the table together</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Have everyone scan the QR code. Guests only enter a first name—no
              account needed.
            </p>
            <RoomJoinPanel code={game.code} joinUrl={joinUrl} gameName="Chain Reaction" />

            {game.me.isHost ? (
              <>
                {game.players.length < 2 && (
                  <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-center text-sm font-bold text-amber-100">
                    1 more player needs to join room {game.code} before the chain can start.
                  </div>
                )}
                <button
                  disabled={busy || game.players.length < 2}
                  onClick={() => void act("start")}
                  className="mt-3 w-full rounded-2xl bg-cyan-300 px-4 py-4 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {game.players.length < 2 ? "WAITING FOR 1 MORE PLAYER" : "START CHAIN"}
                </button>
              </>
            ) : (
              <p className="mt-4 text-center text-sm text-white/50">
                Waiting for the host to start…
              </p>
            )}
          </section>
        )}

        {game.status !== "lobby" && (
          <>
            <section className="mt-6 rounded-[30px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.13),transparent_55%)] p-6">
              <div className="text-center text-xs font-black uppercase tracking-[.22em] text-white/45">
                {game.challenge
                  ? "Challenge at the table"
                  : myTurn
                    ? "Your turn"
                    : `${current?.name ?? "Next player"}'s turn`}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {game.links.slice(-6).map((link, index) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <span
                      className={`rounded-2xl px-4 py-3 text-xl font-black ${
                        index === game.links.slice(-6).length - 1
                          ? "bg-cyan-300 text-slate-950"
                          : "bg-white/8 text-white"
                      }`}
                    >
                      {link.word}
                    </span>
                    {index < game.links.slice(-6).length - 1 && (
                      <span className="text-white/25">→</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-sm text-white/55">{game.message}</p>
            </section>

            {game.challenge ? (
              <section className="mt-4 rounded-[28px] border border-amber-300/25 bg-amber-300/10 p-6 text-center">
                <div className="text-xs font-black uppercase tracking-widest text-amber-100">
                  Defend the connection aloud
                </div>
                <div className="mt-2 text-3xl font-black text-white">{challenged?.word}</div>
                <p className="mt-2 text-sm text-white/60">
                  {challengedAuthor?.name} explains it. Everyone else votes.
                </p>
                {challenged?.playerId !== session?.playerId && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      disabled={busy}
                      onClick={() => void act("vote", { vote: "counts" })}
                      className="rounded-2xl bg-emerald-300 px-3 py-4 font-black text-slate-950"
                    >
                      COUNTS
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => void act("vote", { vote: "no_way" })}
                      className="rounded-2xl bg-rose-300 px-3 py-4 font-black text-slate-950"
                    >
                      NO WAY
                    </button>
                  </div>
                )}
              </section>
            ) : game.status === "playing" ? (
              <section className="mt-4 rounded-[28px] border border-white/10 bg-white/[.035] p-5">
                {myTurn ? (
                  <form
                    onSubmit={(event: FormEvent) => {
                      event.preventDefault();
                      void act("word", { word });
                    }}
                  >
                    <label className="text-xs font-black uppercase tracking-widest text-white/45">
                      Connect to {latest?.word}
                    </label>
                    <div className="mt-3 flex gap-2">
                      <input
                        autoFocus
                        value={word}
                        onChange={(event) => setWord(event.target.value)}
                        placeholder="Your connection"
                        className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-lg font-bold uppercase text-white"
                      />
                      <button
                        disabled={busy || !word.trim()}
                        className="rounded-2xl bg-cyan-300 px-5 font-black text-slate-950"
                      >
                        LINK
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center text-white/55">
                    Put the phone down until it comes back to you.
                  </div>
                )}
                {latest?.playerId && latest.playerId !== session?.playerId && (
                  <button
                    disabled={busy}
                    onClick={() => void act("challenge")}
                    className="mt-4 w-full rounded-2xl border border-amber-300/25 px-4 py-3 text-sm font-black text-amber-100"
                  >
                    CHALLENGE LAST LINK
                  </button>
                )}
              </section>
            ) : (
              <section className="mt-4 rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 p-6 text-center">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-100">
                  Chain complete
                </div>
                <h2 className="mt-2 text-3xl font-black text-white">
                  {[...game.players].sort((a, b) => b.score - a.score)[0]?.name} wins!
                </h2>
                {game.me.isHost && (
                  <button
                    onClick={() => void act("restart")}
                    className="mt-5 rounded-2xl bg-white px-5 py-3 font-black text-slate-950"
                  >
                    PLAY AGAIN
                  </button>
                )}
              </section>
            )}
          </>
        )}

        {error && <p className="mt-4 text-center text-sm text-rose-200">{error}</p>}
      </div>
    </main>
  );
}
