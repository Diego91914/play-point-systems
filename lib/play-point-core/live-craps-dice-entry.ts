export type LiveCrapsDieFace = 1 | 2 | 3 | 4 | 5 | 6;

export type LiveCrapsDiceEntry = {
  shooterId: string;
  die1: LiveCrapsDieFace | null;
  die2: LiveCrapsDieFace | null;
  confirmed: boolean;
};

export function createLiveCrapsDiceEntry(shooterId: string): LiveCrapsDiceEntry {
  if (!shooterId) throw new Error("Shooter is required for dice entry.");
  return { shooterId, die1: null, die2: null, confirmed: false };
}

function assertDieFace(face: number): asserts face is LiveCrapsDieFace {
  if (!Number.isInteger(face) || face < 1 || face > 6) throw new Error("Die face must be 1 through 6.");
}

export function selectLiveCrapsDie(entry: LiveCrapsDiceEntry, die: 1 | 2, face: number): LiveCrapsDiceEntry {
  if (entry.confirmed) throw new Error("Confirmed dice cannot be changed.");
  assertDieFace(face);
  return die === 1 ? { ...entry, die1: face } : { ...entry, die2: face };
}

export function getLiveCrapsEnteredTotal(entry: LiveCrapsDiceEntry): number | null {
  if (entry.die1 === null || entry.die2 === null) return null;
  return entry.die1 + entry.die2;
}

export function isLiveCrapsHardway(entry: LiveCrapsDiceEntry): boolean {
  return entry.die1 !== null && entry.die2 !== null && entry.die1 === entry.die2 && [4, 6, 8, 10].includes(entry.die1 + entry.die2);
}

export function confirmLiveCrapsDiceEntry(entry: LiveCrapsDiceEntry, playerId: string): LiveCrapsDiceEntry {
  if (entry.shooterId !== playerId) throw new Error("Only the current shooter may confirm the dice.");
  if (entry.die1 === null || entry.die2 === null) throw new Error("Select both physical dice before confirming the roll.");
  return { ...entry, confirmed: true };
}
