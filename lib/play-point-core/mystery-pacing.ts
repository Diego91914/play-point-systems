export const BLACKWOOD_EVIDENCE_ROUNDS = 4;

/**
 * Keep Blackwood House inside the intended social-game window without starving
 * larger groups of personal investigation turns.
 *
 * 4 players -> 4 questions / evidence (16 total)
 * 5 players -> 5 questions / evidence (20 total)
 * 6-8 players -> 6 questions / evidence (24 total)
 *
 * This caps interrogation growth while preserving at least three investigator
 * turns per player across a full 4-round case at every supported player count.
 */
export function questionsPerEvidenceRound(playerCount: number) {
  if (!Number.isInteger(playerCount) || playerCount < 4 || playerCount > 8) {
    throw new Error("Blackwood House supports 4–8 players.");
  }
  return Math.min(playerCount, 6);
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
