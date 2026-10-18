export type GameHostingMode = "shared-room" | "game-engine";

/** Games that create a shared Play Amplified room before play begins. */
export const SHARED_ROOM_GAME_IDS: ReadonlySet<string> = new Set([
  "chain-reaction",
  "how-close",
  "on-my-list",
  "all-about-you",
  "inside-man",
  "phone-holdem",
  "live-craps",
  "last-call",
  "play-point-trivia",
]);

export function getGameHostingMode(gameId: string): GameHostingMode {
  return SHARED_ROOM_GAME_IDS.has(gameId) ? "shared-room" : "game-engine";
}
