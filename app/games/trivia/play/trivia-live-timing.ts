import type { RuntimeRoundScoring, RuntimeScoringMode } from "./trivia-runtime-types";

export const TRIVIA_PACING_MODES = ["standard", "relaxed"] as const;
export const TRIVIA_QUESTION_COUNTDOWN_SECONDS = 3;

export type TriviaPacingMode = (typeof TRIVIA_PACING_MODES)[number];

export const TRIVIA_PACING_OPTIONS: Record<TriviaPacingMode, {
  label: string;
  description: string;
  timerSeconds: number;
}> = {
  standard: {
    label: "Standard",
    description: "10 seconds per question for a quick competitive game.",
    timerSeconds: 10,
  },
  relaxed: {
    label: "Relaxed",
    description: "20 seconds per question for longer prompts and accessibility needs.",
    timerSeconds: 20,
  },
};

export function getTriviaTimerSeconds(pacingMode: TriviaPacingMode): number {
  return TRIVIA_PACING_OPTIONS[pacingMode].timerSeconds;
}

export function getTriviaQuestionStartCountdown(questionOpensAtMs: number | null, nowMs: number) {
  if (questionOpensAtMs === null) {
    return 0;
  }

  return Math.max(0, Math.ceil((questionOpensAtMs - nowMs) / 1000));
}

export function calculateTriviaAvailablePoints(
  startingPoints: number,
  responseTimeMs: number | null,
  timerSeconds: number,
): number {
  const timerMs = timerSeconds * 1000;
  const clampedResponseMs = Math.max(0, Math.min(responseTimeMs ?? timerMs, timerMs));
  const elapsedSeconds = Math.floor(clampedResponseMs / 1000);
  const pointsDropPerSecond = Math.ceil(startingPoints / timerSeconds);

  return Math.max(0, startingPoints - elapsedSeconds * pointsDropPerSecond);
}

export function calculateTriviaCorrectPoints(
  startingPoints: number,
  responseTimeMs: number | null,
  timerSeconds: number,
  scoringMode: RuntimeScoringMode | undefined,
): number {
  if (scoringMode === "fixed") {
    return startingPoints;
  }

  return calculateTriviaAvailablePoints(startingPoints, responseTimeMs, timerSeconds);
}

export function getTriviaPointsDropPerSecond(startingPoints: number, timerSeconds: number): number {
  return Math.ceil(startingPoints / timerSeconds);
}

export function getTriviaCountdownProgress(elapsedMs: number, timerSeconds: number): number {
  const timerMs = Math.max(timerSeconds, 1) * 1000;
  return Math.max(0, Math.min(100, 100 - (Math.max(0, elapsedMs) / timerMs) * 100));
}

export function formatTriviaScoringSummary(scoring: RuntimeRoundScoring, timerSeconds: number): string {
  const points = new Intl.NumberFormat("en-US").format(scoring.correct);

  if (scoring.mode === "fixed") {
    return `${points} fixed points for every correct answer`;
  }

  return `up to ${points} points, dropping ${getTriviaPointsDropPerSecond(scoring.correct, timerSeconds)} each second`;
}
