export type QuickScoreGameId =
  | "BOCCE_OFFICIAL"
  | "CORNHOLE"
  | "PICKLEBALL"
  | "HORSESHOES"
  | "WASHERS"
  | "LADDER_GOLF"
  | "KANJAM"
  | "SPIKEBALL"
  | "BEER_PONG"
  | "GENERIC_POINTS";

export type QuickScoreCompetitor = {
  id: string;
  name: string;
};

export type QuickScoreHistoryEntry = {
  id: string;
  timestamp: string;
  gameId: QuickScoreGameId;
  competitorId: string;
  competitorName: string;
  previousScore: number;
  newScore: number;
  pointsAdded: number;
};

export type QuickScoreWinRule =
  | {
      type: "FIRST_TO_TARGET";
      targetScore: number;
    }
  | {
      type: "WIN_BY_TWO";
      targetScore: number;
      winBy: number;
    };

export type QuickScoreGameConfig = {
  id: QuickScoreGameId;
  name: string;
  sportLabel: string;
  targetScore: number;
  pointOptions: number[];
  winRule: QuickScoreWinRule;
  minCompetitors: number;
  maxCompetitors: number;
  competitorNoun: "Team" | "Player";
  suggestedNames: string[];
};

export type QuickScoreSessionContext = {
  clubId?: string | null;
  eventId?: string | null;
  matchId?: string | null;
  participantMap?: Array<{
    slotId: string;
    clubParticipantId: string;
    displayName: string;
  }>;
};

export type QuickScoreSession = {
  gameId: QuickScoreGameId;
  gameName: string;
  createdAt: string;
  updatedAt: string;
  competitors: QuickScoreCompetitor[];
  scores: Record<string, number>;
  history: QuickScoreHistoryEntry[];
  status: "IN_PROGRESS" | "COMPLETE";
  winnerCompetitorId: string | null;
  config: QuickScoreGameConfig;
  context?: QuickScoreSessionContext;
};

export const QUICK_SCORE_GAMES: QuickScoreGameConfig[] = [
  {
    id: "BOCCE_OFFICIAL",
    name: "Bocce (Official)",
    sportLabel: "Pallino scoring",
    targetScore: 12,
    pointOptions: [1, 2, 3, 4],
    winRule: { type: "FIRST_TO_TARGET", targetScore: 12 },
    minCompetitors: 2,
    maxCompetitors: 2,
    competitorNoun: "Team",
    suggestedNames: ["Team 1", "Team 2"],
  },
  {
    id: "CORNHOLE",
    name: "Cornhole",
    sportLabel: "Bag toss",
    targetScore: 21,
    pointOptions: [0, 1, 2, 3, 4],
    winRule: { type: "FIRST_TO_TARGET", targetScore: 21 },
    minCompetitors: 2,
    maxCompetitors: 2,
    competitorNoun: "Team",
    suggestedNames: ["Team 1", "Team 2"],
  },
  {
    id: "PICKLEBALL",
    name: "Pickleball",
    sportLabel: "Rally scoring",
    targetScore: 11,
    pointOptions: [1],
    winRule: { type: "WIN_BY_TWO", targetScore: 11, winBy: 2 },
    minCompetitors: 2,
    maxCompetitors: 2,
    competitorNoun: "Team",
    suggestedNames: ["Team 1", "Team 2"],
  },
  {
    id: "HORSESHOES",
    name: "Horseshoes",
    sportLabel: "Classic backyard match",
    targetScore: 21,
    pointOptions: [0, 1, 2, 3, 6],
    winRule: { type: "FIRST_TO_TARGET", targetScore: 21 },
    minCompetitors: 2,
    maxCompetitors: 2,
    competitorNoun: "Team",
    suggestedNames: ["Team 1", "Team 2"],
  },
  {
    id: "WASHERS",
    name: "Washers",
    sportLabel: "Box toss",
    targetScore: 21,
    pointOptions: [0, 1, 3, 5],
    winRule: { type: "FIRST_TO_TARGET", targetScore: 21 },
    minCompetitors: 2,
    maxCompetitors: 2,
    competitorNoun: "Team",
    suggestedNames: ["Team 1", "Team 2"],
  },
  {
    id: "LADDER_GOLF",
    name: "Ladder Golf",
    sportLabel: "Bolo ladder",
    targetScore: 21,
    pointOptions: [0, 1, 2, 3],
    winRule: { type: "FIRST_TO_TARGET", targetScore: 21 },
    minCompetitors: 2,
    maxCompetitors: 2,
    competitorNoun: "Team",
    suggestedNames: ["Team 1", "Team 2"],
  },
  {
    id: "KANJAM",
    name: "KanJam",
    sportLabel: "Disc yard game",
    targetScore: 21,
    pointOptions: [0, 1, 2, 3],
    winRule: { type: "FIRST_TO_TARGET", targetScore: 21 },
    minCompetitors: 2,
    maxCompetitors: 2,
    competitorNoun: "Team",
    suggestedNames: ["Team 1", "Team 2"],
  },
  {
    id: "SPIKEBALL",
    name: "Spikeball",
    sportLabel: "Rally game",
    targetScore: 21,
    pointOptions: [1],
    winRule: { type: "WIN_BY_TWO", targetScore: 21, winBy: 2 },
    minCompetitors: 2,
    maxCompetitors: 2,
    competitorNoun: "Team",
    suggestedNames: ["Team 1", "Team 2"],
  },
  {
    id: "BEER_PONG",
    name: "Beer Pong",
    sportLabel: "Cup battle",
    targetScore: 10,
    pointOptions: [1, 2],
    winRule: { type: "FIRST_TO_TARGET", targetScore: 10 },
    minCompetitors: 2,
    maxCompetitors: 2,
    competitorNoun: "Team",
    suggestedNames: ["Team 1", "Team 2"],
  },
  {
    id: "GENERIC_POINTS",
    name: "Generic Points",
    sportLabel: "Anything with a score",
    targetScore: 21,
    pointOptions: [1, 2, 3, 5],
    winRule: { type: "FIRST_TO_TARGET", targetScore: 21 },
    minCompetitors: 2,
    maxCompetitors: 4,
    competitorNoun: "Player",
    suggestedNames: ["Player 1", "Player 2", "Player 3", "Player 4"],
  },
];

export const QUICK_SCORE_GAME_MAP = Object.fromEntries(
  QUICK_SCORE_GAMES.map((game) => [game.id, game] as const)
) as Record<QuickScoreGameId, QuickScoreGameConfig>;

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

export function getQuickScoreGameConfig(gameId: QuickScoreGameId): QuickScoreGameConfig {
  return QUICK_SCORE_GAME_MAP[gameId];
}

export function createQuickScoreSession(args: {
  gameId: QuickScoreGameId;
  competitorNames: string[];
  targetScore?: number;
  pointOptions?: number[];
  timestamp?: string;
  context?: QuickScoreSessionContext;
}): QuickScoreSession {
  const baseConfig = getQuickScoreGameConfig(args.gameId);
  const competitorNames = args.competitorNames.map((name) => name.trim()).filter((name) => name.length > 0);

  if (competitorNames.length < baseConfig.minCompetitors || competitorNames.length > baseConfig.maxCompetitors) {
    throw new Error(`Choose between ${baseConfig.minCompetitors} and ${baseConfig.maxCompetitors} ${baseConfig.competitorNoun.toLowerCase()}s.`);
  }

  const targetScore = Math.max(1, Math.floor(args.targetScore ?? baseConfig.targetScore));
  const pointOptions = normalizePointOptions(args.pointOptions ?? baseConfig.pointOptions);
  const config = buildSessionConfig(baseConfig, targetScore, pointOptions);
  const timestamp = args.timestamp ?? new Date().toISOString();
  const competitors = competitorNames.map((name) => ({
    id: makeId("qs-competitor"),
    name,
  }));

  return {
    gameId: config.id,
    gameName: config.name,
    createdAt: timestamp,
    updatedAt: timestamp,
    competitors,
    scores: Object.fromEntries(competitors.map((competitor) => [competitor.id, 0])),
    history: [],
    status: "IN_PROGRESS",
    winnerCompetitorId: null,
    config,
    ...(args.context ? { context: args.context } : {}),
  };
}

function buildSessionConfig(
  config: QuickScoreGameConfig,
  targetScore: number,
  pointOptions: number[]
): QuickScoreGameConfig {
  if (config.winRule.type === "WIN_BY_TWO") {
    return {
      ...config,
      targetScore,
      pointOptions,
      winRule: {
        ...config.winRule,
        targetScore,
      },
    };
  }

  return {
    ...config,
    targetScore,
    pointOptions,
    winRule: {
      ...config.winRule,
      targetScore,
    },
  };
}

export function normalizePointOptions(pointOptions: number[]): number[] {
  const cleaned = pointOptions
    .map((value) => Math.max(0, Math.floor(value)))
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((left, right) => left - right);

  return cleaned.length > 0 ? cleaned : [1];
}

export function applyQuickScorePoints(
  session: QuickScoreSession,
  competitorId: string,
  pointsAdded: number,
  timestamp = new Date().toISOString()
): QuickScoreSession {
  if (session.status === "COMPLETE") {
    throw new Error("This Quick Score game is already complete.");
  }

  if (!session.config.pointOptions.includes(pointsAdded)) {
    throw new Error("That scoring button is not enabled for this game.");
  }

  const competitor = session.competitors.find((entry) => entry.id === competitorId);
  if (!competitor) {
    throw new Error("Quick Score competitor not found.");
  }

  const previousScore = session.scores[competitorId] ?? 0;
  const newScore = previousScore + pointsAdded;
  const nextHistoryEntry: QuickScoreHistoryEntry = {
    id: makeId("qs-play"),
    timestamp,
    gameId: session.gameId,
    competitorId,
    competitorName: competitor.name,
    previousScore,
    newScore,
    pointsAdded,
  };

  const next: QuickScoreSession = {
    ...session,
    updatedAt: timestamp,
    scores: {
      ...session.scores,
      [competitorId]: newScore,
    },
    history: [...session.history, nextHistoryEntry],
  };

  const winnerCompetitorId = resolveQuickScoreWinner(next);
  if (winnerCompetitorId) {
    next.status = "COMPLETE";
    next.winnerCompetitorId = winnerCompetitorId;
  }

  return next;
}

export function undoQuickScorePlay(session: QuickScoreSession): QuickScoreSession {
  const lastEntry = session.history[session.history.length - 1];
  if (!lastEntry) return session;

  const nextHistory = session.history.slice(0, -1);
  const nextScores = {
    ...session.scores,
    [lastEntry.competitorId]: lastEntry.previousScore,
  };

  return {
    ...session,
    updatedAt: new Date().toISOString(),
    history: nextHistory,
    scores: nextScores,
    status: "IN_PROGRESS",
    winnerCompetitorId: null,
  };
}

export function resolveQuickScoreWinner(session: QuickScoreSession): string | null {
  if (session.competitors.length < 1) return null;

  if (session.config.winRule.type === "FIRST_TO_TARGET") {
    const target = session.config.winRule.targetScore;
    return (
      session.competitors.find((competitor) => (session.scores[competitor.id] ?? 0) >= target)?.id ?? null
    );
  }

  const target = session.config.winRule.targetScore;
  const winBy = session.config.winRule.winBy;

  const sorted = [...session.competitors].sort(
    (left, right) => (session.scores[right.id] ?? 0) - (session.scores[left.id] ?? 0)
  );
  const leader = sorted[0];
  const runnerUp = sorted[1];
  if (!leader) return null;

  const leaderScore = session.scores[leader.id] ?? 0;
  const runnerUpScore = runnerUp ? session.scores[runnerUp.id] ?? 0 : 0;
  return leaderScore >= target && leaderScore - runnerUpScore >= winBy ? leader.id : null;
}

export function getQuickScoreLastPlay(session: QuickScoreSession): QuickScoreHistoryEntry | null {
  return session.history[session.history.length - 1] ?? null;
}

export function getQuickScorePreviousScoreLabel(session: QuickScoreSession): string {
  const lastPlay = getQuickScoreLastPlay(session);
  if (!lastPlay) return "No previous score yet";

  const previousScores = { ...session.scores, [lastPlay.competitorId]: lastPlay.previousScore };
  return session.competitors
    .map((competitor) => `${competitor.name} ${previousScores[competitor.id] ?? 0}`)
    .join(" - ");
}

export function getQuickScoreCurrentScoreLabel(session: QuickScoreSession): string {
  return session.competitors
    .map((competitor) => `${competitor.name} ${session.scores[competitor.id] ?? 0}`)
    .join(" - ");
}
