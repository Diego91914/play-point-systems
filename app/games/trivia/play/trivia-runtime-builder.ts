import { createHash, createHmac, randomBytes } from "node:crypto";
import catalogData from "./trivia-runtime-catalog.json";
import {
  PLAYPOINT_RUNTIME_ROUNDS,
  RUNTIME_DIFFICULTIES,
  type RuntimeCatalogCategorySummary,
  type RuntimeChoice,
  type RuntimeChoiceSlot,
  type RuntimeDeck,
  type RuntimeDeckCard,
  type RuntimeDeckRound,
  type RuntimeDifficulty,
  type RuntimeDifficultyFilter,
} from "./trivia-runtime-types";

const CHOICE_SLOTS: readonly RuntimeChoiceSlot[] = ["A", "B", "C", "D"];
const MAX_RUNTIME_QUESTIONS = 12;
const RANDOM_DOMAIN = "play-point-trivia-runtime-v1";
const UINT32_RANGE = 0x1_0000_0000;

export type RuntimeDeckBuildOptions = {
  seed?: string;
  excludedSourceIds?: readonly string[];
};

class SeededCryptoRandom {
  private readonly key: Buffer;
  private block = Buffer.alloc(0);
  private blockOffset = 0;
  private counter = 0;

  constructor(seed: string) {
    this.key = createHash("sha256").update(`${RANDOM_DOMAIN}:${seed}`, "utf8").digest();
  }

  private nextUint32() {
    if (this.blockOffset + 4 > this.block.length) {
      this.block = createHmac("sha256", this.key)
        .update(`${RANDOM_DOMAIN}:${this.counter}`, "utf8")
        .digest();
      this.blockOffset = 0;
      this.counter += 1;
    }

    const value = this.block.readUInt32BE(this.blockOffset);
    this.blockOffset += 4;
    return value;
  }

  integer(maxExclusive: number) {
    if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > UINT32_RANGE) {
      throw new Error("The seeded random range must be a positive 32-bit integer.");
    }

    const unbiasedLimit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
    let value = this.nextUint32();

    while (value >= unbiasedLimit) {
      value = this.nextUint32();
    }

    return value % maxExclusive;
  }
}

function shuffleWithSeed<T>(values: readonly T[], random: SeededCryptoRandom): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = random.integer(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

interface SourceCatalogRecord {
  id: string;
  category: string;
  difficulty: RuntimeDifficulty;
  question: string;
  answer: string;
  choices: string[];
  explanation: string;
  reference: string;
  tags: string[];
}

interface SourceCatalogCategory {
  category: string;
  label: string;
  totalGoldTriviaCount: number;
  countsByDifficulty: Record<RuntimeDifficulty, number>;
  records: SourceCatalogRecord[];
}

interface SourceCatalog {
  generatedAt: string;
  sourceReviewStatus: "gold";
  categories: SourceCatalogCategory[];
}

const runtimeCatalog = catalogData as SourceCatalog;

function compareDifficulty(left: RuntimeDifficulty, right: RuntimeDifficulty): number {
  return RUNTIME_DIFFICULTIES.indexOf(left) - RUNTIME_DIFFICULTIES.indexOf(right);
}

function removeFirstMatchingRecord(
  records: SourceCatalogRecord[],
  matcher: (record: SourceCatalogRecord) => boolean,
): SourceCatalogRecord | null {
  const index = records.findIndex(matcher);

  if (index === -1) {
    return null;
  }

  const [record] = records.splice(index, 1);
  return record ?? null;
}

function buildRoundQuestionCounts(totalQuestions: number, roundCount: number): number[] {
  const baseQuestionCount = Math.floor(totalQuestions / roundCount);
  const remainder = totalQuestions % roundCount;

  return Array.from({ length: roundCount }, (_, index) => baseQuestionCount + (index < remainder ? 1 : 0));
}

function buildChoices(record: SourceCatalogRecord, random: SeededCryptoRandom): RuntimeChoice[] {
  const choices = record.choices.slice(0, CHOICE_SLOTS.length).map((text) => ({
    text,
    isCorrect: text === record.answer,
  }));

  if (choices.filter((choice) => choice.isCorrect).length !== 1) {
    throw new Error(`Trivia record "${record.id}" must contain exactly one matching correct choice.`);
  }

  return shuffleWithSeed(choices, random).map((choice, index) => ({
    slot: CHOICE_SLOTS[index],
    ...choice,
  }));
}

function getCategoryOrThrow(category: string): SourceCatalogCategory {
  const foundCategory = runtimeCatalog.categories.find((candidate) => candidate.category === category);

  if (!foundCategory) {
    throw new Error(`Unknown trivia category "${category}".`);
  }

  return foundCategory;
}

function getFilteredRecords(
  category: SourceCatalogCategory,
  difficultyFilter: RuntimeDifficultyFilter,
): SourceCatalogRecord[] {
  return [...category.records]
    .filter((record) => difficultyFilter === "mixed" || record.difficulty === difficultyFilter)
    .sort((left, right) => {
      const difficultyComparison = compareDifficulty(left.difficulty, right.difficulty);

      if (difficultyComparison !== 0) {
        return difficultyComparison;
      }

      return left.id.localeCompare(right.id);
    });
}

export function listRuntimeCatalogCategories(): RuntimeCatalogCategorySummary[] {
  return runtimeCatalog.categories.map((category) => {
    const availableDifficultyFilters: RuntimeDifficultyFilter[] = [];

    if (category.totalGoldTriviaCount > 0) {
      availableDifficultyFilters.push("mixed");
    }

    RUNTIME_DIFFICULTIES.forEach((difficulty) => {
      if (category.countsByDifficulty[difficulty] > 0) {
        availableDifficultyFilters.push(difficulty);
      }
    });

    return {
      category: category.category,
      label: category.label,
      totalGoldTriviaCount: category.totalGoldTriviaCount,
      countsByDifficulty: category.countsByDifficulty,
      availableDifficultyFilters,
      isPlayable: category.totalGoldTriviaCount > 0,
    };
  });
}

export function buildRuntimeDeck(
  categoryKey: string,
  difficultyFilter: RuntimeDifficultyFilter,
  options: RuntimeDeckBuildOptions = {},
): RuntimeDeck {
  const category = getCategoryOrThrow(categoryKey);
  const seed = options.seed ?? randomBytes(32).toString("hex");
  const random = new SeededCryptoRandom(seed);
  const excludedSourceIds = new Set(options.excludedSourceIds ?? []);
  const shuffledRecords = shuffleWithSeed(getFilteredRecords(category, difficultyFilter), random);
  const filteredRecords = [
    ...shuffledRecords.filter((record) => !excludedSourceIds.has(record.id)),
    ...shuffledRecords.filter((record) => excludedSourceIds.has(record.id)),
  ];

  if (filteredRecords.length === 0) {
    throw new Error(`No Gold trivia records are available for ${category.label} with the selected difficulty filter.`);
  }

  const totalQuestions = Math.min(filteredRecords.length, MAX_RUNTIME_QUESTIONS);
  const roundCount = Math.min(totalQuestions, PLAYPOINT_RUNTIME_ROUNDS.length);
  const rounds = PLAYPOINT_RUNTIME_ROUNDS.slice(0, roundCount);
  const questionCounts = buildRoundQuestionCounts(totalQuestions, roundCount);
  const remainingRecords = [...filteredRecords];
  const deckRounds: RuntimeDeckRound[] = rounds.map((round, index) => ({
    roundId: round.roundId,
    label: round.label,
    intro: round.intro,
    scoring: round.scoring,
    questionCount: questionCounts[index],
  }));
  const cards: RuntimeDeckCard[] = [];

  deckRounds.forEach((round, roundIndex) => {
    const blueprint = rounds[roundIndex];
    const selectedRecords: SourceCatalogRecord[] = [];
    const preferredDifficulties =
      difficultyFilter === "mixed"
        ? blueprint.preferredDifficulties
        : [difficultyFilter];

    preferredDifficulties.forEach((difficulty) => {
      while (selectedRecords.length < round.questionCount) {
        const record = removeFirstMatchingRecord(remainingRecords, (candidate) => candidate.difficulty === difficulty);

        if (!record) {
          break;
        }

        selectedRecords.push(record);
      }
    });

    while (selectedRecords.length < round.questionCount && remainingRecords.length > 0) {
      const record = remainingRecords.shift();

      if (!record) {
        break;
      }

      selectedRecords.push(record);
    }

    selectedRecords.forEach((record, questionIndex) => {
      cards.push({
        sourceId: record.id,
        category: record.category,
        difficulty: record.difficulty,
        prompt: record.question,
        choices: buildChoices(record, random),
        explanation: record.explanation,
        reference: record.reference,
        tags: record.tags,
        roundId: round.roundId,
        roundLabel: round.label,
        roundIntro: round.intro,
        roundIndex: roundIndex + 1,
        questionNumberInRound: questionIndex + 1,
        totalQuestionsInRound: round.questionCount,
        totalRounds: deckRounds.length,
        totalQuestions,
        scoring: round.scoring,
      });
    });
  });

  return {
    packTitle: `${category.label} Gold ${difficultyFilter === "mixed" ? "Mixed Ladder" : `${difficultyFilter.charAt(0).toUpperCase()}${difficultyFilter.slice(1)}`} Pack`,
    category: category.category,
    categoryLabel: category.label,
    difficultyFilter,
    questionsAvailable: filteredRecords.length,
    totalQuestions,
    rounds: deckRounds,
    cards,
  };
}

export function getRuntimeCatalogGeneratedAt(): string {
  return runtimeCatalog.generatedAt;
}
