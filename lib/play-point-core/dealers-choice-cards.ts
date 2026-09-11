import { randomInt } from "node:crypto";

export type DealersChoiceSuit = "clubs" | "diamonds" | "hearts" | "spades";
export type DealersChoiceRank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export type DealersChoiceCard = {
  id: string;
  rank: DealersChoiceRank;
  suit: DealersChoiceSuit;
};

export type DealersChoiceCardVisibility = "private" | "public";

export type DealersChoiceDealtCard = {
  card: DealersChoiceCard;
  ownerPlayerId: string | null;
  visibility: DealersChoiceCardVisibility;
  sequence: number;
};

export type DealersChoiceDeckState = {
  deck: DealersChoiceCard[];
  cursor: number;
  dealt: DealersChoiceDealtCard[];
  discarded: DealersChoiceCard[];
};

export type DealersChoiceViewerCard = {
  id: string;
  rank: DealersChoiceRank;
  suit: DealersChoiceSuit;
  ownerPlayerId: string | null;
  visibility: DealersChoiceCardVisibility;
  sequence: number;
};

const SUITS: DealersChoiceSuit[] = ["clubs", "diamonds", "hearts", "spades"];
const RANKS: DealersChoiceRank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function createStandardDealersChoiceDeck(): DealersChoiceCard[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: `${rank}-${suit}`, rank, suit })));
}

export function shuffleDealersChoiceDeck(cards: DealersChoiceCard[] = createStandardDealersChoiceDeck()): DealersChoiceCard[] {
  const shuffled = cards.map((card) => ({ ...card }));
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function createDealersChoiceDeckState(cards?: DealersChoiceCard[]): DealersChoiceDeckState {
  const deck = cards ? cards.map((card) => ({ ...card })) : shuffleDealersChoiceDeck();
  if (deck.length === 0) throw new Error("Dealer's Choice deck cannot be empty.");
  const ids = new Set(deck.map((card) => card.id));
  if (ids.size !== deck.length) throw new Error("Dealer's Choice deck contains duplicate card ids.");
  return { deck, cursor: 0, dealt: [], discarded: [] };
}

export function dealersChoiceCardsRemaining(state: DealersChoiceDeckState) {
  return state.deck.length - state.cursor;
}

export function dealDealersChoiceCard(
  state: DealersChoiceDeckState,
  options: { ownerPlayerId?: string | null; visibility: DealersChoiceCardVisibility },
): { state: DealersChoiceDeckState; card: DealersChoiceCard } {
  if (state.cursor >= state.deck.length) throw new Error("Dealer's Choice deck is exhausted.");
  const card = state.deck[state.cursor];
  const dealtCard: DealersChoiceDealtCard = {
    card,
    ownerPlayerId: options.ownerPlayerId ?? null,
    visibility: options.visibility,
    sequence: state.dealt.length,
  };
  return {
    card,
    state: {
      ...state,
      cursor: state.cursor + 1,
      dealt: [...state.dealt, dealtCard],
    },
  };
}

export function revealDealersChoiceCard(state: DealersChoiceDeckState, cardId: string): DealersChoiceDeckState {
  let found = false;
  const dealt = state.dealt.map((entry) => {
    if (entry.card.id !== cardId) return entry;
    found = true;
    return { ...entry, visibility: "public" as const };
  });
  if (!found) throw new Error("Dealer's Choice card has not been dealt.");
  return { ...state, dealt };
}

export function discardDealersChoiceCard(state: DealersChoiceDeckState, cardId: string): DealersChoiceDeckState {
  const entry = state.dealt.find((candidate) => candidate.card.id === cardId);
  if (!entry) throw new Error("Dealer's Choice card has not been dealt.");
  return {
    ...state,
    dealt: state.dealt.filter((candidate) => candidate.card.id !== cardId),
    discarded: [...state.discarded, entry.card],
  };
}

export function projectDealersChoiceCardsForViewer(
  state: DealersChoiceDeckState,
  viewerPlayerId: string,
): DealersChoiceViewerCard[] {
  return state.dealt
    .filter((entry) => entry.visibility === "public" || entry.ownerPlayerId === viewerPlayerId)
    .map((entry) => ({
      ...entry.card,
      ownerPlayerId: entry.ownerPlayerId,
      visibility: entry.visibility,
      sequence: entry.sequence,
    }));
}

export function projectDealersChoicePublicCards(state: DealersChoiceDeckState): DealersChoiceViewerCard[] {
  return state.dealt
    .filter((entry) => entry.visibility === "public")
    .map((entry) => ({
      ...entry.card,
      ownerPlayerId: entry.ownerPlayerId,
      visibility: entry.visibility,
      sequence: entry.sequence,
    }));
}

export function assertDealersChoiceProjectionDoesNotLeakDeck(
  projection: DealersChoiceViewerCard[],
  state: DealersChoiceDeckState,
) {
  const undealtIds = new Set(state.deck.slice(state.cursor).map((card) => card.id));
  if (projection.some((card) => undealtIds.has(card.id))) {
    throw new Error("Dealer's Choice projection leaked an undealt card.");
  }
}
