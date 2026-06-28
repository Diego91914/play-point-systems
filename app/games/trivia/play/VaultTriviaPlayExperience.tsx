"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatDifficultyFilterLabel,
  PLAYPOINT_RUNTIME_ROUNDS,
  type RuntimeCatalogCategorySummary,
  type RuntimeDeck,
  type RuntimeDeckCard,
  type RuntimeDifficultyFilter,
  type RuntimeResponse,
} from "./trivia-runtime-types";

type SessionPlayer = {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
};

type ResolutionRow = {
  playerId: string;
  playerName: string;
  response: RuntimeResponse;
  responseText: string;
  outcome: "Correct" | "Wrong" | "Skipped";
  delta: number;
  nextScore: number;
};

type ResolutionState = {
  card: RuntimeDeckCard;
  correctSlot: string;
  correctText: string;
  rows: ResolutionRow[];
};

type ActiveSession = {
  deck: RuntimeDeck;
  cardIndex: number;
  players: SessionPlayer[];
  selections: Record<string, RuntimeResponse | undefined>;
  resolution: ResolutionState | null;
};

type CatalogPayload = {
  generatedAt: string;
  categories: RuntimeCatalogCategorySummary[];
};

const starterNames = "Red Team, Blue Team, Green Team";

function parsePlayerNames(input: string) {
  return input
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function requestJson<T>(url: string) {
  return fetch(url, {
    cache: "no-store",
  }).then(async (response) => {
    const payload = (await response.json()) as unknown;
    const errorPayload =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: string })
        : null;

    if (!response.ok) {
      throw new Error(errorPayload?.error ?? "Request failed.");
    }

    return payload as T;
  });
}

function buildInitialSession(deck: RuntimeDeck, names: string[]): ActiveSession {
  return {
    deck,
    cardIndex: 0,
    players: names.map((name, index) => ({
      id: `player-${index + 1}`,
      name,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      skippedCount: 0,
    })),
    selections: {},
    resolution: null,
  };
}

export function VaultTriviaPlayExperience() {
  const [catalog, setCatalog] = useState<RuntimeCatalogCategorySummary[]>([]);
  const [catalogGeneratedAt, setCatalogGeneratedAt] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [playerInput, setPlayerInput] = useState(starterNames);
  const [selectedCategory, setSelectedCategory] = useState("bible");
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<RuntimeDifficultyFilter>("mixed");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState(false);
  const [session, setSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const payload = await requestJson<CatalogPayload>("/api/trivia/catalog");

        if (!active) {
          return;
        }

        setCatalog(payload.categories);
        setCatalogGeneratedAt(payload.generatedAt);
        setCatalogError(null);

        const firstPlayableCategory = payload.categories.find((category) => category.isPlayable);

        if (firstPlayableCategory && !payload.categories.some((category) => category.category === selectedCategory && category.isPlayable)) {
          setSelectedCategory(firstPlayableCategory.category);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setCatalogError(error instanceof Error ? error.message : "Unable to load the trivia catalog.");
      } finally {
        if (active) {
          setCatalogLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      active = false;
    };
  }, [selectedCategory]);

  const selectedCategorySummary = catalog.find((category) => category.category === selectedCategory) ?? null;
  const availableDifficultyFilters = selectedCategorySummary?.availableDifficultyFilters ?? [];

  useEffect(() => {
    if (availableDifficultyFilters.length === 0) {
      return;
    }

    if (!availableDifficultyFilters.includes(selectedDifficultyFilter)) {
      setSelectedDifficultyFilter(availableDifficultyFilters[0]);
    }
  }, [availableDifficultyFilters, selectedDifficultyFilter]);

  const isComplete = session ? session.cardIndex >= session.deck.cards.length : false;
  const currentCard = !session || isComplete ? null : session.deck.cards[session.cardIndex];
  const currentRound = currentCard
    ? session?.deck.rounds.find((round) => round.roundId === currentCard.roundId) ?? null
    : null;
  const leaderboard = session
    ? [...session.players].sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.name.localeCompare(right.name);
      })
    : [];
  const allSelectionsMade = session
    ? session.players.every((player) => Boolean(session.selections[player.id]))
    : false;

  function restartSession() {
    setSession(null);
    setSetupError(null);
  }

  function chooseResponse(playerId: string, response: RuntimeResponse) {
    if (!session || !currentCard || session.resolution) {
      return;
    }

    setSession({
      ...session,
      selections: {
        ...session.selections,
        [playerId]: response,
      },
    });
  }

  async function startSession() {
    const names = parsePlayerNames(playerInput);

    if (names.length === 0) {
      setSetupError("Add at least one player or team name.");
      return;
    }

    if (names.length > 8) {
      setSetupError("Keep the hosted demo to eight players or teams or fewer.");
      return;
    }

    const normalized = names.map((name) => name.toLowerCase());
    const hasDuplicates = normalized.some((name, index) => normalized.indexOf(name) !== index);

    if (hasDuplicates) {
      setSetupError("Use distinct names so the leaderboard and answer grid stay clear.");
      return;
    }

    if (!selectedCategorySummary?.isPlayable) {
      setSetupError("Choose a category that currently has playable Gold trivia records.");
      return;
    }

    try {
      setStartingSession(true);
      setSetupError(null);
      const deck = await requestJson<RuntimeDeck>(
        `/api/trivia/deck?category=${encodeURIComponent(selectedCategory)}&difficulty=${encodeURIComponent(selectedDifficultyFilter)}`,
      );
      setSession(buildInitialSession(deck, names));
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to start the selected trivia session.");
    } finally {
      setStartingSession(false);
    }
  }

  function resolveQuestion() {
    if (!session || !currentCard || !allSelectionsMade || session.resolution) {
      return;
    }

    const correctChoice = currentCard.choices.find((choice) => choice.isCorrect) ?? currentCard.choices[0];
    const nextPlayers: SessionPlayer[] = [];
    const rows: ResolutionRow[] = [];

    session.players.forEach((player) => {
      const response = session.selections[player.id] ?? "skip";
      const isCorrect = response === correctChoice.slot;
      const skipped = response === "skip";
      const delta = skipped ? currentCard.scoring.skip : isCorrect ? currentCard.scoring.correct : currentCard.scoring.wrong;
      const nextPlayer: SessionPlayer = {
        ...player,
        score: player.score + delta,
        correctCount: player.correctCount + (isCorrect ? 1 : 0),
        wrongCount: player.wrongCount + (!isCorrect && !skipped ? 1 : 0),
        skippedCount: player.skippedCount + (skipped ? 1 : 0),
      };

      nextPlayers.push(nextPlayer);
      rows.push({
        playerId: player.id,
        playerName: player.name,
        response,
        responseText:
          response === "skip"
            ? "Skip"
            : currentCard.choices.find((choice) => choice.slot === response)?.text ?? response,
        outcome: skipped ? "Skipped" : isCorrect ? "Correct" : "Wrong",
        delta,
        nextScore: nextPlayer.score,
      });
    });

    setSession({
      ...session,
      players: nextPlayers,
      resolution: {
        card: currentCard,
        correctSlot: correctChoice.slot,
        correctText: correctChoice.text,
        rows,
      },
    });
  }

  function advanceQuestion() {
    if (!session || !currentCard || !session.resolution) {
      return;
    }

    setSession({
      ...session,
      cardIndex: session.cardIndex + 1,
      selections: {},
      resolution: null,
    });
  }

  return (
    <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <div className="grid gap-6">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
                  {session ? session.deck.packTitle : "Vault-Fed Gold Runtime"}
                </div>
                <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Hosted-room trivia runtime</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/74">
                  This pass now loads Gold trivia from the vault by category and difficulty, so the live game can grow beyond one fixed Bible demo while still staying word-first and storage-light.
                </p>
              </div>
              <div className="rounded-[26px] border border-cyan-300/20 bg-black/20 px-4 py-4 text-sm text-cyan-50">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">Runtime shape</div>
                <div className="mt-2 font-semibold">
                  {session ? session.deck.totalQuestions : "Up to 12"} questions | category + difficulty aware
                </div>
              </div>
            </div>

            {!session ? (
              <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.92fr]">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Start a room</div>

                  <label className="mt-4 block text-sm font-semibold text-white/90" htmlFor="category-select">
                    Category
                  </label>
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    disabled={catalogLoading || catalog.length === 0}
                    className="mt-3 w-full rounded-[20px] border border-white/10 bg-[#07101c] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-[#091524]"
                  >
                    {catalog.map((category) => (
                      <option key={category.category} value={category.category} disabled={!category.isPlayable}>
                        {category.label} ({category.totalGoldTriviaCount} gold{category.isPlayable ? "" : ", coming soon"})
                      </option>
                    ))}
                  </select>

                  <label className="mt-5 block text-sm font-semibold text-white/90" htmlFor="difficulty-select">
                    Difficulty profile
                  </label>
                  <select
                    id="difficulty-select"
                    value={selectedDifficultyFilter}
                    onChange={(event) => setSelectedDifficultyFilter(event.target.value as RuntimeDifficultyFilter)}
                    disabled={availableDifficultyFilters.length === 0}
                    className="mt-3 w-full rounded-[20px] border border-white/10 bg-[#07101c] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-[#091524]"
                  >
                    {availableDifficultyFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {formatDifficultyFilterLabel(filter)}
                      </option>
                    ))}
                  </select>

                  <label className="mt-5 block text-sm font-semibold text-white/90" htmlFor="player-names">
                    Player or team names
                  </label>
                  <p className="mt-2 text-sm leading-7 text-white/66">
                    Enter one line or comma-separated list. This hosted build still works best with one screen and a room leader.
                  </p>
                  <textarea
                    id="player-names"
                    value={playerInput}
                    onChange={(event) => setPlayerInput(event.target.value)}
                    rows={5}
                    className="mt-4 w-full rounded-[24px] border border-white/10 bg-[#07101c] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/40 focus:bg-[#091524]"
                    placeholder="Red Team, Blue Team"
                  />

                  {catalogError ? <div className="mt-3 text-sm font-semibold text-amber-200">{catalogError}</div> : null}
                  {setupError ? <div className="mt-3 text-sm font-semibold text-amber-200">{setupError}</div> : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={startSession}
                      disabled={catalogLoading || startingSession || !selectedCategorySummary?.isPlayable}
                      className={
                        catalogLoading || startingSession || !selectedCategorySummary?.isPlayable
                          ? "inline-flex rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-black text-white/36"
                          : "inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110"
                      }
                    >
                      {startingSession ? "Building Deck..." : "Start Vault-Fed Session"}
                    </button>
                    <Link
                      href="/games/trivia"
                      className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12"
                    >
                      Back to Trivia
                    </Link>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Current vault view</div>
                  <div className="mt-4 grid gap-3 text-sm text-white/78">
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                      <span className="font-semibold text-white">{selectedCategorySummary?.label ?? "Loading"}</span>
                      {selectedCategorySummary ? ` has ${selectedCategorySummary.totalGoldTriviaCount} playable Gold trivia records right now.` : " category data is loading."}
                    </div>
                    {selectedCategorySummary ? (
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                        Easy {selectedCategorySummary.countsByDifficulty.easy} | Medium {selectedCategorySummary.countsByDifficulty.medium} | Hard{" "}
                        {selectedCategorySummary.countsByDifficulty.hard} | Expert {selectedCategorySummary.countsByDifficulty.expert}
                      </div>
                    ) : null}
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                      Mixed Ladder uses the vault across multiple difficulties. Exact filters let the room focus on one lane when enough content exists.
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                      {catalogGeneratedAt
                        ? `Catalog snapshot generated ${new Date(catalogGeneratedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.`
                        : "Catalog snapshot time is loading."}
                    </div>
                  </div>
                </div>
              </div>
            ) : isComplete ? (
              <div className="mt-7 rounded-[28px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(40,94,74,0.32),rgba(255,255,255,0.03))] p-5 sm:p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/70">Session complete</div>
                <h3 className="mt-3 text-3xl font-black text-white">Winner: {leaderboard[0]?.name ?? "No winner yet"}</h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/74">
                  This room used the <span className="font-semibold text-white">{session.deck.packTitle}</span> selection from the exported Gold vault catalog. That means the web game is now pulling from real vault inventory instead of one fixed hand-curated set.
                </p>
                <div className="mt-6 grid gap-3">
                  {leaderboard.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="text-sm font-black text-white">
                          {index + 1}. {player.name}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                          {player.correctCount} right | {player.wrongCount} wrong | {player.skippedCount} skipped
                        </div>
                      </div>
                      <div className="text-2xl font-black text-cyan-50">{player.score}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={restartSession}
                    className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
                  >
                    Build Another Room
                  </button>
                  <Link
                    href="/contact"
                    className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12"
                  >
                    Ask About Selling This Game
                  </Link>
                </div>
              </div>
            ) : currentCard ? (
              <div className="mt-7 grid gap-6">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
                        {currentCard.roundLabel} | Question {currentCard.questionNumberInRound} of {currentCard.totalQuestionsInRound}
                      </div>
                      <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">{currentCard.prompt}</h3>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">{currentCard.roundIntro}</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/78">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Scoring this round</div>
                      <div className="mt-2 font-semibold text-white">
                        {formatDelta(currentCard.scoring.correct)} right | {formatDelta(currentCard.scoring.wrong)} wrong | {formatDelta(currentCard.scoring.skip)} skip
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {currentCard.choices.map((choice) => (
                      <div
                        key={choice.slot}
                        className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-4"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">Choice {choice.slot}</div>
                        <div className="mt-2 text-lg font-black text-white">{choice.text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[24px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(12,31,48,0.8),rgba(7,16,28,0.95))] px-4 py-4 text-sm text-white/72">
                    <span className="font-semibold text-white">Reference:</span> {currentCard.reference} | Difficulty {currentCard.difficulty} | Gold vault source {currentCard.sourceId}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">Answer board</div>
                      <h4 className="mt-3 text-2xl font-black text-white">Lock each team's choice</h4>
                    </div>
                    <div className="text-sm leading-7 text-white/66">
                      Everyone chooses one answer. Then the host resolves the question and the scores update together.
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {session.players.map((player) => {
                      const selected = session.selections[player.id];

                      return (
                        <div
                          key={player.id}
                          className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-lg font-black text-white">{player.name}</div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/44">
                                Score {player.score} | {player.correctCount} right | {player.wrongCount} wrong
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-cyan-50">
                              {selected ? `Locked: ${selected === "skip" ? "Skip" : selected}` : "Waiting for answer"}
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {currentCard.choices.map((choice) => {
                              const active = selected === choice.slot;

                              return (
                                <button
                                  key={choice.slot}
                                  type="button"
                                  onClick={() => chooseResponse(player.id, choice.slot)}
                                  aria-pressed={active}
                                  className={
                                    active
                                      ? "rounded-2xl border border-cyan-300/45 bg-cyan-400/18 px-4 py-2.5 text-sm font-black text-cyan-50"
                                      : "rounded-2xl border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-black text-white/84 transition hover:bg-white/12"
                                  }
                                >
                                  {choice.slot}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => chooseResponse(player.id, "skip")}
                              aria-pressed={selected === "skip"}
                              className={
                                selected === "skip"
                                  ? "rounded-2xl border border-amber-300/45 bg-amber-400/16 px-4 py-2.5 text-sm font-black text-amber-50"
                                  : "rounded-2xl border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-black text-white/84 transition hover:bg-white/12"
                              }
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {!session.resolution ? (
                      <button
                        type="button"
                        onClick={resolveQuestion}
                        disabled={!allSelectionsMade}
                        className={
                          allSelectionsMade
                            ? "inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110"
                            : "inline-flex rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-black text-white/36"
                        }
                      >
                        Resolve Question
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={advanceQuestion}
                        className="inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110"
                      >
                        {session.cardIndex === session.deck.cards.length - 1 ? "Finish Session" : "Next Question"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={restartSession}
                      className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12"
                    >
                      Restart Session
                    </button>
                  </div>
                </div>

                {session.resolution ? (
                  <div className="rounded-[28px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(40,94,74,0.32),rgba(255,255,255,0.03))] p-5 sm:p-6">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/70">Resolution</div>
                    <h4 className="mt-3 text-2xl font-black text-white">
                      Correct answer: {session.resolution.correctSlot} | {session.resolution.correctText}
                    </h4>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/74">{session.resolution.card.explanation}</p>
                    <div className="mt-6 grid gap-3">
                      {session.resolution.rows.map((row) => (
                        <div
                          key={row.playerId}
                          className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="text-sm font-black text-white">
                              {row.playerName} | {row.outcome}
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                              Answered {row.response} | {row.responseText}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-cyan-50">{formatDelta(row.delta)}</div>
                            <div className="text-xs uppercase tracking-[0.18em] text-white/46">Total {row.nextScore}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 xl:sticky xl:top-28">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Game frame</div>
            <h3 className="mt-3 text-2xl font-black text-white">Why this format works</h3>
            <div className="mt-5 grid gap-3 text-sm text-white/76">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <span className="font-semibold text-white">Multiple choice stays fun</span> because every team can stay involved.
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <span className="font-semibold text-white">Wrong answers matter</span> so random guessing is not always safe.
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <span className="font-semibold text-white">Word-first content scales</span> across Bible, sports, music, movies, and future sponsored packs without expensive media storage.
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Leaderboard</div>
                <h3 className="mt-3 text-2xl font-black text-white">
                  {session?.deck.categoryLabel ?? selectedCategorySummary?.label ?? "Vault Runtime"}
                </h3>
              </div>
              {session && currentCard ? (
                <div className="text-right text-xs uppercase tracking-[0.18em] text-white/48">
                  <div>Round {currentCard.roundIndex} of {currentCard.totalRounds}</div>
                  <div className="mt-1">Question {session.cardIndex + 1} of {session.deck.cards.length}</div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3">
              {leaderboard.length > 0 ? (
                leaderboard.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <div>
                      <div className="text-sm font-black text-white">
                        {index + 1}. {player.name}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                        {player.correctCount} right | {player.wrongCount} wrong | {player.skippedCount} skipped
                      </div>
                    </div>
                    <div className="text-2xl font-black text-cyan-50">{player.score}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white/64">
                  Start a room to see the live scoreboard fill in.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Round map</div>
            <div className="mt-4 grid gap-3">
              {(session?.deck.rounds ?? PLAYPOINT_RUNTIME_ROUNDS.map((round) => ({
                roundId: round.roundId,
                label: round.label,
                intro: round.intro,
                scoring: round.scoring,
                questionCount: 0,
              }))).map((round, index) => {
                const active = currentRound?.roundId === round.roundId;

                return (
                  <div
                    key={round.roundId}
                    className={
                      active
                        ? "rounded-2xl border border-cyan-300/28 bg-cyan-400/10 px-4 py-4"
                        : "rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                    }
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                      Round {index + 1}
                    </div>
                    <div className="mt-2 text-lg font-black text-white">{round.label}</div>
                    <div className="mt-2 text-sm leading-7 text-white/68">{round.intro}</div>
                    <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/46">
                      {formatDelta(round.scoring.correct)} / {formatDelta(round.scoring.wrong)} / {formatDelta(round.scoring.skip)}
                      {session ? ` | ${round.questionCount} q` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
