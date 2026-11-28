"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RoomJoinPanel } from "@/app/games/_components/RoomJoinPanel";
import type { StoryView } from "@/lib/play-point-core/thats-your-story-engine";
const KEY = "pps-thats-your-story-session",
  API = "/api/games/thats-your-story";
const PENDING_JOIN_KEY = `${KEY}:pending-join`;
type PendingJoin = { code: string; name: string; token: string };
type Session = { code: string; playerId: string; token: string };
const btn =
  "w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 disabled:opacity-40 min-h-12";
const alt =
  "w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 font-bold text-white disabled:opacity-40 min-h-12";
const field =
  "w-full min-w-0 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-base text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300";
export function ThatsYourStoryClient() {
  const [session, setSession] = useState<Session | null>(null),
    [game, setGame] = useState<StoryView | null>(null);
  const [code, setCode] = useState(""),
    [name, setName] = useState(""),
    [draft, setDraft] = useState(""),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [origin, setOrigin] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const pendingJoin = useRef<PendingJoin | null>(null);
  const busyRef = useRef(false),
    sequence = useRef(0),
    applied = useRef(0);
  useEffect(() => {
    const invite =
      new URLSearchParams(window.location.search)
        .get("code")
        ?.trim()
        .toUpperCase() ?? "";
    setOrigin(window.location.origin);
    setCode(invite);
    try {
      const s = JSON.parse(
        localStorage.getItem(KEY) ?? "null",
      ) as Session | null;
      if (invite && s?.code === invite && s.playerId && s.token) {
        setSession(s);
      } else {
        const pending = JSON.parse(
          localStorage.getItem(PENDING_JOIN_KEY) ?? "null",
        ) as PendingJoin | null;
        if (
          pending?.code === invite &&
          pending.name &&
          /^[a-f0-9]{64}$/.test(pending.token)
        ) {
          pendingJoin.current = pending;
          setName(pending.name);
        }
      }
    } catch {}
    setReady(true);
  }, []);
  const accept = useCallback((state: StoryView, seq: number) => {
    if (seq < applied.current) return;
    applied.current = seq;
    setGame(state);
  }, []);
  const refresh = useCallback(async () => {
    if (!session || busyRef.current) return;
    const seq = ++sequence.current;
    try {
      const r = await fetch(API + "/" + session.code, {
        cache: "no-store",
        headers: {
          "x-room-player": session.playerId,
          authorization: `Bearer ${session.token}`,
        },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Unable to refresh.");
      if (seq >= applied.current) setConnectionError("");
      accept(j.state, seq);
    } catch (e) {
      if (seq >= applied.current)
        setConnectionError(
          e instanceof Error
            ? e.message
            : "Connection interrupted. Your room is saved.",
        );
    }
  }, [session, accept]);
  useEffect(() => {
    if (!session) return;
    void refresh();
    const t = window.setInterval(() => void refresh(), 1200);
    return () => window.clearInterval(t);
  }, [session, refresh]);
  useEffect(() => {
    setDraft("");
    setSelected(null);
  }, [game?.roundId]);
  async function open(intent: "create" | "join" | "rejoin_host") {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      let joinToken: string | undefined;
      if (intent === "join") {
        const previous = pendingJoin.current;
        if (previous?.code === code && previous.name === name.trim()) {
          joinToken = previous.token;
        } else {
          joinToken = Array.from(
            crypto.getRandomValues(new Uint8Array(32)),
            (byte) => byte.toString(16).padStart(2, "0"),
          ).join("");
          pendingJoin.current = { code, name: name.trim(), token: joinToken };
          try {
            localStorage.setItem(
              PENDING_JOIN_KEY,
              JSON.stringify(pendingJoin.current),
            );
          } catch {}
        }
      }
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, code, name, joinToken }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Unable to enter room.");
      const s = { code: j.code, playerId: j.playerId, token: j.token };
      window.history.replaceState(
        null,
        "",
        "?code=" + encodeURIComponent(s.code),
      );
      try {
        localStorage.setItem(
          KEY,
          JSON.stringify({ ...s, updatedAt: Date.now() }),
        );
        localStorage.removeItem(PENDING_JOIN_KEY);
      } catch {}
      setConnectionError("");
      setSession(s);
      accept(j.state, ++sequence.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to enter.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function act(action: string, payload: Record<string, unknown> = {}) {
    if (!session || !game || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    const seq = ++sequence.current;
    try {
      const r = await fetch(API + "/" + session.code, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: session.playerId,
          token: session.token,
          action,
          payload: { ...payload, roundId: game.roundId },
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Try again.");
      accept(j.state, seq);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connection interrupted. Retry your action.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const leaders = game
    ? [...game.players].sort((a, b) => b.score - a.score || a.seat - b.seat)
    : [];
  return (
    <main className="mx-auto min-w-0 max-w-xl space-y-4 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-8 text-white [overflow-wrap:anywhere]">
      <header className="rounded-[30px] border border-amber-200/20 bg-gradient-to-br from-violet-950/80 via-slate-900 to-slate-950 p-5 shadow-xl sm:p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">
          Play Amplified · Social
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-amber-100 sm:text-5xl">
          That&apos;s Your Story?
        </h1>
        <p className="mt-2 text-white/70">
          Ridiculous situations. Questionable explanations. Let the crowd
          decide.
        </p>
      </header>
      {connectionError && (
        <p role="status" className="rounded-xl bg-amber-950/50 p-3">
          {connectionError}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-300/30 bg-rose-950/40 p-3"
        >
          {error}
        </p>
      )}
      {!ready ? (
        <p>Loading…</p>
      ) : !session ? (
        <section className="space-y-3 rounded-3xl border border-white/15 p-4">
          <label className="block">
            Your name
            <input
              className={field}
              maxLength={24}
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {!code && (
            <button
              className={btn}
              disabled={busy || !name.trim()}
              onClick={() => void open("create")}
            >
              CREATE ROOM
            </button>
          )}
          <label className="block">
            Room code
            <input
              className={field}
              maxLength={6}
              autoCapitalize="characters"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </label>
          <button
            className={btn}
            disabled={busy || !name.trim() || !/^[A-Z2-9]{6}$/.test(code)}
            onClick={() => void open("join")}
          >
            JOIN ROOM
          </button>
          <button
            className={alt}
            disabled={busy || !/^[A-Z2-9]{6}$/.test(code)}
            onClick={() => void open("rejoin_host")}
          >
            REJOIN AS HOST
          </button>
        </section>
      ) : !game ? (
        <section>
          <p>Connecting to your room…</p>
          <button className={alt} onClick={() => void refresh()}>
            RETRY
          </button>
          <button className={alt} onClick={() => void open("rejoin_host")}>
            REJOIN AS HOST
          </button>
        </section>
      ) : game.ended ? (
        <p>The host ended the game.</p>
      ) : (
        <>
          {game.phase === "lobby" ? (
            <>
              <section className="space-y-3 rounded-3xl border border-white/15 p-4">
                <label className="block">
                  Edition
                  <select
                    className={field}
                    disabled={!game.me.isHost || busy}
                    value={game.edition}
                    onChange={(e) =>
                      void act("settings", {
                        edition: e.target.value,
                        maxRounds: game.maxRounds,
                      })
                    }
                  >
                    <option value="family">Family</option>
                    <option value="christmas">Christmas</option>
                  </select>
                </label>
                <label className="block">
                  Rounds
                  <select
                    className={field}
                    disabled={!game.me.isHost || busy}
                    value={game.maxRounds}
                    onChange={(e) =>
                      void act("settings", {
                        edition: game.edition,
                        maxRounds: Number(e.target.value),
                      })
                    }
                  >
                    {[5, 10, 15].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <RoomJoinPanel
                  code={game.code}
                  joinUrl={origin + "/games/thats-your-story?code=" + game.code}
                  gameName="That's Your Story?"
                  players={game.players}
                  currentPlayerId={game.me.id}
                  isHost={game.me.isHost}
                  minPlayers={3}
                  busy={busy}
                  onStart={() => void act("start")}
                />
              </section>
            </>
          ) : (
            <>
              <section className="space-y-3 rounded-3xl border border-white/15 bg-white/5 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-cyan-200">
                  Round {game.round + 1} of {game.maxRounds}
                </p>
                <h2 className="text-2xl font-black break-words">
                  {game.prompt} What&apos;s your story?
                </h2>
                {game.phase === "writing" && (
                  <>
                    <p>
                      {game.submittedCount} / {game.players.length} stories
                      locked
                    </p>
                    {game.ownStory !== null ? (
                      <p className="rounded-xl bg-white/10 p-3 break-words">
                        Story locked. Waiting for the group.
                      </p>
                    ) : (
                      <>
                        <fieldset className="space-y-2">
                          <legend className="mb-2 text-sm font-bold text-cyan-200">
                            Pick a story or write your own
                          </legend>
                          {game.storyChoices.map((choice, index) => (
                            <button
                              key={choice}
                              type="button"
                              aria-pressed={draft === choice}
                              className={alt + " break-words text-left " + (draft === choice ? "ring-2 ring-cyan-300" : "")}
                              disabled={busy}
                              onClick={() => setDraft(choice)}
                            >
                              <span className="mr-2 text-cyan-200">{String.fromCharCode(65 + index)}.</span>
                              {choice}
                            </button>
                          ))}
                          <button type="button" className={alt} disabled={busy} onClick={() => setDraft("")}>
                            WRITE MY OWN
                          </button>
                        </fieldset>
                        <label className="block">
                          Your explanation (edit or write your own)
                          <textarea
                            className={field + " min-h-32 resize-y"}
                            maxLength={240}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Make it ridiculous…"
                          />
                        </label>
                        <p className="text-sm text-white/60">
                          {draft.length}/240
                        </p>
                        <button
                          className={btn}
                          disabled={busy || !draft.trim()}
                          onClick={() => void act("submit", { text: draft })}
                        >
                          LOCK MY STORY
                        </button>
                      </>
                    )}
                    {game.me.isHost && game.submittedCount >= 2 && (
                      <button
                        className={alt}
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Close writing for everyone who has not submitted?",
                            )
                          )
                            void act("open-voting");
                        }}
                      >
                        OPEN VOTING NOW
                      </button>
                    )}
                  </>
                )}
                {game.phase === "voting" && (
                  <>
                    <p>
                      Vote for the funniest story. {game.votedCount}/
                      {game.players.length} votes locked.
                    </p>
                    {game.entries.map((entry, index) => (
                      <button
                        key={entry.id}
                        aria-pressed={
                          selected === entry.id || game.ownVote === entry.id
                        }
                        className={
                          alt +
                          " break-words text-left " +
                          (selected === entry.id ? "ring-2 ring-cyan-300" : "")
                        }
                        disabled={busy || entry.own || game.ownVote !== null}
                        onClick={() => setSelected(entry.id)}
                      >
                        <span className="mr-2 text-cyan-200">Story {String.fromCharCode(65 + index)}.</span>
                        {entry.text}
                        {entry.own ? " (Your story)" : ""}
                        {game.ownVote === entry.id ? " ✓" : ""}
                      </button>
                    ))}
                    {game.ownVote !== null ? (
                      <p>Vote locked. Waiting for the group.</p>
                    ) : (
                      <button
                        className={btn}
                        disabled={busy || !selected}
                        onClick={() => void act("vote", { entryId: selected })}
                      >
                        CAST MY VOTE
                      </button>
                    )}
                    {game.me.isHost && game.votedCount > 0 && (
                      <button
                        className={alt}
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Close voting and score submitted votes?",
                            )
                          )
                            void act("finish-voting");
                        }}
                      >
                        REVEAL RESULTS NOW
                      </button>
                    )}
                  </>
                )}
                {game.me.isHost &&
                  (game.phase === "writing" || game.phase === "voting") && (
                    <button
                      className={alt}
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Skip this round without awarding points?",
                          )
                        )
                          void act("skip");
                      }}
                    >
                      SKIP ROUND
                    </button>
                  )}
                {(game.phase === "reveal" || game.phase === "finished") && (
                  <>
                    <h3 className="text-xl font-bold">
                      {game.phase === "finished"
                        ? "Final results"
                        : "The stories revealed"}
                    </h3>
                    {game.entries.length === 0 && <p>Round skipped.</p>}
                    {[...game.entries]
                      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
                      .map((e) => (
                        <div
                          key={e.id}
                          className="rounded-xl border border-white/15 p-3 break-words"
                        >
                          <p>{e.text}</p>
                          <p className="mt-2 text-cyan-200 font-bold">
                            {
                              game.players.find((p) => p.id === e.authorId)
                                ?.name
                            }{" "}
                            · {e.points ?? 0} votes
                          </p>
                        </div>
                      ))}
                    {game.phase === "reveal" && game.me.isHost && (
                      <button
                        className={btn}
                        disabled={busy}
                        onClick={() => void act("next")}
                      >
                        {game.round + 1 === game.maxRounds
                          ? "FINAL STANDINGS"
                          : "NEXT ROUND"}
                      </button>
                    )}
                    {game.phase === "finished" && (
                      <>
                        <p className="text-lg font-bold text-amber-200">
                          Winner
                          {leaders.filter((p) => p.score === leaders[0]?.score)
                            .length > 1
                            ? "s"
                            : ""}
                          :{" "}
                          {leaders
                            .filter((p) => p.score === leaders[0]?.score)
                            .map((p) => p.name)
                            .join(", ")}
                        </p>
                        {game.me.isHost && (
                          <button
                            className={btn}
                            disabled={busy}
                            onClick={() => void act("restart")}
                          >
                            PLAY AGAIN
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </section>
              <section className="rounded-3xl border border-white/15 p-4">
                <h3 className="font-black text-lg">Leaderboard</h3>
                {leaders.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between gap-2 border-b border-white/10 py-2"
                  >
                    <span className="break-words">{p.name}</span>
                    <b>{p.score}</b>
                  </div>
                ))}
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
