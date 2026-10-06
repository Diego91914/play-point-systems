import { describe, expect, it } from "vitest";
import {
  assertDealersChoiceProjectionDoesNotLeakDeck,
  createDealersChoiceDeckState,
  createStandardDealersChoiceDeck,
  dealDealersChoiceCard,
  dealersChoiceCardsRemaining,
  discardDealersChoiceCard,
  projectDealersChoiceCardsForViewer,
  projectDealersChoicePublicCards,
  revealDealersChoiceCard,
} from "../lib/play-point-core/dealers-choice-cards";

describe("Dealer's Choice authoritative card state", () => {
  it("creates a unique standard 52-card deck", () => {
    const deck = createStandardDealersChoiceDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.id)).size).toBe(52);
  });

  it("deals from a server-owned cursor without exposing future cards", () => {
    let state = createDealersChoiceDeckState(createStandardDealersChoiceDeck());
    const first = dealDealersChoiceCard(state, { ownerPlayerId: "chan", visibility: "private" });
    state = first.state;

    expect(state.cursor).toBe(1);
    expect(dealersChoiceCardsRemaining(state)).toBe(51);

    const projection = projectDealersChoiceCardsForViewer(state, "chan");
    expect(projection).toHaveLength(1);
    assertDealersChoiceProjectionDoesNotLeakDeck(projection, state);
  });

  it("never gives one player another player's private card", () => {
    let state = createDealersChoiceDeckState(createStandardDealersChoiceDeck());
    state = dealDealersChoiceCard(state, { ownerPlayerId: "chan", visibility: "private" }).state;
    state = dealDealersChoiceCard(state, { ownerPlayerId: "gary", visibility: "private" }).state;

    const chanView = projectDealersChoiceCardsForViewer(state, "chan");
    const garyView = projectDealersChoiceCardsForViewer(state, "gary");

    expect(chanView).toHaveLength(1);
    expect(garyView).toHaveLength(1);
    expect(chanView[0].id).not.toBe(garyView[0].id);
  });

  it("makes a revealed card public to every viewer", () => {
    let state = createDealersChoiceDeckState(createStandardDealersChoiceDeck());
    const dealt = dealDealersChoiceCard(state, { ownerPlayerId: "chan", visibility: "private" });
    state = revealDealersChoiceCard(dealt.state, dealt.card.id);

    expect(projectDealersChoiceCardsForViewer(state, "gary").map((card) => card.id)).toContain(dealt.card.id);
    expect(projectDealersChoicePublicCards(state).map((card) => card.id)).toContain(dealt.card.id);
  });

  it("removes discarded private cards from all viewer projections", () => {
    let state = createDealersChoiceDeckState(createStandardDealersChoiceDeck());
    const dealt = dealDealersChoiceCard(state, { ownerPlayerId: "chan", visibility: "private" });
    state = discardDealersChoiceCard(dealt.state, dealt.card.id);

    expect(projectDealersChoiceCardsForViewer(state, "chan")).toEqual([]);
    expect(state.discarded.map((card) => card.id)).toContain(dealt.card.id);
  });

  it("rejects duplicate cards in authoritative deck state", () => {
    const deck = createStandardDealersChoiceDeck();
    expect(() => createDealersChoiceDeckState([deck[0], deck[0]])).toThrow(/duplicate card ids/i);
  });
});
