import type { PlayPointEvent, PlayPointTrigger } from "./runtime-contracts";

export interface FootballVenueRewardSlot {
  id: string;
  squareKey: string;
  rewardName: string;
  sponsorLabel: string;
  redeemHint: string;
}

export interface FootballVenueProgramConfig {
  revealPeriod: "Q3";
  headline: string;
  rules: string[];
  slots: FootballVenueRewardSlot[];
}

export interface FootballVenueProgramState extends FootballVenueProgramConfig {
  revealStatus: "hidden" | "revealed";
  revealTriggeredAt: string | null;
  activeSquareKey: string | null;
  activePeriodLabel: string | null;
}

const DEFAULT_VENUE_REWARD_SLOTS: FootballVenueRewardSlot[] = [
  {
    id: "reward-square-4-0",
    squareKey: "4-0",
    rewardName: "Free draft beer",
    sponsorLabel: "Halftime house draft",
    redeemHint: "Show your winning screen to the bartender before the 4th quarter.",
  },
  {
    id: "reward-square-7-3",
    squareKey: "7-3",
    rewardName: "Free appetizer",
    sponsorLabel: "Kitchen feature reward",
    redeemHint: "Redeem one appetizer for the table while the game is live.",
  },
  {
    id: "reward-square-1-7",
    squareKey: "1-7",
    rewardName: "House shot",
    sponsorLabel: "3rd quarter sponsor pour",
    redeemHint: "Claim at the bar during the game.",
  },
  {
    id: "reward-square-0-0",
    squareKey: "0-0",
    rewardName: "20% off tab",
    sponsorLabel: "Featured venue reward",
    redeemHint: "Valid for in-venue redemption tonight only.",
  },
];

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function readRewardSlot(value: unknown, index: number): FootballVenueRewardSlot | null {
  const slot = readRecord(value);
  const squareKey =
    typeof slot.squareKey === "string" && slot.squareKey.trim().length > 0
      ? slot.squareKey.trim()
      : null;
  const rewardName =
    typeof slot.rewardName === "string" && slot.rewardName.trim().length > 0
      ? slot.rewardName.trim()
      : null;

  if (!squareKey || !rewardName) {
    return null;
  }

  return {
    id:
      typeof slot.id === "string" && slot.id.trim().length > 0
        ? slot.id.trim()
        : `reward-slot-${index + 1}`,
    squareKey,
    rewardName,
    sponsorLabel:
      typeof slot.sponsorLabel === "string" ? slot.sponsorLabel.trim() : "",
    redeemHint:
      typeof slot.redeemHint === "string" ? slot.redeemHint.trim() : "",
  };
}

export function createDefaultFootballVenueProgramConfig(): FootballVenueProgramConfig {
  return {
    revealPeriod: "Q3",
    headline:
      "Stay through the 3rd quarter to reveal which live squares unlock tonight's venue rewards.",
    rules: [
      "Players join before kickoff and save their picks for the game.",
      "Featured reward squares stay hidden until a Q3 or final score update is posted.",
      "Show the winning screen at the bar to redeem while the game is still live.",
    ],
    slots: DEFAULT_VENUE_REWARD_SLOTS.map((slot) => ({ ...slot })),
  };
}

export function readFootballVenueProgramConfig(
  event: Pick<PlayPointEvent, "metadata"> | null | undefined,
): FootballVenueProgramConfig {
  const defaults = createDefaultFootballVenueProgramConfig();
  const metadata = readRecord(event?.metadata);
  const rawProgram = readRecord(metadata.venueProgram);
  const slots = Array.isArray(rawProgram.slots)
    ? rawProgram.slots
        .map((slot, index) => readRewardSlot(slot, index))
        .filter((slot): slot is FootballVenueRewardSlot => slot !== null)
    : [];
  const rules = readStringArray(rawProgram.rules);

  return {
    revealPeriod: "Q3",
    headline:
      typeof rawProgram.headline === "string" && rawProgram.headline.trim().length > 0
        ? rawProgram.headline.trim()
        : defaults.headline,
    rules: rules.length > 0 ? rules : defaults.rules,
    slots: slots.length > 0 ? slots : defaults.slots,
  };
}

export function applyFootballVenueProgramConfig(
  event: PlayPointEvent,
  config: FootballVenueProgramConfig,
): Record<string, unknown> {
  return {
    ...(event.metadata ?? {}),
    venueProgram: {
      revealPeriod: config.revealPeriod,
      headline: config.headline,
      rules: config.rules,
      slots: config.slots,
    },
  };
}

function readPeriodLabel(trigger: PlayPointTrigger): string | null {
  if (trigger.triggerType === "football.event_final") {
    return "FINAL";
  }

  return typeof trigger.payload.period === "string"
    ? trigger.payload.period.trim().toUpperCase()
    : null;
}

function readSquareKey(trigger: PlayPointTrigger): string | null {
  const homeScore = trigger.payload.homeScore;
  const awayScore = trigger.payload.awayScore;

  if (
    typeof homeScore !== "number" ||
    !Number.isFinite(homeScore) ||
    typeof awayScore !== "number" ||
    !Number.isFinite(awayScore)
  ) {
    return null;
  }

  return `${Math.abs(Math.trunc(homeScore)) % 10}-${Math.abs(Math.trunc(awayScore)) % 10}`;
}

function isRevealTrigger(trigger: PlayPointTrigger, revealPeriod: "Q3"): boolean {
  if (trigger.status === "corrected" || trigger.status === "rejected") {
    return false;
  }

  const periodLabel = readPeriodLabel(trigger);
  return periodLabel === revealPeriod || periodLabel === "FINAL";
}

function isVisibleTrigger(trigger: PlayPointTrigger): boolean {
  return trigger.status !== "corrected" && trigger.status !== "rejected";
}

export function buildFootballVenueProgramState(args: {
  event: Pick<PlayPointEvent, "metadata"> | null | undefined;
  triggers: PlayPointTrigger[];
}): FootballVenueProgramState {
  const config = readFootballVenueProgramConfig(args.event);
  const orderedVisibleTriggers = [...args.triggers]
    .filter(isVisibleTrigger)
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
  const revealTrigger =
    orderedVisibleTriggers.find((trigger) =>
      isRevealTrigger(trigger, config.revealPeriod),
    ) ?? null;
  const latestScoreTrigger =
    orderedVisibleTriggers.find(
      (trigger) =>
        typeof trigger.payload.homeScore === "number" &&
        typeof trigger.payload.awayScore === "number",
    ) ?? null;

  return {
    ...config,
    revealStatus: revealTrigger ? "revealed" : "hidden",
    revealTriggeredAt: revealTrigger?.occurredAt ?? null,
    activeSquareKey: latestScoreTrigger ? readSquareKey(latestScoreTrigger) : null,
    activePeriodLabel: latestScoreTrigger ? readPeriodLabel(latestScoreTrigger) : null,
  };
}
