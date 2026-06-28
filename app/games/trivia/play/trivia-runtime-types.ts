export const RUNTIME_DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
export const RUNTIME_DIFFICULTY_FILTERS = ["mixed", ...RUNTIME_DIFFICULTIES] as const;

export type RuntimeDifficulty = (typeof RUNTIME_DIFFICULTIES)[number];
export type RuntimeDifficultyFilter = (typeof RUNTIME_DIFFICULTY_FILTERS)[number];
export type RuntimeChoiceSlot = "A" | "B" | "C" | "D";
export type RuntimeResponse = RuntimeChoiceSlot | "skip";

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

export interface RuntimeRoundScoring {
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
    label: "Hook Round",
    intro: "Fast opener questions teach the room the rules before the pressure climbs.",
    preferredDifficulties: ["easy", "medium"],
    scoring: {
      correct: 100,
      wrong: -25,
      skip: 0,
    },
  },
  {
    roundId: "pressure-board",
    label: "Pressure Board",
    intro: "The room knows the game now, so a bad guess starts to sting.",
    preferredDifficulties: ["medium", "hard"],
    scoring: {
      correct: 150,
      wrong: -50,
      skip: 0,
    },
  },
  {
    roundId: "spotlight-sprint",
    label: "Spotlight Sprint",
    intro: "Harder questions hit faster here and the scoreboard can move quickly.",
    preferredDifficulties: ["hard", "expert"],
    scoring: {
      correct: 225,
      wrong: -100,
      skip: 0,
    },
  },
  {
    roundId: "final-word",
    label: "Final Word",
    intro: "The last round pays big, but the wrong guess hurts even more.",
    preferredDifficulties: ["expert", "hard", "medium", "easy"],
    scoring: {
      correct: 300,
      wrong: -150,
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
