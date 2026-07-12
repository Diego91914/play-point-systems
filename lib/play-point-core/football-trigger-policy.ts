import type {
  PlayPointContest,
  PlayPointTrigger,
  TriggerPolicy,
  TriggerValidationResult,
} from "./runtime-contracts";

interface FootballResultPayload extends Record<string, unknown> {
  homeTeamKey: string;
  awayTeamKey: string;
  homeScore: number;
  awayScore: number;
  period?: string;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizePayload(payload: Record<string, unknown>): FootballResultPayload | null {
  const homeTeamKey =
    typeof payload.homeTeamKey === "string" ? payload.homeTeamKey.trim() : null;
  const awayTeamKey =
    typeof payload.awayTeamKey === "string" ? payload.awayTeamKey.trim() : null;
  const homeScore = payload.homeScore;
  const awayScore = payload.awayScore;

  if (!homeTeamKey || !awayTeamKey) {
    return null;
  }

  if (!isFiniteNumber(homeScore) || !isFiniteNumber(awayScore)) {
    return null;
  }

  return {
    homeTeamKey,
    awayTeamKey,
    homeScore: Math.trunc(homeScore),
    awayScore: Math.trunc(awayScore),
    period: typeof payload.period === "string" ? payload.period.trim() : undefined,
  };
}

export class FootballResultTriggerPolicy implements TriggerPolicy {
  validate(
    contest: PlayPointContest,
    trigger: PlayPointTrigger,
  ): TriggerValidationResult {
    const errors: string[] = [];

    if (
      contest.formatKey !== "winner_pick" &&
      contest.formatKey !== "final_score" &&
      contest.formatKey !== "football_squares"
    ) {
      errors.push(
        `Contest "${contest.id}" is not configured for a football result trigger.`,
      );
    }

    const normalizedPayload = normalizePayload(trigger.payload);

    if (!normalizedPayload) {
      errors.push(
        "Football result triggers require homeTeamKey, awayTeamKey, homeScore, and awayScore.",
      );
    }

    const expectedTriggerTypes = [
      ...(typeof contest.config.expectedTriggerType === "string"
        ? [contest.config.expectedTriggerType]
        : []),
      ...(Array.isArray(contest.config.expectedTriggerTypes)
        ? contest.config.expectedTriggerTypes.filter(
            (value): value is string => typeof value === "string",
          )
        : []),
    ];

    if (
      expectedTriggerTypes.length > 0 &&
      !expectedTriggerTypes.includes(trigger.triggerType)
    ) {
      errors.push(
        `Trigger type "${trigger.triggerType}" does not match contest expectations "${expectedTriggerTypes.join(", ")}".`,
      );
    }

    if (
      trigger.triggerType === "football.period_ended" &&
      (!normalizedPayload?.period || normalizedPayload.period.length === 0)
    ) {
      errors.push("Football period-ended triggers require a period value.");
    }

    return {
      accepted: errors.length === 0,
      errors,
      normalizedPayload: normalizedPayload ?? undefined,
    };
  }
}
