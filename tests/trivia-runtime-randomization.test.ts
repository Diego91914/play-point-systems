import { describe, expect, it } from "vitest";
import {
  buildTriviaLiveHostSnapshot,
  createTriviaLiveSession,
} from "../app/games/trivia/play/trivia-live-session";
import {
  buildRuntimeDeck,
  buildRuntimeDeckFromCategory,
  getRuntimeCatalogValidationReport,
  summarizeRuntimeCatalogCategory,
  type RuntimeSourceCatalogCategory,
} from "../app/games/trivia/play/trivia-runtime-builder";
import type { RuntimeChoiceSlot } from "../app/games/trivia/play/trivia-runtime-types";

function deckSignature(seed: string) {
  return buildRuntimeDeck("bible", "mixed", { seed }).cards.map((card) => ({
    sourceId: card.sourceId,
    choices: card.choices.map((choice) => ({
      slot: choice.slot,
      text: choice.text,
      isCorrect: choice.isCorrect,
    })),
  }));
}

describe("seeded trivia deck creation", () => {
  it("reproduces a deck from the same seed and changes it for a different seed", () => {
    const first = deckSignature("repeatable-session-seed");
    const repeated = deckSignature("repeatable-session-seed");
    const different = deckSignature("different-session-seed");

    expect(repeated).toEqual(first);
    expect(different).not.toEqual(first);
  });

  it("samples every deck without replacement", () => {
    const deck = buildRuntimeDeck("bible", "mixed", { seed: "no-duplicate-questions" });
    const sourceIds = deck.cards.map((card) => card.sourceId);

    expect(new Set(sourceIds).size).toBe(sourceIds.length);
  });

  it("builds four rounds with distinct escalating scoring mechanics", () => {
    const deck = buildRuntimeDeck("bible", "mixed", { seed: "round-scoring" });

    expect(deck.rounds.map((round) => ({
      roundId: round.roundId,
      mode: round.scoring.mode,
      correct: round.scoring.correct,
    }))).toEqual([
      { roundId: "hook-round", mode: "fixed", correct: 500 },
      { roundId: "pressure-board", mode: "countdown", correct: 1_000 },
      { roundId: "spotlight-sprint", mode: "countdown", correct: 2_000 },
      { roundId: "final-word", mode: "countdown", correct: 3_000 },
    ]);
  });

  it("prioritizes fresh questions over recently used source IDs", () => {
    const firstDeck = buildRuntimeDeck("bible", "mixed", { seed: "recent-history-a" });
    const recentSourceIds = firstDeck.cards.map((card) => card.sourceId);
    const nextDeck = buildRuntimeDeck("bible", "mixed", {
      seed: "recent-history-b",
      excludedSourceIds: recentSourceIds,
    });

    expect(nextDeck.cards.every((card) => !recentSourceIds.includes(card.sourceId))).toBe(true);
  });

  it("limits repetitive book-order questions and spreads them across rounds", () => {
    for (let index = 0; index < 80; index += 1) {
      const deck = buildRuntimeDeck("bible", "mixed", { seed: `variety-seed-${index}` });
      const bookOrderCards = deck.cards.filter((card) => card.tags.includes("book-order"));
      const perRoundCounts = new Map<string, number>();

      bookOrderCards.forEach((card) => {
        perRoundCounts.set(card.roundId, (perRoundCounts.get(card.roundId) ?? 0) + 1);
      });

      expect(bookOrderCards).toHaveLength(3);
      expect(Math.max(0, ...perRoundCounts.values())).toBeLessThanOrEqual(1);
    }
  });
});

describe("runtime catalog quality", () => {
  it("meets structural, balance, and minimum-size thresholds", () => {
    const report = getRuntimeCatalogValidationReport();

    expect(report.issues).toEqual([]);
    expect(report.totalRecords).toBeGreaterThanOrEqual(1_200);
    expect(report.bookOrderShare).toBeLessThan(0.7);
    Object.values(report.countsByDifficulty).forEach((count) => {
      expect(count).toBeGreaterThan(0);
    });
  });
});

describe("answer-choice position balance", () => {
  it("distributes correct answers across all four slots over many seeded rooms", () => {
    const counts: Record<RuntimeChoiceSlot, number> = { A: 0, B: 0, C: 0, D: 0 };

    for (let index = 0; index < 160; index += 1) {
      const deck = buildRuntimeDeck("bible", "mixed", { seed: `balance-seed-${index}` });

      deck.cards.forEach((card) => {
        const correctChoice = card.choices.find((choice) => choice.isCorrect);
        expect(correctChoice).toBeDefined();
        counts[correctChoice!.slot] += 1;
      });
    }

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    Object.values(counts).forEach((count) => {
      expect(count / total).toBeGreaterThan(0.18);
      expect(count / total).toBeLessThan(0.32);
    });
  });
});

describe("topic-aware published catalog decks", () => {
  const category: RuntimeSourceCatalogCategory = {
    category: "general-knowledge",
    label: "General Knowledge",
    totalGoldTriviaCount: 8,
    countsByDifficulty: { easy: 4, medium: 4, hard: 0, expert: 0 },
    topics: [
      {
        topic: "everyday-life",
        label: "Everyday Life",
        totalGoldTriviaCount: 4,
        countsByDifficulty: { easy: 2, medium: 2, hard: 0, expert: 0 },
        isPlayable: true,
      },
      {
        topic: "world-facts",
        label: "World Facts",
        totalGoldTriviaCount: 4,
        countsByDifficulty: { easy: 2, medium: 2, hard: 0, expert: 0 },
        isPlayable: true,
      },
    ],
    records: Array.from({ length: 8 }, (_, index) => ({
      id: `${index < 4 ? "everyday" : "world"}-${index + 1}`,
      category: "general-knowledge",
      topic: index < 4 ? "everyday-life" : "world-facts",
      difficulty: index % 2 === 0 ? "easy" as const : "medium" as const,
      question: `Published question ${index + 1}?`,
      answer: "Correct",
      choices: ["Correct", "Second", "Third", "Fourth"],
      explanation: "A reviewed explanation.",
      reference: "Reviewed source",
      tags: [],
    })),
  };

  it("exposes topic metadata without exposing question or answer content", () => {
    const summary = summarizeRuntimeCatalogCategory(category);

    expect(summary.topics.map((topic) => topic.topic)).toEqual(["everyday-life", "world-facts"]);
    expect(JSON.stringify(summary)).not.toContain("Published question");
    expect(JSON.stringify(summary)).not.toContain("Correct");
  });

  it("samples only the selected topics and still shuffles answer slots", () => {
    const deck = buildRuntimeDeckFromCategory(category, "mixed", {
      seed: "published-topic-selection",
      topicIds: ["world-facts"],
    });

    expect(deck.questionsAvailable).toBe(4);
    expect(deck.cards).toHaveLength(4);
    expect(deck.cards.every((card) => card.sourceId.startsWith("world-"))).toBe(true);
    expect(deck.cards.every((card) => card.choices.filter((choice) => choice.isCorrect).length === 1)).toBe(true);
  });
});

describe("recent hosted-room history", () => {
  it("prevents consecutive rooms from receiving the same questions", () => {
    const firstRoom = createTriviaLiveSession("bible", "mixed");
    const secondRoom = createTriviaLiveSession("bible", "mixed");
    const firstSnapshot = buildTriviaLiveHostSnapshot(
      firstRoom.sessionId,
      "https://example.com",
      firstRoom.hostToken,
    );
    const secondSnapshot = buildTriviaLiveHostSnapshot(
      secondRoom.sessionId,
      "https://example.com",
      secondRoom.hostToken,
    );
    const firstSourceIds = new Set(firstSnapshot.deck.cards.map((card) => card.sourceId));

    expect(secondSnapshot.deck.cards.every((card) => !firstSourceIds.has(card.sourceId))).toBe(true);
    expect(JSON.stringify(firstSnapshot)).not.toContain("randomSeed");
  });
});
