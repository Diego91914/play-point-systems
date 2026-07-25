export const TRIVIA_PACING_MODES = ["standard", "relaxed"] as const;

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

export function getTriviaPointsDropPerSecond(startingPoints: number, timerSeconds: number): number {
  return Math.ceil(startingPoints / timerSeconds);
}
