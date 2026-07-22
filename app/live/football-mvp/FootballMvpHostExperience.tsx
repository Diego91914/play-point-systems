"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
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

type VenueRewardSlot = {
  id: string;
  squareKey: string;
  rewardName: string;
  sponsorLabel: string;
  redeemHint: string;
};

type VenueProgramState = {
  revealPeriod: "Q3";
  revealStatus: "hidden" | "revealed";
  revealTriggeredAt: string | null;
  activeSquareKey: string | null;
  activePeriodLabel: string | null;
  headline: string;
  rules: string[];
  slots: VenueRewardSlot[];
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
  venueProgram: VenueProgramState;
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

type VenueProgramEditorState = {
  headline: string;
  rules: string[];
  slots: VenueRewardSlot[];
};

const DEFAULT_VENUE_EDITOR_RULE_COUNT = 3;
const DEFAULT_VENUE_EDITOR_SLOT_COUNT = 4;

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
  venueProgram: {
    revealPeriod: "Q3",
    revealStatus: "hidden",
    revealTriggeredAt: null,
    activeSquareKey: null,
    activePeriodLabel: null,
    headline: "",
    rules: [],
    slots: [],
  },
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

function createEmptyVenueRewardSlot(index: number): VenueRewardSlot {
  return {
    id: `reward-slot-${index + 1}`,
    squareKey: "",
    rewardName: "",
    sponsorLabel: "",
    redeemHint: "",
  };
}

function normalizeVenueEditorRules(rules: string[]) {
  const nextRules = rules.length > 0 ? [...rules] : [];

  while (nextRules.length < DEFAULT_VENUE_EDITOR_RULE_COUNT) {
    nextRules.push("");
  }

  return nextRules;
}

function normalizeVenueEditorSlots(slots: VenueRewardSlot[]) {
  if (slots.length === 0) {
    return Array.from(
      { length: DEFAULT_VENUE_EDITOR_SLOT_COUNT },
      (_, index) => createEmptyVenueRewardSlot(index),
    );
  }

  return slots.map((slot, index) => ({
    ...createEmptyVenueRewardSlot(index),
    ...slot,
  }));
}

const emptyVenueProgramEditorState: VenueProgramEditorState = {
  headline: "",
  rules: normalizeVenueEditorRules([]),
  slots: normalizeVenueEditorSlots([]),
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

  return `${base} - ${trigger.triggerType}`;
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
  const [venueEditor, setVenueEditor] = useState<VenueProgramEditorState>(
    emptyVenueProgramEditorState,
  );
  const [responseSummary, setResponseSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const seededEvent = dashboard.seededEvents[0] ?? null;
  const finalTriggers = dashboard.triggers.filter(
    (trigger) =>
      trigger.triggerType === "football.event_final" &&
      trigger.status !== "corrected",
  );

  const refreshDashboard = useCallback(async () => {
    const response = await fetch("/api/live/football/mvp/triggers", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load the football MVP dashboard state.");
    }

    const payload = (await response.json()) as FootballMvpDashboardState;
    setDashboard(payload);
    setVenueEditor({
      headline: payload.venueProgram.headline,
      rules: normalizeVenueEditorRules(payload.venueProgram.rules),
      slots: normalizeVenueEditorSlots(payload.venueProgram.slots),
    });

    if (payload.triggers.length > 0) {
      const latestFinalTrigger = payload.triggers.find(
        (trigger) =>
          trigger.triggerType === "football.event_final" &&
          trigger.status !== "corrected",
      );

      if (latestFinalTrigger) {
        setCorrectionForm((current) =>
          current.originalTriggerId
            ? current
            : { ...current, originalTriggerId: latestFinalTrigger.id },
        );
      }
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void refreshDashboard();
    });
  }, [refreshDashboard]);

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

  function updateVenueHeadline(value: string) {
    setVenueEditor((current) => ({
      ...current,
      headline: value,
    }));
  }

  function updateVenueRule(index: number, value: string) {
    setVenueEditor((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? value : rule,
      ),
    }));
  }

  function updateVenueSlot(
    index: number,
    key: keyof VenueRewardSlot,
    value: string,
  ) {
    setVenueEditor((current) => ({
      ...current,
      slots: current.slots.map((slot, slotIndex) =>
        slotIndex === index
          ? {
              ...slot,
              [key]: value,
            }
          : slot,
      ),
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

  async function saveVenueProgram() {
    if (!seededEvent) {
      setErrorMessage("No seeded football event is available yet.");
      return;
    }

    setErrorMessage(null);
    setResponseSummary(null);

    const response = await fetch("/api/live/football/mvp/venue-program", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: seededEvent.id,
        headline: venueEditor.headline,
        rules: venueEditor.rules,
        slots: venueEditor.slots,
      }),
    });
    const payload = (await response.json()) as {
      saved?: boolean;
      error?: string;
    };

    if (!response.ok || !payload.saved) {
      setErrorMessage(payload.error ?? "Unable to save the venue reward setup.");
      return;
    }

    await refreshDashboard();
    setResponseSummary("Saved tonight's hidden rewards for the venue game.");
  }

  return (
    <section className="border-t border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <div className="-order-3 rounded-[30px] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(111,182,255,0.14),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              Venue Control
            </div>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              Keep the room engaged and the staff flow clean.
            </h2>
            <p className="hidden">
              This side is for staff. Run the reward board, post the score,
              trigger suspense around the Q3 reveal, and keep redemption simple when a guest wins.
            </p>
            <div className="hidden">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Game
                </div>
                <div className="mt-2 text-sm font-semibold text-white/90">
                  {seededEvent?.title ?? "Loading seeded event"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Guest game
                </div>
                <div className="mt-2 text-sm font-semibold text-white/90">
                  3 quick picks per player
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Hidden rewards
                </div>
                <div className="mt-2 text-sm font-semibold text-white/90">
                  {dashboard.venueProgram.slots.length} square reveals tonight
                </div>
              </div>
            </div>
            <div className="hidden">
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
                Prototype storage {dashboard.storageMode ?? "json"}
              </div>
              {dashboard.requestedStorageMode &&
              dashboard.requestedStorageMode !== dashboard.storageMode ? (
                <div className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-amber-50">
                  Unknown demo mode &quot;{dashboard.requestedStorageMode}&quot; fell back to JSON
                </div>
              ) : null}
            </div>
            {dashboard.storageNotice ? (
              <div className="hidden">
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
                Refresh Game State
              </button>
              <Link
                href="/live"
                className="inline-flex rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black text-white transition hover:bg-white/12"
              >
                Back to Live
              </Link>
            </div>
            <div className="hidden">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/76">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Step 1
                </div>
                <div className="mt-2 font-semibold text-white">Program the reward squares</div>
                <div className="mt-1">Choose which score endings unlock prizes and what the bar gives away.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/76">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Step 2
                </div>
                <div className="mt-2 font-semibold text-white">Let guests make 3 picks</div>
                <div className="mt-1">They pick the winner, the final score, and a lucky square.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/76">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Step 3
                </div>
                <div className="mt-2 font-semibold text-white">Post scores through the game</div>
                <div className="mt-1">Quarter updates keep the square board moving and the room engaged.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/76 md:col-span-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Step 4
                </div>
                <div className="mt-2 font-semibold text-white">Reveal in Q3 and redeem fast</div>
                <div className="mt-1">The Q3 score post reveals the hidden square prizes, and staff can honor winners right at the bar.</div>
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

          <article className="rounded-[28px] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                  Venue reward board
                </div>
                <h3 className="mt-3 text-2xl font-black text-white">3rd quarter reward reveal</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                  {dashboard.venueProgram.headline}
                </p>
              </div>
              <div
                className={
                  dashboard.venueProgram.revealStatus === "revealed"
                    ? "rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50"
                    : "rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-50"
                }
              >
                {dashboard.venueProgram.revealStatus === "revealed"
                  ? `Revealed ${formatTimestamp(dashboard.venueProgram.revealTriggeredAt)}`
                  : "Hidden until Q3"}
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {dashboard.venueProgram.rules.map((rule, index) => (
                <div
                  key={`${index}-${rule}`}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/74"
                >
                  {rule}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/74">
              {dashboard.venueProgram.activeSquareKey ? (
                <>
                  Live square: <span className="font-black text-white">{dashboard.venueProgram.activeSquareKey}</span>
                  {" "}from{" "}
                  <span className="font-black text-white">
                    {dashboard.venueProgram.activePeriodLabel ?? "latest score"}
                  </span>
                </>
              ) : (
                "No live square yet. Post the first score update to start the suspense."
              )}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {dashboard.venueProgram.slots.map((slot) => {
                const isActive = slot.squareKey === dashboard.venueProgram.activeSquareKey;
                const isRevealed = dashboard.venueProgram.revealStatus === "revealed";

                return (
                  <div
                    key={slot.id}
                    className={
                      isActive
                        ? "rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-4"
                        : "rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                    }
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                      Square {slot.squareKey}
                    </div>
                    <div className="mt-2 text-lg font-black text-white">
                      {isRevealed ? slot.rewardName : "Hidden reward"}
                    </div>
                    <div className="mt-2 text-sm text-white/68">
                      {isRevealed ? slot.sponsorLabel : "Reveal this in the 3rd quarter to keep people in the room."}
                    </div>
                    <div className="mt-3 text-xs text-white/54">
                      {isRevealed ? slot.redeemHint : "Players stay to see what this square becomes."}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="-order-1 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                  Venue setup
                </div>
                <h3 className="mt-3 text-2xl font-black text-white">1. Program tonight&apos;s hidden rewards</h3>
              </div>
              <div className="max-w-xl text-sm text-white/62">
                Each square below is a secret reward card. Guests only see the square now.
                The reward text is revealed when the venue posts the Q3 score update.
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-cyan-300/18 bg-cyan-400/10 px-4 py-4 text-sm text-cyan-50">
                Use score endings like <span className="font-black">4-0</span> or <span className="font-black">7-3</span>.
                Example rewards: free draft beer, free appetizer, house shot, or a tab discount.
              </div>
              <label className="grid gap-2 text-sm text-white/74">
                <span className="font-semibold text-white/86">Reveal headline</span>
                <input
                  value={venueEditor.headline}
                  onChange={(event) => updateVenueHeadline(event.target.value)}
                  className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                />
              </label>
              <div className="grid gap-4 lg:grid-cols-3">
                {venueEditor.rules.map((rule, index) => (
                  <label key={`rule-${index}`} className="grid gap-2 text-sm text-white/74">
                    <span className="font-semibold text-white/86">Rule {index + 1}</span>
                    <input
                      value={rule}
                      onChange={(event) => updateVenueRule(index, event.target.value)}
                      className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                    />
                  </label>
                ))}
              </div>
              <div className="grid gap-4">
                {venueEditor.slots.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                      Hidden reward slot {index + 1}
                    </div>
                    <div className="mt-4 grid gap-4 xl:grid-cols-4">
                      <label className="grid gap-2 text-sm text-white/74">
                        <span className="font-semibold text-white/86">Square</span>
                        <input
                          value={slot.squareKey}
                          onChange={(event) =>
                            updateVenueSlot(index, "squareKey", event.target.value)
                          }
                          className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-white/74">
                        <span className="font-semibold text-white/86">Reward</span>
                        <input
                          value={slot.rewardName}
                          onChange={(event) =>
                            updateVenueSlot(index, "rewardName", event.target.value)
                          }
                          placeholder="Free draft beer"
                          className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-white/74">
                        <span className="font-semibold text-white/86">Bar message</span>
                        <input
                          value={slot.sponsorLabel}
                          onChange={(event) =>
                            updateVenueSlot(index, "sponsorLabel", event.target.value)
                          }
                          placeholder="Halftime draft special"
                          className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-white/74">
                        <span className="font-semibold text-white/86">Redeem instruction</span>
                        <input
                          value={slot.redeemHint}
                          onChange={(event) =>
                            updateVenueSlot(index, "redeemHint", event.target.value)
                          }
                          placeholder="Show the winning screen at the bar"
                          className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => {
                      void saveVenueProgram().catch((error: unknown) => {
                        setErrorMessage(
                          error instanceof Error
                            ? error.message
                            : "Unable to save the venue reward board.",
                        );
                      });
                    })
                  }
                  className="inline-flex rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? "Saving..." : "Save Hidden Rewards"}
                </button>
              </div>
            </div>
          </article>

          <div className="-order-2 grid gap-6 xl:grid-cols-2">
            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                Staff action
              </div>
              <h3 className="mt-3 text-2xl font-black text-white">2. Post score updates</h3>
              <p className="mt-3 text-sm leading-7 text-white/68">
                Quarter posts move the square board. The Q3 post also reveals tonight&apos;s hidden rewards.
              </p>
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
                  <span>Score this update right away instead of only storing it.</span>
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
                  {isPending ? "Posting..." : "Post Score Update"}
                </button>
              </div>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                Safety valve
              </div>
              <h3 className="mt-3 text-2xl font-black text-white">3. Fix a wrong final if needed</h3>
              <p className="mt-3 text-sm leading-7 text-white/68">
                Choose the final you want to replace, enter the corrected score, and save it.
              </p>
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
                        {formatTimestamp(trigger.occurredAt)} - {trigger.id}
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
                    Leaderboard
                  </div>
                  <h3 className="mt-3 text-2xl font-black text-white">Current event standings</h3>
                </div>
                <div className="text-sm text-white/62">
                  This updates after each settled score post or correction.
                </div>
              </div>
            <div className="mt-5 grid gap-3">
              {dashboard.eventStandings.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/60">
                  No scores have settled yet. Post a score update to start the leaderboard.
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
                        Accuracy {standing.accuracyAverage?.toFixed(2) ?? "0.00"} - Contest
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
              Posted scores
            </div>
            <h3 className="mt-3 text-2xl font-black text-white">Score update history</h3>
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
                            {formatTimestamp(trigger.occurredAt)} - {trigger.id}
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
                        {trigger.payload.period ? ` - ${String(trigger.payload.period)}` : ""}
                      </div>
                      {String(trigger.payload.period ?? "").toUpperCase() === "Q3" ? (
                        <div className="mt-2 text-xs text-cyan-100/80">
                          This post unlocks the venue reward reveal.
                        </div>
                      ) : null}
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
              Scoring results
            </div>
            <h3 className="mt-3 text-2xl font-black text-white">Per-pick results</h3>
            <div className="mt-5 grid gap-3">
              {dashboard.resolutions.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/60">
                  No scoring results yet.
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
                          {row.userId} - {row.ruleKey}
                        </div>
                        <div className="text-xs text-white/52">
                          {row.supersededByResolutionId ? "Superseded" : "Active"}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        Score {row.scoreDelta} - Play Points {row.playPointsDelta} - Victory{" "}
                        {row.isVictory ? "yes" : "no"}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
              Season totals
            </div>
            <h3 className="mt-3 text-2xl font-black text-white">Running season standings</h3>
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
                      Play Points {standing.playPointsTotal} - Wins {standing.wins}
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
