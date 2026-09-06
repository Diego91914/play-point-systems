export const TRIVIA_VENUE_PRESENCE_WINDOW_MS = 60 * 60 * 1000;
export const TRIVIA_VENUE_IDLE_MISSED_QUESTIONS = 3;

export type TriviaVenuePresenceStatus =
  | "active"
  | "idle"
  | "presence_expired"
  | "removed";

export type TriviaVenuePresenceInput = {
  nowMs: number;
  presenceExpiresAtMs: number | null;
  consecutiveQuestionsMissed: number;
  removed?: boolean;
};

export function getTriviaVenuePresenceStatus({
  nowMs,
  presenceExpiresAtMs,
  consecutiveQuestionsMissed,
  removed = false,
}: TriviaVenuePresenceInput): TriviaVenuePresenceStatus {
  if (removed) {
    return "removed";
  }

  if (presenceExpiresAtMs === null || presenceExpiresAtMs <= nowMs) {
    return "presence_expired";
  }

  if (consecutiveQuestionsMissed >= TRIVIA_VENUE_IDLE_MISSED_QUESTIONS) {
    return "idle";
  }

  return "active";
}

export function canTriviaVenuePlayerAnswer(status: TriviaVenuePresenceStatus): boolean {
  return status === "active" || status === "idle";
}

export function shouldShowTriviaVenuePlayerOnLeaderboard(
  status: TriviaVenuePresenceStatus,
): boolean {
  return status === "active";
}

export function extendTriviaVenuePresence(nowMs: number): number {
  return nowMs + TRIVIA_VENUE_PRESENCE_WINDOW_MS;
}

export function resetTriviaVenueActivityAfterAnswer() {
  return {
    consecutiveQuestionsMissed: 0,
  } as const;
}

export function recordTriviaVenueMiss(consecutiveQuestionsMissed: number): number {
  return Math.max(0, consecutiveQuestionsMissed) + 1;
}
