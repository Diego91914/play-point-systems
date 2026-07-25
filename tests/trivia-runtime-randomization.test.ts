import { describe, expect, it } from "vitest";
import {
  buildTriviaLiveHostSnapshot,
  createTriviaLiveSession,
} from "../app/games/trivia/play/trivia-live-session";
import {
  buildRuntimeDeck,
  getRuntimeCatalogValidationReport,
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
