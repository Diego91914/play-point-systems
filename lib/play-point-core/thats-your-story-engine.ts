import { randomUUID } from "node:crypto";
import { STORY_PROMPTS, type StoryEdition } from "./thats-your-story-prompts";
import { storyChoicesFor } from "./thats-your-story-choices";

export type StoryPlayer = {
  id: string;
  name: string;
  tokenHash: string;
  seat: number;
  score: number;
};
export type StorySubmission = {
  authorId: string;
  entryId: string;
  text: string;
  isOriginal: boolean;
};
export type StoryEntry = {
  id: string;
  text: string;
  normalizedText: string;
  authorIds: string[];
  originalAuthorIds: string[];
  initialVotes: number;
  additionalVotes: number;
  totalVotes: number;
  bonusEarned: boolean;
};
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
  submissions: StorySubmission[];
  entries: StoryEntry[];
  votes: Record<string, string>;
  roundPoints: Record<string, number>;
  scoringVersion?: 2;
  playAmplifiedEndedAt?: string;
};

export function normalizeStoryAnswer(text: string) {
  return text.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function isOriginalStory(text: string, choices: readonly string[]) {
  const normalized = normalizeStoryAnswer(text).replace(/[\p{P}\s]/gu, "");
  return !choices.some((choice) =>
    normalizeStoryAnswer(choice).replace(/[\p{P}\s]/gu, "") === normalized,
  );
}

export function shuffleStoryItems<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function initialStoryState(code: string, hostAccountId: string, host: StoryPlayer): StoryState {
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
    submissions: [],
    entries: [],
    votes: {},
    roundPoints: {},
    scoringVersion: 2,
  };
}

function beginRound(state: StoryState) {
  state.phase = "writing";
  state.roundId = randomUUID();
  state.submissions = [];
  state.entries = [];
  state.votes = {};
  state.roundPoints = {};
}

function finishVoting(state: StoryState) {
  if (state.phase !== "voting") throw new Error("Voting is not open.");
  const totals = state.entries.map((entry) => {
    entry.additionalVotes = Object.values(state.votes).filter((id) => id === entry.id).length;
    entry.totalVotes = entry.initialVotes + entry.additionalVotes;
    return entry.totalVotes;
  });
  const highest = Math.max(0, ...totals);
  const winners = state.entries.filter((entry) => entry.totalVotes === highest);
  const unanimous = state.submissions.length === state.players.length && state.entries.length === 1;
  const outrightWinner = !unanimous && winners.length === 1 ? winners[0] : null;
  for (const entry of state.entries) {
    entry.bonusEarned = entry.id === outrightWinner?.id && entry.originalAuthorIds.length > 0;
    const points = entry.totalVotes;
    for (const authorId of entry.authorIds) {
      const bonus = entry.bonusEarned && entry.originalAuthorIds.includes(authorId) ? 1 : 0;
      state.roundPoints[authorId] = points + bonus;
      const player = state.players.find((candidate) => candidate.id === authorId);
      if (player) player.score += points + bonus;
    }
  }
  state.phase = "reveal";
}

function openVoting(state: StoryState) {
  if (state.entries.length === 0) throw new Error("At least one answer is needed to close Phase 1.");
  state.entries = shuffleStoryItems(state.entries);
  state.phase = "voting";
  if (state.entries.length === 1) finishVoting(state);
}


/** Upgrade persisted rooms created before grouped answers and the two-vote score. */
export function upgradeStoryState(state: StoryState) {
  if (state.scoringVersion === 2) return state;
  const legacyEntries = state.entries as unknown as Array<{ id: string; authorId: string; text: string }>;
  const legacyVotes = state.votes ?? {};
  const legacyRoundPoints = state.roundPoints ?? {};
  const legacyPhase = state.phase;
  const promptIndex = state.promptOrder[state.round];
  const choices = storyChoicesFor(state.edition, promptIndex);
  const grouped = new Map<string, StoryEntry>();
  const oldToNewId = new Map<string, string>();
  const submissions: StorySubmission[] = [];

  for (const legacy of legacyEntries ?? []) {
    const normalizedText = normalizeStoryAnswer(legacy.text);
    let entry = grouped.get(normalizedText);
    if (!entry) {
      entry = {
        id: legacy.id || randomUUID(),
        text: legacy.text,
        normalizedText,
        authorIds: [],
        originalAuthorIds: [],
        initialVotes: 0,
        additionalVotes: 0,
        totalVotes: 0,
        bonusEarned: false,
      };
      grouped.set(normalizedText, entry);
    }
    oldToNewId.set(legacy.id, entry.id);
    if (!entry.authorIds.includes(legacy.authorId)) {
      const original = isOriginalStory(legacy.text, choices);
      entry.authorIds.push(legacy.authorId);
      if (original) entry.originalAuthorIds.push(legacy.authorId);
      entry.initialVotes++;
      submissions.push({ authorId: legacy.authorId, entryId: entry.id, text: legacy.text, isOriginal: original });
    }
  }

  state.entries = [...grouped.values()];
  state.submissions = submissions;
  state.votes = Object.fromEntries(
    Object.entries(legacyVotes).flatMap(([playerId, oldEntryId]) => {
      const entryId = oldToNewId.get(oldEntryId);
      return entryId ? [[playerId, entryId]] : [];
    }),
  );
  state.roundPoints = {};
  state.scoringVersion = 2;

  if (legacyPhase === "reveal" || legacyPhase === "finished") {
    for (const player of state.players) player.score -= legacyRoundPoints[player.id] ?? 0;
    state.phase = "voting";
    finishVoting(state);
    state.phase = legacyPhase;
  } else {
    state.phase = legacyPhase;
  }
  return state;
}

export function projectStory(state: StoryState, viewer: string) {
  upgradeStoryState(state);
  const reveal = state.phase === "reveal" || state.phase === "finished";
  const ownSubmission = state.submissions.find((submission) => submission.authorId === viewer);
  const entries = state.phase === "writing" || state.phase === "lobby"
    ? []
    : state.entries.map((entry) => ({
        id: entry.id,
        text: entry.text,
        ownInitial: entry.authorIds.includes(viewer),
        ...(reveal ? {
          authorIds: [...entry.authorIds],
          authors: entry.authorIds.map((id) => state.players.find((player) => player.id === id)?.name ?? "Player"),
          originalAuthorIds: [...entry.originalAuthorIds],
          originalAuthors: entry.originalAuthorIds.map((id) => state.players.find((player) => player.id === id)?.name ?? "Player"),
          initialVotes: entry.initialVotes,
          additionalVotes: entry.additionalVotes,
          totalVotes: entry.totalVotes,
          bonusEarned: entry.bonusEarned,
        } : {}),
      }));
  return {
    code: state.code,
    phase: state.phase,
    edition: state.edition,
    maxRounds: state.maxRounds,
    round: state.round,
    roundId: state.roundId,
    prompt: state.phase === "lobby" ? "" : STORY_PROMPTS[state.edition][state.promptOrder[state.round]] ?? "",
    storyChoices: state.phase === "writing" ? storyChoicesFor(state.edition, state.promptOrder[state.round]) : [],
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      seat: player.seat,
      score: player.score,
      ...(reveal ? { roundPoints: state.roundPoints[player.id] ?? 0 } : {}),
    })),
    me: { id: viewer, isHost: viewer === state.hostPlayerId },
    entries,
    ownStory: ownSubmission?.text ?? null,
    ownInitialAnswerId: ownSubmission?.entryId ?? null,
    ownVote: state.votes[viewer] ?? null,
    voteProgress: ownSubmission ? (state.votes[viewer] ? "2/2" : "1/2") : "0/2",
    submittedCount: state.submissions.length,
    votedCount: Object.keys(state.votes).length,
    eligibleVoterCount: state.submissions.length,
    roundPoints: reveal ? { ...state.roundPoints } : undefined,
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
  upgradeStoryState(state);
  if (state.playAmplifiedEndedAt) throw new Error("The host ended this session.");
  if (!state.players.some((player) => player.id === playerId)) throw new Error("Invalid player session.");
  const host = () => {
    if (state.hostPlayerId !== playerId) throw new Error("Only the host can do that.");
  };
  if (payload.roundId !== state.roundId) throw new Error("The round changed. Refresh and try again.");

  switch (action) {
    case "settings":
      host();
      if (state.phase !== "lobby") throw new Error("Settings are locked.");
      if (payload.edition !== "family" && payload.edition !== "christmas") throw new Error("Choose a valid edition.");
      if (![5, 10, 15].includes(Number(payload.maxRounds))) throw new Error("Choose 5, 10 or 15 rounds.");
      state.edition = payload.edition;
      state.maxRounds = Number(payload.maxRounds);
      return;
    case "start":
      host();
      if (state.phase !== "lobby" || state.players.length < 3) throw new Error("Start from the lobby with at least three players.");
      state.players.forEach((player) => { player.score = 0; });
      state.round = 0;
      state.promptOrder = shuffleStoryItems(STORY_PROMPTS[state.edition].map((_, index) => index)).slice(0, state.maxRounds);
      beginRound(state);
      return;
    case "submit": {
      const text = typeof payload.text === "string" ? payload.text.trim().replace(/\s+/g, " ") : "";
      const existing = state.submissions.find((submission) => submission.authorId === playerId);
      if (existing?.text === text) return false;
      if (state.phase !== "writing" || existing) throw new Error("Your Phase 1 answer is locked or submissions have closed.");
      if (!text || text.length > 240) throw new Error("Choose an answer or write one of 1–240 characters.");
      const normalizedText = normalizeStoryAnswer(text);
      let entry = state.entries.find((candidate) => candidate.normalizedText === normalizedText);
      const promptIndex = state.promptOrder[state.round];
      const choices = storyChoicesFor(state.edition, promptIndex);
      const original = isOriginalStory(text, choices);
      if (!entry) {
        entry = {
          id: randomUUID(),
          text,
          normalizedText,
          authorIds: [],
          originalAuthorIds: [],
          initialVotes: 0,
          additionalVotes: 0,
          totalVotes: 0,
          bonusEarned: false,
        };
        state.entries.push(entry);
      }
      entry.authorIds.push(playerId);
      if (original) entry.originalAuthorIds.push(playerId);
      entry.initialVotes += 1;
      state.submissions.push({ authorId: playerId, entryId: entry.id, text, isOriginal: original });
      if (state.submissions.length === state.players.length) openVoting(state);
      return;
    }
    case "open-voting":
      host();
      if (state.phase !== "writing") throw new Error("Phase 1 is not open.");
      openVoting(state);
      return;
    case "vote": {
      const entryId = typeof payload.entryId === "string" ? payload.entryId : "";
      const submission = state.submissions.find((candidate) => candidate.authorId === playerId);
      if (!submission) throw new Error("Submit a Phase 1 answer before voting.");
      if (state.votes[playerId] === entryId) return false;
      if (state.phase !== "voting" || state.votes[playerId]) throw new Error("Your second vote is locked or voting has closed.");
      const entry = state.entries.find((candidate) => candidate.id === entryId);
      if (!entry || entry.id === submission.entryId) throw new Error("Your second vote must go to a different answer.");
      state.votes[playerId] = entryId;
      if (Object.keys(state.votes).length === state.submissions.length) finishVoting(state);
      return;
    }
    case "finish-voting":
      host();
      if (state.phase !== "voting") throw new Error("Voting is not open.");
      finishVoting(state);
      return;
    case "skip":
      host();
      if (state.phase !== "writing" && state.phase !== "voting") throw new Error("This round cannot be skipped.");
      state.submissions = [];
      state.entries = [];
      state.votes = {};
      state.roundPoints = {};
      state.phase = "reveal";
      return;
    case "next":
      host();
      if (state.phase !== "reveal") throw new Error("Reveal results first.");
      if (state.round + 1 >= state.maxRounds) state.phase = "finished";
      else { state.round++; beginRound(state); }
      return;
    case "restart":
      host();
      state.phase = "lobby";
      state.round = 0;
      state.roundId = randomUUID();
      state.promptOrder = [];
      state.submissions = [];
      state.entries = [];
      state.votes = {};
      state.roundPoints = {};
      state.scoringVersion = 2;
      state.players.forEach((player) => { player.score = 0; });
      return;
    default:
      throw new Error("Unknown action.");
  }
}
