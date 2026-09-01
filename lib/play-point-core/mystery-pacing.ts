export const BLACKWOOD_EVIDENCE_ROUNDS = 4;

/**
 * Blackwood House is paced around a satisfying investigation, not a hard
 * 20–30 minute stopwatch. Every player receives one investigator turn during
 * each evidence round, so larger tables naturally create a longer mystery.
 *
 * 4 players -> 4 questions / evidence (16 total)
 * 5 players -> 5 questions / evidence (20 total)
 * 6 players -> 6 questions / evidence (24 total)
 * 7 players -> 7 questions / evidence (28 total)
 * 8 players -> 8 questions / evidence (32 total)
 *
 * The additional turns should become more valuable as evidence develops:
 * stronger evidence-gated questions, follow-ups, reopened contradictions, and
 * personal investigative avenues rather than repetitive generic questioning.
 */
export function questionsPerEvidenceRound(playerCount: number) {
  if (!Number.isInteger(playerCount) || playerCount < 4 || playerCount > 8) {
    throw new Error("Blackwood House supports 4–8 players.");
  }
  return playerCount;
}

export function totalInvestigationQuestions(playerCount: number, evidenceRounds = BLACKWOOD_EVIDENCE_ROUNDS) {
  return questionsPerEvidenceRound(playerCount) * evidenceRounds;
}

export function minimumInvestigatorTurnsPerPlayer(playerCount: number, evidenceRounds = BLACKWOOD_EVIDENCE_ROUNDS) {
  return Math.floor(totalInvestigationQuestions(playerCount, evidenceRounds) / playerCount);
}

export function investigationTurnDistribution(playerCount: number, evidenceRounds = BLACKWOOD_EVIDENCE_ROUNDS) {
  const total = totalInvestigationQuestions(playerCount, evidenceRounds);
  const base = Math.floor(total / playerCount);
  const extra = total % playerCount;
  return Array.from({ length: playerCount }, (_, seat) => base + (seat < extra ? 1 : 0));
}
