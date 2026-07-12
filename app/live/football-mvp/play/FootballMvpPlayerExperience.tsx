"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type {
  EventStanding,
  PlayPointContest,
  PlayPointEntry,
  PlayPointEvent,
  PlayPointTrigger,
  ResolutionRow,
} from "@/lib/play-point-core";

type NotificationEvent = {
  type: string;
  aggregateId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

type FootballMvpDashboardState = {
  seededEvents: PlayPointEvent[];
  seededContests: PlayPointContest[];
  seededEntries: PlayPointEntry[];
  triggers: PlayPointTrigger[];
  resolutions: ResolutionRow[];
  rewards: unknown[];
  eventStandings: EventStanding[];
  seasonStandings: unknown[];
  notifications: NotificationEvent[];
};

const emptyDashboardState: FootballMvpDashboardState = {
  seededEvents: [],
  seededContests: [],
  seededEntries: [],
  triggers: [],
  resolutions: [],
  rewards: [],
  eventStandings: [],
  seasonStandings: [],
  notifications: [],
};

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatContestFormat(formatKey: PlayPointContest["formatKey"]) {
  return formatKey.replaceAll("_", " ");
}

function renderSelection(entry: PlayPointEntry) {
  if ("teamKey" in entry.selection && typeof entry.selection.teamKey === "string") {
    return `Pick: ${entry.selection.teamKey}`;
  }

  if (
    "homeScore" in entry.selection &&
    typeof entry.selection.homeScore === "number" &&
    "awayScore" in entry.selection &&
    typeof entry.selection.awayScore === "number"
  ) {
    return `Prediction: ${entry.selection.homeScore}-${entry.selection.awayScore}`;
  }

  if (
    "homeDigit" in entry.selection &&
    typeof entry.selection.homeDigit === "number" &&
    "awayDigit" in entry.selection &&
    typeof entry.selection.awayDigit === "number"
  ) {
    return `Squares: ${entry.selection.homeDigit}-${entry.selection.awayDigit}`;
  }

  return JSON.stringify(entry.selection);
}

function latestResolutionForEntry(
  entryId: string,
  rows: ResolutionRow[],
): ResolutionRow | null {
  return (
    rows
      .filter((row) => row.entryId === entryId && !row.supersededByResolutionId)
      .sort(
        (left, right) =>
          new Date(right.resolvedAt).getTime() - new Date(left.resolvedAt).getTime(),
      )[0] ?? null
  );
}

export function FootballMvpPlayerExperience() {
  const [dashboard, setDashboard] = useState<FootballMvpDashboardState>(
    emptyDashboardState,
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [winnerPick, setWinnerPick] = useState("packers");
  const [predictedHomeScore, setPredictedHomeScore] = useState("24");
  const [predictedAwayScore, setPredictedAwayScore] = useState("20");
  const [squareHomeDigit, setSquareHomeDigit] = useState("4");
  const [squareAwayDigit, setSquareAwayDigit] = useState("0");
  const [responseSummary, setResponseSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      void refreshDashboard();
    });
  }, []);

  const playerIds = useMemo(
    () => [...new Set(dashboard.seededEntries.map((entry) => entry.userId))],
    [dashboard.seededEntries],
  );

  useEffect(() => {
    if (!selectedUserId && playerIds.length > 0) {
      setSelectedUserId(playerIds[0] ?? "");
    }
  }, [playerIds, selectedUserId]);

  const seededEvent = dashboard.seededEvents[0] ?? null;
  const winnerContest =
    dashboard.seededContests.find((contest) => contest.formatKey === "winner_pick") ??
    null;
  const finalScoreContest =
    dashboard.seededContests.find((contest) => contest.formatKey === "final_score") ??
    null;
  const squaresContest =
    dashboard.seededContests.find(
      (contest) => contest.formatKey === "football_squares",
    ) ?? null;
  const playerEntries = dashboard.seededEntries.filter(
    (entry) => entry.userId === selectedUserId,
  );
  const playerStanding =
    dashboard.eventStandings.find((standing) => standing.userId === selectedUserId) ??
    null;
  const activeResolutionRows = dashboard.resolutions.filter(
    (row) => !row.supersededByResolutionId && row.userId === selectedUserId,
  );

  useEffect(() => {
    const winnerEntry = playerEntries.find(
      (entry) => entry.contestId === winnerContest?.id,
    );
    const finalEntry = playerEntries.find(
      (entry) => entry.contestId === finalScoreContest?.id,
    );
    const squaresEntry = playerEntries.find(
      (entry) => entry.contestId === squaresContest?.id,
    );

    if (winnerEntry && typeof winnerEntry.selection.teamKey === "string") {
      setWinnerPick(winnerEntry.selection.teamKey);
    }

    if (
      finalEntry &&
      typeof finalEntry.selection.homeScore === "number" &&
      typeof finalEntry.selection.awayScore === "number"
    ) {
      setPredictedHomeScore(String(finalEntry.selection.homeScore));
      setPredictedAwayScore(String(finalEntry.selection.awayScore));
    }

    if (
      squaresEntry &&
      typeof squaresEntry.selection.homeDigit === "number" &&
      typeof squaresEntry.selection.awayDigit === "number"
    ) {
      setSquareHomeDigit(String(squaresEntry.selection.homeDigit));
      setSquareAwayDigit(String(squaresEntry.selection.awayDigit));
    }
  }, [playerEntries, winnerContest?.id, finalScoreContest?.id, squaresContest?.id]);

  async function refreshDashboard() {
    const response = await fetch("/api/live/football/mvp/triggers", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load the football MVP player lobby.");
    }

    const payload = (await response.json()) as FootballMvpDashboardState;
    setDashboard(payload);
  }

  async function submitEntries() {
    if (!seededEvent) {
      setErrorMessage("No seeded football event is available yet.");
      return;
    }

    if (!selectedUserId.trim()) {
      setErrorMessage("Choose or type a player id before saving picks.");
      return;
    }

    if (!winnerContest || !finalScoreContest || !squaresContest) {
      setErrorMessage("The football MVP contests are not fully loaded yet.");
      return;
    }

    setErrorMessage(null);
    setResponseSummary(null);

    const response = await fetch("/api/live/football/mvp/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: seededEvent.id,
        userId: selectedUserId.trim(),
        selections: [
          {
            contestId: winnerContest.id,
            selection: {
              teamKey: winnerPick,
            },
          },
          {
            contestId: finalScoreContest.id,
            selection: {
              homeScore: Number(predictedHomeScore),
              awayScore: Number(predictedAwayScore),
            },
          },
          {
            contestId: squaresContest.id,
            selection: {
              homeDigit: Number(squareHomeDigit),
              awayDigit: Number(squareAwayDigit),
            },
          },
        ],
      }),
    });

    const payload = (await response.json()) as {
      saved?: boolean;
      error?: string;
      savedEntries?: PlayPointEntry[];
    };

    if (!response.ok || !payload.saved) {
      setErrorMessage(payload.error ?? "Unable to save player picks.");
      return;
    }

    await refreshDashboard();
    setResponseSummary(
      `Saved ${payload.savedEntries?.length ?? 0} contest picks for ${selectedUserId.trim()}.`,
    );
  }

  return (
    <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
        <div className="grid gap-6">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-7">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
              Player event lobby
            </div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Watch the event and track your picks.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/74">
              This player view reads the same live MVP state as the host dashboard.
              It now supports saving player picks into the in-memory event state while
              still showing the trigger feed, standings, and correction-safe outcomes.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="grid gap-2 text-sm text-white/76">
                <span className="font-semibold text-white/88">Player id</span>
                <input
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  list="football-mvp-player-ids"
                  className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                  placeholder="alex"
                />
                <datalist id="football-mvp-player-ids">
                  {playerIds.map((playerId) => (
                    <option key={playerId} value={playerId} />
                  ))}
                </datalist>
              </label>
              <button
                type="button"
                onClick={() =>
                  startTransition(() => {
                    void refreshDashboard().catch((error: unknown) => {
                      setErrorMessage(
                        error instanceof Error
                          ? error.message
                          : "Unable to refresh the player lobby.",
                      );
                    });
                  })
                }
                className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
              >
                {isPending ? "Refreshing..." : "Refresh Player View"}
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Event
                </div>
                <div className="mt-2 text-sm font-semibold text-white/90">
                  {seededEvent?.title ?? "Loading event"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Your rank
                </div>
                <div className="mt-2 text-sm font-semibold text-cyan-50">
                  {playerStanding ? `#${playerStanding.rank}` : "Not ranked yet"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Your points
                </div>
                <div className="mt-2 text-sm font-semibold text-white/90">
                  {playerStanding ? `${playerStanding.pointsTotal} event points` : "Waiting"}
                </div>
              </div>
            </div>

            {responseSummary ? (
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
                {responseSummary}
              </div>
            ) : null}
            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <article className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                  Entry form
                </div>
                <h3 className="mt-3 text-2xl font-black text-white">
                  Submit or update picks
                </h3>
              </div>
              <div className="text-sm text-white/62">
                This writes winner pick, final score, and squares choices into the
                same event state the host screen reads.
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <label className="grid gap-2 text-sm text-white/76">
                  <span className="font-semibold text-white/88">Winner pick</span>
                  <select
                    value={winnerPick}
                    onChange={(event) => setWinnerPick(event.target.value)}
                    className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                  >
                    <option value="bears">Bears</option>
                    <option value="packers">Packers</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-white/76">
                  <span className="font-semibold text-white/88">Predicted Bears score</span>
                  <input
                    value={predictedHomeScore}
                    onChange={(event) => setPredictedHomeScore(event.target.value)}
                    inputMode="numeric"
                    className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                  />
                </label>
                <label className="grid gap-2 text-sm text-white/76">
                  <span className="font-semibold text-white/88">Predicted Packers score</span>
                  <input
                    value={predictedAwayScore}
                    onChange={(event) => setPredictedAwayScore(event.target.value)}
                    inputMode="numeric"
                    className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-white/76">
                  <span className="font-semibold text-white/88">Squares home digit</span>
                  <input
                    value={squareHomeDigit}
                    onChange={(event) => setSquareHomeDigit(event.target.value)}
                    inputMode="numeric"
                    className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                  />
                </label>
                <label className="grid gap-2 text-sm text-white/76">
                  <span className="font-semibold text-white/88">Squares away digit</span>
                  <input
                    value={squareAwayDigit}
                    onChange={(event) => setSquareAwayDigit(event.target.value)}
                    inputMode="numeric"
                    className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      void submitEntries().catch((error: unknown) => {
                        setErrorMessage(
                          error instanceof Error
                            ? error.message
                            : "Unable to save player picks.",
                        );
                      });
                    })
                  }
                  className="inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110"
                >
                  {isPending ? "Saving..." : "Save Picks"}
                </button>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                  Your contest cards
                </div>
                <h3 className="mt-3 text-2xl font-black text-white">
                  Picks already on the board
                </h3>
              </div>
              <div className="text-sm text-white/62">
                These cards now reflect live repository state instead of the original static seed.
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {playerEntries.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/60">
                  No contest entries are loaded for this player yet.
                </div>
              ) : (
                playerEntries.map((entry) => {
                  const contest =
                    dashboard.seededContests.find(
                      (candidate) => candidate.id === entry.contestId,
                    ) ?? null;
                  const latestResolution = latestResolutionForEntry(
                    entry.id,
                    dashboard.resolutions,
                  );

                  return (
                    <div
                      key={entry.id}
                      className="rounded-[26px] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/48">
                            {contest ? formatContestFormat(contest.formatKey) : entry.contestId}
                          </div>
                          <div className="mt-2 text-xl font-black text-white">
                            {contest?.title ?? "Contest"}
                          </div>
                        </div>
                        <div className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/72">
                          {entry.status}
                        </div>
                      </div>
                      <div className="mt-4 text-sm leading-7 text-white/76">
                        {renderSelection(entry)}
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/72">
                          Submitted {formatTimestamp(entry.submittedAt)}
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/72">
                          {latestResolution
                            ? `Latest outcome: ${latestResolution.ruleKey} · ${latestResolution.scoreDelta} points`
                            : "Waiting for settlement"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>

          <article className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
              Your settled outcomes
            </div>
            <h3 className="mt-3 text-2xl font-black text-white">Active resolution rows</h3>
            <div className="mt-5 grid gap-3">
              {activeResolutionRows.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/60">
                  No resolved rows for this player yet.
                </div>
              ) : (
                activeResolutionRows
                  .sort(
                    (left, right) =>
                      new Date(right.resolvedAt).getTime() -
                      new Date(left.resolvedAt).getTime(),
                  )
                  .map((row) => (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-black text-white">{row.ruleKey}</div>
                        <div className="text-xs text-white/50">
                          {formatTimestamp(row.resolvedAt)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        Score {row.scoreDelta} · Play Points {row.playPointsDelta} · Victory{" "}
                        {row.isVictory ? "yes" : "no"}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </article>
        </div>

        <div className="grid gap-6 xl:sticky xl:top-28">
          <article className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
                  Live leaderboard
                </div>
                <h3 className="mt-3 text-2xl font-black text-white">
                  Event standings
                </h3>
              </div>
              <Link
                href="/live/football-mvp"
                className="rounded-2xl border border-white/15 bg-white/8 px-4 py-2 text-sm font-black text-white transition hover:bg-white/12"
              >
                Host view
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {dashboard.eventStandings.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white/64">
                  Standings will appear after the host settles a trigger.
                </div>
              ) : (
                dashboard.eventStandings.map((standing) => (
                  <div
                    key={`${standing.eventId}:${standing.userId}`}
                    className={
                      standing.userId === selectedUserId
                        ? "rounded-2xl border border-cyan-300/28 bg-cyan-400/10 px-4 py-4"
                        : "rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-white">
                          #{standing.rank} {standing.userId}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                          {standing.contestVictories} contest wins · accuracy{" "}
                          {standing.accuracyAverage?.toFixed(2) ?? "0.00"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-cyan-50">
                          {standing.pointsTotal}
                        </div>
                        <div className="text-xs uppercase tracking-[0.18em] text-white/46">
                          play points {standing.playPointsTotal}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
              Trigger feed
            </div>
            <h3 className="mt-3 text-2xl font-black text-white">What the host has posted</h3>
            <div className="mt-5 grid gap-3">
              {dashboard.triggers.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">
                  No score updates yet.
                </div>
              ) : (
                [...dashboard.triggers]
                  .sort(
                    (left, right) =>
                      new Date(right.occurredAt).getTime() -
                      new Date(left.occurredAt).getTime(),
                  )
                  .map((trigger) => (
                    <div
                      key={trigger.id}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-black text-white">
                          {trigger.triggerType === "football.event_final"
                            ? "Final posted"
                            : `Period ${String(trigger.payload.period ?? "update")}`}
                        </div>
                        <div className="text-xs text-white/50">
                          {formatTimestamp(trigger.occurredAt)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        Score {String(trigger.payload.homeScore ?? "-")} -{" "}
                        {String(trigger.payload.awayScore ?? "-")} · status {trigger.status}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </article>

          <article className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
              Product direction
            </div>
            <div className="mt-4 grid gap-3 text-sm text-white/76">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                The player surface should read settled state, not infer winners from raw sports data.
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                Corrections stay trustworthy because superseded rows drop out of the active leaderboard.
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                This preview is in-memory today, but the UI shape is already aligned with the shared Play Point Core engine.
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
