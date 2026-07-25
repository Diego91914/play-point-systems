"use client";

import Image from "next/image";
import { useEffect } from "react";
import { formatTriviaWinnerHeading } from "./trivia-result-utils";
import { formatTriviaScoringSummary, TRIVIA_PACING_OPTIONS, type TriviaPacingMode } from "./trivia-live-timing";
import type { RuntimeDeck, RuntimeDeckCard } from "./trivia-runtime-types";

type ProjectorPlayer = {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
};

type ProjectorResolution = {
  card: RuntimeDeckCard;
  correctSlot: string;
  correctText: string;
};

type ProjectorSnapshot = {
  roomCode: string;
  qrUrl: string;
  status: "lobby" | "in-progress" | "completed";
  phase: "lobby" | "question-open" | "answer-reveal" | "completed";
  cardIndex: number;
  deck: RuntimeDeck;
  currentCard: RuntimeDeckCard | null;
  questionTimerSeconds: number | null;
  pacingMode: TriviaPacingMode;
  players: ProjectorPlayer[];
  leaderboard: ProjectorPlayer[];
  submittedCount: number;
  waitingForCount: number;
  resolution: ProjectorResolution | null;
  canStart: boolean;
  canReveal: boolean;
  canAdvance: boolean;
};

export type ProjectorCountdown = {
  remainingSeconds: number;
  availablePoints: number;
  isExpired: boolean;
  progressPercent: number;
};

type TriviaProjectorModeProps = {
  snapshot: ProjectorSnapshot;
  countdown: ProjectorCountdown | null;
  onStart: () => void;
  onReveal: () => void;
  onAdvance: () => void;
  onExit: () => void;
};

function formatPoints(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function ProjectorLeaderboard({ players, limit }: { players: ProjectorPlayer[]; limit?: number }) {
  const visiblePlayers = limit ? players.slice(0, limit) : players;

  return (
    <div className="grid gap-3">
      {visiblePlayers.map((player, index) => (
        <div key={player.id} className="flex items-center justify-between gap-5 rounded-[24px] border border-white/12 bg-black/30 px-5 py-4">
          <div className="min-w-0 text-xl font-black text-white sm:text-2xl">
            <span className="mr-3 text-cyan-100/60">{index + 1}</span>
            <span className="truncate">{player.name}</span>
          </div>
          <div className="shrink-0 text-2xl font-black text-cyan-50 sm:text-3xl">{formatPoints(player.score)}</div>
        </div>
      ))}
    </div>
  );
}

export function TriviaProjectorMode({
  snapshot,
  countdown,
  onStart,
  onReveal,
  onAdvance,
  onExit,
}: TriviaProjectorModeProps) {
  const currentCard = snapshot.currentCard;
  const isLobby = snapshot.phase === "lobby";
  const isQuestion = snapshot.phase === "question-open" && currentCard;
  const revealedResolution = snapshot.phase === "answer-reveal" ? snapshot.resolution : null;
  const isComplete = snapshot.status === "completed";

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onExit();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onExit]);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#030711] text-white" role="dialog" aria-modal="true" aria-label="Trivia projector mode">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(73,176,255,0.2),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(56,215,173,0.14),transparent_35%)]" />

      <div className="relative flex min-h-screen flex-col px-5 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between gap-5 border-b border-white/10 pb-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/60">Play Point Bible Trivia</div>
            <div className="mt-2 text-sm font-semibold text-white/56">
              Room {snapshot.roomCode} · {TRIVIA_PACING_OPTIONS[snapshot.pacingMode].label} pacing
            </div>
          </div>
          <button type="button" onClick={onExit} className="rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/14">
            Exit Projector
          </button>
        </header>

        <main key={`${snapshot.phase}-${snapshot.cardIndex}`} className="reveal-up flex flex-1 items-center py-7">
          {isLobby ? (
            <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100/64">Join the room</div>
                <h1 className="mt-6 text-7xl font-black tracking-[0.16em] text-white sm:text-8xl lg:text-9xl">{snapshot.roomCode}</h1>
                <p className="mt-6 max-w-2xl text-2xl leading-relaxed text-white/70">Scan the QR code or enter this room code on the trivia join page.</p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-5 py-4 text-xl font-black text-emerald-50">
                    {snapshot.players.length} player{snapshot.players.length === 1 ? "" : "s"} ready
                  </div>
                  {snapshot.canStart ? (
                    <button type="button" onClick={onStart} className="rounded-2xl border border-cyan-200/40 bg-cyan-300 px-7 py-4 text-xl font-black text-[#04111c] shadow-[0_16px_45px_rgba(91,211,255,0.28)] transition hover:brightness-110">
                      Start Game
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="grid justify-items-center gap-5 rounded-[36px] border border-white/12 bg-white/[0.05] p-7">
                <Image src={snapshot.qrUrl} alt={`QR code for room ${snapshot.roomCode}`} width={360} height={360} unoptimized className="w-full max-w-[360px] rounded-[28px] bg-white p-3" />
                <div className="text-center text-lg font-semibold text-white/62">Waiting for the host to begin</div>
              </div>
            </div>
          ) : isQuestion ? (
            <div className="mx-auto grid w-full max-w-[1600px] gap-8 xl:grid-cols-[1fr_270px] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100/64">
                    {currentCard.roundLabel} · Question {snapshot.cardIndex + 1} of {snapshot.deck.cards.length}
                  </div>
                  <div className="text-base font-black text-white/64">{snapshot.submittedCount} answered · {snapshot.waitingForCount} waiting</div>
                </div>
                <h1 className="mt-7 max-w-6xl text-4xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">{currentCard.prompt}</h1>
                <p className="mt-4 text-lg font-semibold text-emerald-100/70">{formatTriviaScoringSummary(currentCard.scoring, snapshot.questionTimerSeconds ?? 10)}</p>
                <div className="mt-9 grid gap-4 sm:grid-cols-2">
                  {currentCard.choices.map((choice) => (
                    <div key={choice.slot} className="rounded-[28px] border border-white/12 bg-white/[0.06] px-6 py-5">
                      <div className="text-sm font-black uppercase tracking-[0.24em] text-cyan-100/65">{choice.slot}</div>
                      <div className="mt-3 text-2xl font-black leading-snug text-white sm:text-3xl">{choice.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid justify-items-center gap-5">
                <div
                  className={countdown?.remainingSeconds !== undefined && countdown.remainingSeconds <= 3 && !countdown.isExpired ? "grid h-56 w-56 animate-pulse place-items-center rounded-full p-[10px]" : "grid h-56 w-56 place-items-center rounded-full p-[10px]"}
                  style={{ background: `conic-gradient(rgb(94 234 212) ${countdown?.progressPercent ?? 0}%, rgba(255,255,255,0.1) 0)` }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-[#07101c] text-center">
                    <div>
                      <div className="text-7xl font-black text-white">{countdown?.remainingSeconds ?? snapshot.questionTimerSeconds}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/48">seconds</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-100">{formatPoints(countdown?.availablePoints ?? currentCard.scoring.correct)}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/46">points available</div>
                </div>
                {snapshot.canReveal ? (
                  <button type="button" onClick={onReveal} className="w-full rounded-2xl border border-cyan-200/35 bg-cyan-300 px-6 py-4 text-lg font-black text-[#04111c] transition hover:brightness-110">
                    Reveal Answer
                  </button>
                ) : null}
              </div>
            </div>
          ) : revealedResolution ? (
            <div className="mx-auto grid w-full max-w-[1500px] gap-9 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
              <div className="rounded-[40px] border border-emerald-300/20 bg-emerald-400/10 p-7 sm:p-10">
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100/70">Correct answer</div>
                <h1 className="mt-6 text-5xl font-black leading-tight text-white sm:text-7xl">
                  {revealedResolution.correctSlot} · {revealedResolution.correctText}
                </h1>
                <p className="mt-7 max-w-5xl text-xl leading-relaxed text-white/76 sm:text-2xl">{revealedResolution.card.explanation}</p>
                <p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-emerald-100/68">Scripture reference: {revealedResolution.card.reference}</p>
                {snapshot.canAdvance ? (
                  <button type="button" onClick={onAdvance} className="mt-9 rounded-2xl border border-cyan-200/35 bg-cyan-300 px-7 py-4 text-xl font-black text-[#04111c] transition hover:brightness-110">
                    {snapshot.cardIndex === snapshot.deck.cards.length - 1 ? "Finish Session" : "Next Question"}
                  </button>
                ) : null}
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100/60">Updated leaderboard</div>
                <p className="mb-5 text-lg text-white/60">The host will move to the next question.</p>
                <ProjectorLeaderboard players={snapshot.leaderboard} />
              </div>
            </div>
          ) : isComplete ? (
            <div className="mx-auto w-full max-w-5xl text-center">
              <div className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-100/65">Game complete</div>
              <h1 className="mt-6 text-6xl font-black text-white sm:text-8xl">{formatTriviaWinnerHeading(snapshot.leaderboard)}</h1>
              <div className="mx-auto mt-10 max-w-3xl text-left">
                <ProjectorLeaderboard players={snapshot.leaderboard} />
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
