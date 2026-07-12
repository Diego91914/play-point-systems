"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type {
  EventStanding,
  PlayPointContest,
  PlayPointEntry,
  PlayPointEvent,
  PlayPointTrigger,
  ResolutionRow,
  SeasonStanding,
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
  storageMode?: "json" | "postgres";
  requestedStorageMode?: string | null;
  persistencePath?: string | null;
  storageNotice?: string | null;
  triggers: PlayPointTrigger[];
  resolutions: ResolutionRow[];
  rewards: unknown[];
  eventStandings: EventStanding[];
  seasonStandings: SeasonStanding[];
  notifications: NotificationEvent[];
};

type ScoreFormState = {
  triggerType: "football.period_ended" | "football.event_final";
  period: "Q1" | "Q2" | "Q3" | "FINAL";
  homeScore: string;
  awayScore: string;
  settle: boolean;
};

type CorrectionFormState = {
  originalTriggerId: string;
  homeScore: string;
  awayScore: string;
  reason: string;
};

const emptyDashboardState: FootballMvpDashboardState = {
  seededEvents: [],
  seededContests: [],
  seededEntries: [],
  storageMode: "json",
  requestedStorageMode: null,
  persistencePath: null,
  storageNotice: null,
  triggers: [],
  resolutions: [],
  rewards: [],
  eventStandings: [],
  seasonStandings: [],
  notifications: [],
};

const initialScoreForm: ScoreFormState = {
  triggerType: "football.period_ended",
  period: "Q1",
  homeScore: "7",
  awayScore: "0",
  settle: true,
};

const initialCorrectionForm: CorrectionFormState = {
  originalTriggerId: "",
  homeScore: "24",
  awayScore: "20",
  reason: "Manual host correction",
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

function formatTriggerLabel(trigger: PlayPointTrigger) {
  const base =
    trigger.triggerType === "football.period_ended"
      ? String(trigger.payload.period ?? "PERIOD").toUpperCase()
      : "FINAL";

  return `${base} · ${trigger.triggerType}`;
}

function statusTone(status: PlayPointTrigger["status"]) {
  if (status === "processed") {
    return "border-emerald-300/25 bg-emerald-400/10 text-emerald-50";
  }

  if (status === "corrected") {
    return "border-amber-300/25 bg-amber-400/10 text-amber-50";
  }

  if (status === "accepted") {
    return "border-cyan-300/25 bg-cyan-400/10 text-cyan-50";
  }

  return "border-white/12 bg-white/8 text-white/72";
}

export function FootballMvpHostExperience() {
  const [dashboard, setDashboard] = useState<FootballMvpDashboardState>(
    emptyDashboardState,
  );
  const [scoreForm, setScoreForm] = useState<ScoreFormState>(initialScoreForm);
  const [correctionForm, setCorrectionForm] =
    useState<CorrectionFormState>(initialCorrectionForm);
  const [responseSummary, setResponseSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const seededEvent = dashboard.seededEvents[0] ?? null;
  const finalTriggers = dashboard.triggers.filter(
    (trigger) =>
      trigger.triggerType === "football.event_final" &&
      trigger.status !== "corrected",
  );

  useEffect(() => {
    startTransition(() => {
      void refreshDashboard();
    });
  }, []);

  async function refreshDashboard() {
    const response = await fetch("/api/live/football/mvp/triggers", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load the football MVP dashboard state.");
    }

    const payload = (await response.json()) as FootballMvpDashboardState;
    setDashboard(payload);

    if (!correctionForm.originalTriggerId && payload.triggers.length > 0) {
      const latestFinalTrigger = payload.triggers.find(
        (trigger) =>
          trigger.triggerType === "football.event_final" &&
          trigger.status !== "corrected",
      );

      if (latestFinalTrigger) {
        setCorrectionForm((current) => ({
          ...current,
          originalTriggerId: latestFinalTrigger.id,
        }));
      }
    }
  }

  function updateScoreField<K extends keyof ScoreFormState>(
    key: K,
    value: ScoreFormState[K],
  ) {
    setScoreForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateCorrectionField<K extends keyof CorrectionFormState>(
    key: K,
    value: CorrectionFormState[K],
  ) {
    setCorrectionForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submitScore() {
    if (!seededEvent) {
      setErrorMessage("No seeded football event is available yet.");
      return;
    }

    setErrorMessage(null);
    setResponseSummary(null);

    const triggerType =
      scoreForm.period === "FINAL" ? "football.event_final" : scoreForm.triggerType;

    const response = await fetch("/api/live/football/mvp/triggers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: seededEvent.id,
        triggerType,
        sourceMode: "manual",
        settle: scoreForm.settle,
        payload: {
          period: scoreForm.period,
          homeTeamKey: "bears",
          awayTeamKey: "packers",
          homeScore: Number(scoreForm.homeScore),
          awayScore: Number(scoreForm.awayScore),
        },
      }),
    });

    const payload = (await response.json()) as {
      accepted?: boolean;
      settled?: boolean;
      trigger?: PlayPointTrigger;
      batches?: Array<{ contest: PlayPointContest; resolutions: ResolutionRow[] }>;
      errors?: string[];
      error?: string;
    };

    if (!response.ok || !payload.accepted) {
      setErrorMessage(
        payload.error ?? payload.errors?.join(" ") ?? "Unable to submit score trigger.",
      );
      return;
    }

    await refreshDashboard();
    setResponseSummary(
      payload.settled
        ? `Settled ${payload.batches?.length ?? 0} contest batch${
            (payload.batches?.length ?? 0) === 1 ? "" : "es"
          } from the ${scoreForm.period} score update.`
        : "Accepted the trigger without settling it.",
    );
  }

  async function submitCorrection() {
    if (!seededEvent) {
      setErrorMessage("No seeded football event is available yet.");
      return;
    }

    if (!correctionForm.originalTriggerId) {
      setErrorMessage("Choose a final trigger to correct first.");
      return;
    }

    setErrorMessage(null);
    setResponseSummary(null);

    const response = await fetch("/api/live/football/mvp/triggers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: seededEvent.id,
        triggerType: "football.event_final",
        sourceMode: "manual",
        correctionOfTriggerId: correctionForm.originalTriggerId,
        correctionReason: correctionForm.reason,
        correctedByUserId: "host-1",
        payload: {
          homeTeamKey: "bears",
          awayTeamKey: "packers",
          homeScore: Number(correctionForm.homeScore),
          awayScore: Number(correctionForm.awayScore),
        },
      }),
    });

    const payload = (await response.json()) as {
      accepted?: boolean;
      corrected?: boolean;
      correction?: {
        replacementTriggerId: string;
      };
      error?: string;
    };

    if (!response.ok || !payload.accepted) {
      setErrorMessage(payload.error ?? "Unable to correct the selected trigger.");
      return;
    }

    await refreshDashboard();
    setResponseSummary(
      `Corrected trigger ${correctionForm.originalTriggerId} with replacement ${payload.correction?.replacementTriggerId ?? "replacement"}.`,
    );
  }

  return (
    <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <div className="rounded-[30px] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(111,182,255,0.14),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              Football MVP host preview
            </div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Run the scoring loop from one screen.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
              This is the first thin host surface for Play Point Live. It talks to
              the football MVP runtime, so you can submit quarter or final triggers,
              settle contests, inspect standings, and correct a bad final.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Event
                </div>
                <div className="mt-2 text-sm font-semibold text-white/90">
                  {seededEvent?.title ?? "Loading seeded event"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Contests
                </div>
                <div className="mt-2 text-sm font-semibold text-white/90">
                  {dashboard.seededContests.length} active in the MVP seed
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Players
                </div>
                <div className="mt-2 text-sm font-semibold text-white/90">
                  {new Set(dashboard.seededEntries.map((entry) => entry.userId)).size} seeded
                  entries
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/58">
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
                Storage mode {dashboard.storageMode ?? "json"}
              </div>
              {dashboard.persistencePath ? (
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
                  JSON store {dashboard.persistencePath}
                </div>
              ) : null}
              {dashboard.requestedStorageMode &&
              dashboard.requestedStorageMode !== dashboard.storageMode ? (
                <div className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-amber-50">
                  Unknown env mode "{dashboard.requestedStorageMode}" fell back to
                  JSON
                </div>
              ) : null}
            </div>
            {dashboard.storageNotice ? (
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
                {dashboard.storageNotice}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  startTransition(() => {
                    void refreshDashboard().catch((error: unknown) => {
                      setErrorMessage(
                        error instanceof Error
                          ? error.message
                          : "Unable to refresh dashboard state.",
                      );
                    });
                  })
                }
                className="inline-flex rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
              >
                Refresh MVP State
              </button>
              <Link
                href="/live"
                className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12"
              >
                Back to Live Architecture
              </Link>
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

          <div className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                Trigger scoring
              </div>
              <h3 className="mt-3 text-2xl font-black text-white">Quarter or final update</h3>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm text-white/74">
                  <span className="font-semibold text-white/86">Scoring moment</span>
                  <select
                    value={scoreForm.period}
                    onChange={(event) => {
                      const nextPeriod = event.target.value as ScoreFormState["period"];
                      updateScoreField("period", nextPeriod);
                      updateScoreField(
                        "triggerType",
                        nextPeriod === "FINAL"
                          ? "football.event_final"
                          : "football.period_ended",
                      );
                    }}
                    className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                  >
                    <option value="Q1">End of Q1</option>
                    <option value="Q2">End of Q2</option>
                    <option value="Q3">End of Q3</option>
                    <option value="FINAL">Final</option>
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-white/74">
                    <span className="font-semibold text-white/86">Bears score</span>
                    <input
                      value={scoreForm.homeScore}
                      onChange={(event) => updateScoreField("homeScore", event.target.value)}
                      inputMode="numeric"
                      className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-white/74">
                    <span className="font-semibold text-white/86">Packers score</span>
                    <input
                      value={scoreForm.awayScore}
                      onChange={(event) => updateScoreField("awayScore", event.target.value)}
                      inputMode="numeric"
                      className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                    />
                  </label>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/78">
                  <input
                    type="checkbox"
                    checked={scoreForm.settle}
                    onChange={(event) => updateScoreField("settle", event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/20 text-cyan-300"
                  />
                  <span>Settle contests immediately instead of storing the trigger only.</span>
                </label>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => {
                      void submitScore().catch((error: unknown) => {
                        setErrorMessage(
                          error instanceof Error
                            ? error.message
                            : "Unable to submit the score trigger.",
                        );
                      });
                    })
                  }
                  className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? "Submitting..." : "Submit Score Trigger"}
                </button>
              </div>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                Correction flow
              </div>
              <h3 className="mt-3 text-2xl font-black text-white">Replace a bad final</h3>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm text-white/74">
                  <span className="font-semibold text-white/86">Final trigger to correct</span>
                  <select
                    value={correctionForm.originalTriggerId}
                    onChange={(event) =>
                      updateCorrectionField("originalTriggerId", event.target.value)
                    }
                    className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                  >
                    <option value="">Choose a processed final trigger</option>
                    {finalTriggers.map((trigger) => (
                      <option key={trigger.id} value={trigger.id}>
                        {formatTimestamp(trigger.occurredAt)} · {trigger.id}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-white/74">
                    <span className="font-semibold text-white/86">Corrected Bears score</span>
                    <input
                      value={correctionForm.homeScore}
                      onChange={(event) =>
                        updateCorrectionField("homeScore", event.target.value)
                      }
                      inputMode="numeric"
                      className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-white/74">
                    <span className="font-semibold text-white/86">Corrected Packers score</span>
                    <input
                      value={correctionForm.awayScore}
                      onChange={(event) =>
                        updateCorrectionField("awayScore", event.target.value)
                      }
                      inputMode="numeric"
                      className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm text-white/74">
                  <span className="font-semibold text-white/86">Reason</span>
                  <input
                    value={correctionForm.reason}
                    onChange={(event) => updateCorrectionField("reason", event.target.value)}
                    className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                  />
                </label>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => {
                      void submitCorrection().catch((error: unknown) => {
                        setErrorMessage(
                          error instanceof Error
                            ? error.message
                            : "Unable to correct the selected trigger.",
                        );
                      });
                    })
                  }
                  className="inline-flex items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-50 transition hover:bg-amber-400/16 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? "Correcting..." : "Apply Correction"}
                </button>
              </div>
            </article>
          </div>

          <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                  Live standings
                </div>
                <h3 className="mt-3 text-2xl font-black text-white">Event leaderboard</h3>
              </div>
              <div className="text-sm text-white/62">
                Rebuilt from resolution rows after every settlement or correction.
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {dashboard.eventStandings.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/60">
                  No settled standings yet. Submit a score trigger to start the board.
                </div>
              ) : (
                dashboard.eventStandings.map((standing) => (
                  <div
                    key={`${standing.eventId}:${standing.userId}`}
                    className="grid gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 sm:grid-cols-[auto_1fr_auto_auto]"
                  >
                    <div className="text-2xl font-black text-cyan-50">#{standing.rank}</div>
                    <div>
                      <div className="text-base font-black text-white">{standing.userId}</div>
                      <div className="mt-1 text-sm text-white/60">
                        Accuracy {standing.accuracyAverage?.toFixed(2) ?? "0.00"} · Contest
                        wins {standing.contestVictories}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                        Event points
                      </div>
                      <div className="mt-1 text-lg font-black text-white">
                        {standing.pointsTotal}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                        Play Points
                      </div>
                      <div className="mt-1 text-lg font-black text-cyan-50">
                        {standing.playPointsTotal}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
              Trigger log
            </div>
            <h3 className="mt-3 text-2xl font-black text-white">Recent host actions</h3>
            <div className="mt-5 grid gap-3">
              {dashboard.triggers.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/60">
                  No triggers captured yet.
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
                      className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-white">
                            {formatTriggerLabel(trigger)}
                          </div>
                          <div className="mt-1 text-xs text-white/52">
                            {formatTimestamp(trigger.occurredAt)} · {trigger.id}
                          </div>
                        </div>
                        <div
                          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${statusTone(trigger.status)}`}
                        >
                          {trigger.status}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-white/70">
                        Score {String(trigger.payload.homeScore ?? "-")} -{" "}
                        {String(trigger.payload.awayScore ?? "-")}
                        {trigger.payload.period ? ` · ${String(trigger.payload.period)}` : ""}
                      </div>
                      {trigger.correctionOfTriggerId ? (
                        <div className="mt-2 text-xs text-amber-100/75">
                          Correction of {trigger.correctionOfTriggerId}
                        </div>
                      ) : null}
                    </div>
                  ))
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
              Contest outcomes
            </div>
            <h3 className="mt-3 text-2xl font-black text-white">Resolution rows</h3>
            <div className="mt-5 grid gap-3">
              {dashboard.resolutions.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/60">
                  No resolution rows yet.
                </div>
              ) : (
                [...dashboard.resolutions]
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
                        <div className="text-sm font-black text-white">
                          {row.userId} · {row.ruleKey}
                        </div>
                        <div className="text-xs text-white/52">
                          {row.supersededByResolutionId ? "Superseded" : "Active"}
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

          <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
              Season view
            </div>
            <h3 className="mt-3 text-2xl font-black text-white">Season standings</h3>
            <div className="mt-5 grid gap-3">
              {dashboard.seasonStandings.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/60">
                  No season totals yet.
                </div>
              ) : (
                dashboard.seasonStandings.map((standing) => (
                  <div
                    key={`${standing.seasonId}:${standing.userId}`}
                    className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-base font-black text-white">
                        #{standing.rank} {standing.userId}
                      </div>
                      <div className="text-sm text-cyan-50">
                        {standing.pointsTotal} season points
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-white/70">
                      Play Points {standing.playPointsTotal} · Wins {standing.wins}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
