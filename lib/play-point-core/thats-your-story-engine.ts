import { randomUUID } from "node:crypto";
import { STORY_PROMPTS, type StoryEdition } from "./thats-your-story-prompts";

export type StoryPlayer = {
  id: string;
  name: string;
  tokenHash: string;
  seat: number;
  score: number;
};
export type StoryEntry = { id: string; authorId: string; text: string };
export type StoryState = {
  code: string;
  hostPlayerId: string;
  hostAccountId: string;
  players: StoryPlayer[];
  phase: "lobby" | "writing" | "voting" | "reveal" | "finished";
  edition: StoryEdition;
  maxRounds: number;
  round: number;
  roundId: string;
  promptOrder: number[];
  entries: StoryEntry[];
  votes: Record<string, string>;
  roundPoints: Record<string, number>;
  playAmplifiedEndedAt?: string;
};
export function shuffleStoryItems<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function initialStoryState(
  code: string,
  hostAccountId: string,
  host: StoryPlayer,
): StoryState {
  return {
    code,
    hostAccountId,
    hostPlayerId: host.id,
    players: [host],
    phase: "lobby",
    edition: "family",
    maxRounds: 5,
    round: 0,
    roundId: randomUUID(),
    promptOrder: [],
    entries: [],
    votes: {},
    roundPoints: {},
  };
}
function beginRound(state: StoryState) {
  state.phase = "writing";
  state.roundId = randomUUID();
  state.entries = [];
  state.votes = {};
  state.roundPoints = {};
}
function openVoting(state: StoryState) {
  if (state.entries.length < 2)
    throw new Error("At least two stories are needed to vote.");
  state.entries = shuffleStoryItems(state.entries);
  state.phase = "voting";
}
function finishVoting(state: StoryState) {
  if (state.phase !== "voting") throw new Error("Voting is not open.");
  for (const entry of state.entries) {
    const points = Object.values(state.votes).filter(
      (id) => id === entry.id,
    ).length;
    state.roundPoints[entry.authorId] = points;
    const author = state.players.find((p) => p.id === entry.authorId);
    if (author) author.score += points;
  }
  state.phase = "reveal";
}
export function projectStory(state: StoryState, viewer: string) {
  const reveal = state.phase === "reveal" || state.phase === "finished";
  const own = state.entries.find((e) => e.authorId === viewer);
  const entries =
    state.phase === "writing"
      ? []
      : state.phase === "lobby"
        ? []
        : state.entries.map((e) => ({
            id: e.id,
            text: e.text,
            own: e.authorId === viewer,
            ...(reveal
              ? {
                  authorId: e.authorId,
                  points: state.roundPoints[e.authorId] ?? 0,
                }
              : {}),
          }));
  return {
    code: state.code,
    phase: state.phase,
    edition: state.edition,
    maxRounds: state.maxRounds,
    round: state.round,
    roundId: state.roundId,
    prompt:
      state.phase === "lobby"
        ? ""
        : (STORY_PROMPTS[state.edition][state.promptOrder[state.round]] ?? ""),
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      seat: p.seat,
      score: p.score,
    })),
    me: { id: viewer, isHost: viewer === state.hostPlayerId },
    entries,
    ownStory: own?.text ?? null,
    ownVote: state.votes[viewer] ?? null,
    submittedCount: state.entries.length,
    votedCount: Object.keys(state.votes).length,
    ended: Boolean(state.playAmplifiedEndedAt),
  };
}
export type StoryView = ReturnType<typeof projectStory>;
export function applyStoryAction(
  state: StoryState,
  playerId: string,
  action: string,
  payload: Record<string, unknown> = {},
) {
  if (state.playAmplifiedEndedAt)
    throw new Error("The host ended this session.");
  if (!state.players.some((p) => p.id === playerId))
    throw new Error("Invalid player session.");
  const host = () => {
    if (state.hostPlayerId !== playerId)
      throw new Error("Only the host can do that.");
  };
  if (payload.roundId !== state.roundId)
    throw new Error("The round changed. Refresh and try again.");
  switch (action) {
    case "settings":
      host();
      if (state.phase !== "lobby") throw new Error("Settings are locked.");
      if (payload.edition !== "family" && payload.edition !== "christmas")
        throw new Error("Choose a valid edition.");
      if (![5, 10, 15].includes(Number(payload.maxRounds)))
        throw new Error("Choose 5, 10 or 15 rounds.");
      state.edition = payload.edition;
      state.maxRounds = Number(payload.maxRounds);
      return;
    case "start":
      host();
      if (state.phase !== "lobby" || state.players.length < 3)
        throw new Error("Start from the lobby with at least three players.");
      state.players.forEach((p) => (p.score = 0));
      state.round = 0;
      state.promptOrder = shuffleStoryItems(
        STORY_PROMPTS[state.edition].map((_, i) => i),
      ).slice(0, state.maxRounds);
      beginRound(state);
      return;
    case "submit": {
      const text = typeof payload.text === "string" ? payload.text.trim() : "";
      const previous = state.entries.find((e) => e.authorId === playerId);
      if (previous?.text === text) return false; // Safe retry after a lost response.
      if (state.phase !== "writing" || previous)
        throw new Error("Your story is locked or writing has closed.");
      if (!text || text.length > 240)
        throw new Error("Write a story of 1–240 characters.");
      state.entries.push({ id: randomUUID(), authorId: playerId, text });
      if (state.entries.length === state.players.length) openVoting(state);
      return;
    }
    case "open-voting":
      host();
      if (state.phase !== "writing") throw new Error("Writing is not open.");
      openVoting(state);
      return;
    case "vote": {
      const id = typeof payload.entryId === "string" ? payload.entryId : "";
      if (state.votes[playerId] === id) return false;
      if (state.phase !== "voting" || state.votes[playerId])
        throw new Error("Your vote is locked or voting has closed.");
      const entry = state.entries.find((e) => e.id === id);
      if (!entry || entry.authorId === playerId)
        throw new Error("Vote for another player's story.");
      state.votes[playerId] = id;
      if (Object.keys(state.votes).length === state.players.length)
        finishVoting(state);
      return;
    }
    case "finish-voting":
      host();
      if (!Object.keys(state.votes).length)
        throw new Error("At least one vote is needed.");
      finishVoting(state);
      return;
    case "skip":
      host();
      if (state.phase !== "writing" && state.phase !== "voting")
        throw new Error("This round cannot be skipped.");
      state.entries = [];
      state.votes = {};
      state.roundPoints = {};
      state.phase = "reveal";
      return;
    case "next":
      host();
      if (state.phase !== "reveal") throw new Error("Reveal results first.");
      if (state.round + 1 >= state.maxRounds) state.phase = "finished";
      else {
        state.round++;
        beginRound(state);
      }
      return;
    case "restart":
      host();
      state.phase = "lobby";
      state.round = 0;
      state.roundId = randomUUID();
      state.promptOrder = [];
      state.entries = [];
      state.votes = {};
      state.roundPoints = {};
      state.players.forEach((p) => (p.score = 0));
      return;
    default:
      throw new Error("Unknown action.");
  }
}
