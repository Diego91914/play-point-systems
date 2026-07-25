export const RUNTIME_DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
export const RUNTIME_DIFFICULTY_FILTERS = ["mixed", ...RUNTIME_DIFFICULTIES] as const;
export const TRIVIA_GAME_MODES = ["individual", "teams"] as const;
export const TRIVIA_TEAMS = [
  { id: "blue", label: "Blue Team" },
  { id: "gold", label: "Gold Team" },
  { id: "red", label: "Red Team" },
  { id: "green", label: "Green Team" },
  { id: "purple", label: "Purple Team" },
  { id: "orange", label: "Orange Team" },
  { id: "teal", label: "Teal Team" },
  { id: "pink", label: "Pink Team" },
] as const;
export const MIN_TRIVIA_TEAM_COUNT = 2;
export const MAX_TRIVIA_TEAM_COUNT = TRIVIA_TEAMS.length;
export const BIBLE_CANON_POLICY = "66-book Protestant canon";
export const BIBLE_TRANSLATION_POLICY = "Question wording is translation-neutral where possible; Scripture references are citations rather than quotations from a single preferred translation.";

export type RuntimeDifficulty = (typeof RUNTIME_DIFFICULTIES)[number];
export type RuntimeDifficultyFilter = (typeof RUNTIME_DIFFICULTY_FILTERS)[number];
export type TriviaGameMode = (typeof TRIVIA_GAME_MODES)[number];
export type TriviaTeamId = (typeof TRIVIA_TEAMS)[number]["id"];
export type RuntimeChoiceSlot = "A" | "B" | "C" | "D";
export type RuntimeResponse = RuntimeChoiceSlot | "skip";
export type RuntimeScoringMode = "fixed" | "countdown";

export interface RuntimeCatalogDifficultyCounts {
  easy: number;
  medium: number;
  hard: number;
  expert: number;
}

export interface RuntimeCatalogCategorySummary {
  category: string;
  label: string;
  totalGoldTriviaCount: number;
  countsByDifficulty: RuntimeCatalogDifficultyCounts;
  availableDifficultyFilters: RuntimeDifficultyFilter[];
  isPlayable: boolean;
}

export interface RuntimeChoice {
  slot: RuntimeChoiceSlot;
  text: string;
  isCorrect: boolean;
}

export interface RuntimePublicChoice {
  slot: RuntimeChoiceSlot;
  text: string;
}

export interface RuntimeRoundScoring {
  mode: RuntimeScoringMode;
  correct: number;
  wrong: number;
  skip: number;
}

export interface RuntimeRoundBlueprint {
  roundId: string;
  label: string;
  intro: string;
  preferredDifficulties: readonly RuntimeDifficulty[];
  scoring: RuntimeRoundScoring;
}

export interface RuntimeDeckRound {
  roundId: string;
  label: string;
  intro: string;
  scoring: RuntimeRoundScoring;
  questionCount: number;
}

export interface RuntimeDeckCard {
  sourceId: string;
  category: string;
  difficulty: RuntimeDifficulty;
  prompt: string;
  choices: RuntimeChoice[];
  explanation: string;
  reference: string;
  tags: string[];
  roundId: string;
  roundLabel: string;
  roundIntro: string;
  roundIndex: number;
  questionNumberInRound: number;
  totalQuestionsInRound: number;
  totalRounds: number;
  totalQuestions: number;
  scoring: RuntimeRoundScoring;
}

export interface RuntimePublicDeckCard {
  category: string;
  difficulty: RuntimeDifficulty;
  prompt: string;
  choices: RuntimePublicChoice[];
  roundId: string;
  roundLabel: string;
  roundIntro: string;
  roundIndex: number;
  questionNumberInRound: number;
  totalQuestionsInRound: number;
  totalRounds: number;
  totalQuestions: number;
  scoring: RuntimeRoundScoring;
}

export interface RuntimeDeck {
  packTitle: string;
  category: string;
  categoryLabel: string;
  difficultyFilter: RuntimeDifficultyFilter;
  questionsAvailable: number;
  totalQuestions: number;
  rounds: RuntimeDeckRound[];
  cards: RuntimeDeckCard[];
}

export const PLAYPOINT_RUNTIME_ROUNDS: readonly RuntimeRoundBlueprint[] = [
  {
    roundId: "hook-round",
    label: "Warm-Up",
    intro: "Every correct answer is worth a fixed 500 points. Beat the clock, but take time to read carefully.",
    preferredDifficulties: ["easy", "medium"],
    scoring: {
      mode: "fixed",
      correct: 500,
      wrong: 0,
      skip: 0,
    },
  },
  {
    roundId: "pressure-board",
    label: "Pressure Board",
    intro: "Countdown scoring begins here. Faster correct answers keep more of the available 1,000 points.",
    preferredDifficulties: ["medium", "hard"],
    scoring: {
      mode: "countdown",
      correct: 1000,
      wrong: 0,
      skip: 0,
    },
  },
  {
    roundId: "spotlight-sprint",
    label: "Double Points Sprint",
    intro: "Harder questions now start at 2,000 points, with the available score falling across the clock.",
    preferredDifficulties: ["hard", "expert"],
    scoring: {
      mode: "countdown",
      correct: 2000,
      wrong: 0,
      skip: 0,
    },
  },
  {
    roundId: "final-word",
    label: "Final Word",
    intro: "The round opens with 3,000-point countdown questions, then the last question uses a private wager that can reshape the leaderboard.",
    preferredDifficulties: ["expert", "hard", "medium", "easy"],
    scoring: {
      mode: "countdown",
      correct: 3000,
      wrong: 0,
      skip: 0,
    },
  },
];

export function formatDifficultyFilterLabel(filter: RuntimeDifficultyFilter): string {
  if (filter === "mixed") {
    return "Mixed Ladder";
  }

  return `${filter.charAt(0).toUpperCase()}${filter.slice(1)} Only`;
}
