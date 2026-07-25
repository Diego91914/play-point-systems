export const TRIVIA_STREAK_BONUS_STEP = 100;
export const TRIVIA_STREAK_BONUS_CAP = 500;

export function calculateTriviaStreakBonus(nextStreak: number, isFinalWagerQuestion = false) {
  if (isFinalWagerQuestion || nextStreak < 2) {
    return 0;
  }

  return Math.min((nextStreak - 1) * TRIVIA_STREAK_BONUS_STEP, TRIVIA_STREAK_BONUS_CAP);
}

export function formatTriviaStreakRule() {
  return `Consecutive correct answers earn +${TRIVIA_STREAK_BONUS_STEP} more streak points each time, capped at +${TRIVIA_STREAK_BONUS_CAP}.`;
}
