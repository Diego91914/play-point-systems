import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_LINKS = 20;

const TARGET_PAIRS = [
  ["DOG", "WEDDING"],
  ["BEACH", "BIRTHDAY"],
  ["RAIN", "SCHOOL"],
  ["PIZZA", "VACATION"],
  ["FOOTBALL", "CHRISTMAS"],
  ["MUSIC", "OCEAN"],
  ["COFFEE", "CAMPING"],
  ["CAR", "MOVIE"],
  ["TREE", "MONEY"],
  ["PHONE", "DINNER"],
  ["FIRE", "SNOW"],
  ["BOOK", "AIRPLANE"],
  ["SHOES", "HOSPITAL"],
  ["BABY", "BASEBALL"],
  ["CHOCOLATE", "VALENTINE"],
  ["OCEAN", "SPACE"],
  ["SCHOOL", "SUMMER"],
  ["FAMILY", "ROAD TRIP"],
  ["HOUSE", "HALLOWEEN"],
  ["CAT", "DOCTOR"],
  ["APPLE", "TEACHER"],
  ["BED", "AIRPORT"],
  ["RIVER", "MOUNTAIN"],
  ["BASKETBALL", "PIZZA"],
  ["GARDEN", "WEDDING"],
  ["TRAIN", "CHOCOLATE"],
  ["SUN", "CHRISTMAS"],
  ["ICE", "BIRTHDAY"],
  ["CAMERA", "VACATION"],
  ["DOCTOR", "SCHOOL"],
  ["MONEY", "BEACH"],
  ["HORSE", "MOVIE"],
  ["CLOCK", "DINNER"],
  ["CHAIR", "FOOTBALL"],
  ["MILK", "CAMPING"],
  ["FLOWER", "HOSPITAL"],
  ["PARK", "WEDDING"],
  ["SNOW", "SCHOOL"],
  ["BIRD", "AIRPLANE"],
  ["CANDY", "HALLOWEEN"],
  ["BOAT", "MONEY"],
  ["SOCK", "CHRISTMAS"],
  ["WINDOW", "BEACH"],
  ["GUITAR", "BIRTHDAY"],
  ["MOON", "CAMPING"],
  ["BURGER", "FOOTBALL"],
  ["FISH", "DINNER"],
  ["PENCIL", "VACATION"],
  ["CLOUD", "AIRPORT"],
  ["TRUCK", "HOSPITAL"],
  ["CAKE", "WEDDING"],
  ["POOL", "SCHOOL"],
  ["MOVIE", "CHRISTMAS"],
  ["COW", "CHOCOLATE"],
  ["HAT", "BASEBALL"],
  ["ROAD", "OCEAN"],
  ["PAPER", "BIRTHDAY"],
  ["LIGHT", "HALLOWEEN"],
  ["DOOR", "VACATION"],
  ["GRASS", "FOOTBALL"],
  ["EGG", "EASTER"],
  ["STAR", "CHRISTMAS"],
  ["BIKE", "BEACH"],
  ["KEY", "SCHOOL"],
  ["WATER", "BIRTHDAY"],
  ["JACKET", "AIRPORT"],
  ["BALL", "WEDDING"],
  ["SAND", "CHRISTMAS"],
  ["TV", "DINNER"],
  ["CAMPFIRE", "VACATION"],
  ["BREAD", "SCHOOL"],
  ["RING", "BIRTHDAY"],
  ["PARTY", "OCEAN"],
  ["BRIDGE", "WEDDING"],
  ["CORN", "FOOTBALL"],
  ["PILLOW", "HOSPITAL"],
  ["COOKIE", "CHRISTMAS"],
  ["BUS", "BEACH"],
  ["BAT", "HALLOWEEN"],
  ["MAP", "BIRTHDAY"],
] as const;

type Player = {
  id: string;
  name: string;
  tokenHash: string;
  score: number;
  seat: number;
};

type Link = {
  id: string;
  word: string;
  playerId: string | null;
  createdAt: string;
};

type Challenge = {
  challengerId: string;
  linkId: string;
  votes: Record<string, "counts" | "no_way">;
} | null;

type TargetReview = {
  linkId: string;
  hitterId: string;
  votes: Record<string, "counts" | "no_way">;
} | null;

type RoundOutcome = "other_hit" | "self_hit" | "miss" | "rejected";

type RoundResult = {
  round: number;
  secretPlayerId: string;
  targetWord: string;
  hitterId: string | null;
  secretPoints: number;
  hitterPoints: number;
  linksUsed: number;
  outcome: RoundOutcome;
};

type State = {
  code: string;
  status: "lobby" | "playing" | "review" | "round_end" | "finished";
  hostPlayerId: string;
  players: Player[];
  links: Link[];
  turnSeat: number;
  maxLinks: number;
  challenge: Challenge;
  targetReview: TargetReview;
  message: string;
  round: number;
  maxRounds: number;
  secretOrder: string[];
  secretPlayerId: string | null;
  targetWord: string | null;
  usedPairIndexes: number[];
  results: RoundResult[];
};

type Row = { code: string; state: State; version: number };

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function tokenMatches(expected: string, token: string) {
  const actual = Buffer.from(hash(token), "hex");
  const stored = Buffer.from(expected, "hex");
  return actual.length === stored.length && timingSafeEqual(actual, stored);
}

function cleanName(value: unknown) {
  const name = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!name || name.length > 24) throw new Error("Enter a name up to 24 characters.");
  return name;
}

function cleanCode(value: unknown) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Enter a valid 6-character room code.");
  return code;
}

function cleanWord(value: unknown) {
  const word = typeof value === "string" ? value.trim().replace(/\s+/g, " ").toUpperCase() : "";
  if (!/^[A-Z][A-Z '-]{0,29}$/.test(word)) {
    throw new Error("Enter a word or short phrase up to 30 characters.");
  }
  return word;
}

function roomCode() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join("");
}

function playerToken() {
  return randomBytes(32).toString("base64url");
}

function shuffled<T>(values: T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

async function read(code: string): Promise<Row | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ppl_chain_reaction_rooms")
    .select("code,state,version")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Row | null;
}

async function save(row: Row, state: State) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ppl_chain_reaction_rooms")
    .update({
      state,
      version: row.version + 1,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    })
    .eq("code", row.code)
    .eq("version", row.version)
    .select("code,state,version")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The table changed. Try again.");
  return data as Row;
}

function auth(state: State, id: string, token: string) {
  const player = state.players.find((candidate) => candidate.id === id);
  if (!player || !tokenMatches(player.tokenHash, token)) throw new Error("Invalid player session.");
  return player;
}

function project(state: State, viewer: string) {
  const {
    secretOrder: _secretOrder,
    secretPlayerId: _secretPlayerId,
    targetWord: _targetWord,
    usedPairIndexes: _usedPairIndexes,
    ...publicState
  } = state;

  const revealRound = state.status === "round_end" || state.status === "finished";
  return {
    ...publicState,
    players: state.players.map(({ tokenHash: _tokenHash, ...player }) => player),
    secret:
      state.secretPlayerId === viewer && !revealRound && state.targetWord
        ? { targetWord: state.targetWord }
        : null,
    revealedTarget: revealRound ? state.targetWord : null,
    revealedSecretPlayerId: revealRound ? state.secretPlayerId : null,
    me: state.players.find((player) => player.id === viewer)
      ? { id: viewer, isHost: state.hostPlayerId === viewer }
      : null,
  };
}

function choosePair(state: State) {
  let available = TARGET_PAIRS.map((_, index) => index).filter(
    (index) => !state.usedPairIndexes.includes(index),
  );
  if (!available.length) {
    state.usedPairIndexes = [];
    available = TARGET_PAIRS.map((_, index) => index);
  }
  const pairIndex = available[Math.floor(Math.random() * available.length)];
  state.usedPairIndexes.push(pairIndex);
  return TARGET_PAIRS[pairIndex];
}

function beginRound(state: State) {
  const [starter, target] = choosePair(state);
  const secretPlayerId = state.secretOrder[state.round];
  state.secretPlayerId = secretPlayerId;
  state.targetWord = target;
  state.links = [
    { id: randomUUID(), word: starter, playerId: null, createdAt: new Date().toISOString() },
  ];
  state.turnSeat = Math.floor(Math.random() * state.players.length);
  state.challenge = null;
  state.targetReview = null;
  state.status = "playing";
  state.message = `Start with ${starter}. Someone at the table knows the secret target.`;
}

function finishRound(
  state: State,
  outcome: RoundOutcome,
  hitterId: string | null,
  linksUsed = state.links.length - 1,
) {
  if (!state.secretPlayerId || !state.targetWord) throw new Error("Round target is missing.");

  const secret = state.players.find((player) => player.id === state.secretPlayerId);
  const hitter = hitterId ? state.players.find((player) => player.id === hitterId) : null;
  if (!secret) throw new Error("Secret player is missing.");

  let secretPoints = 0;
  let hitterPoints = 0;

  if (outcome === "other_hit" && hitter && hitter.id !== secret.id) {
    secretPoints = 3;
    hitterPoints = 1;
    secret.score += secretPoints;
    hitter.score += hitterPoints;
    state.message = `${hitter.name} landed the target! ${secret.name} earns 3 and ${hitter.name} earns 1.`;
  } else if (outcome === "self_hit" && hitter?.id === secret.id) {
    secretPoints = 1;
    secret.score += secretPoints;
    state.message = `${secret.name} cashed out their own target for 1 point.`;
  } else if (outcome === "rejected") {
    state.message = `The target was found, but the connection did not count. No points this round.`;
  } else {
    state.message = `Twenty links are up. The target was ${state.targetWord}. No target points this round.`;
  }

  state.results.push({
    round: state.round,
    secretPlayerId: secret.id,
    targetWord: state.targetWord,
    hitterId: hitter?.id ?? null,
    secretPoints,
    hitterPoints,
    linksUsed,
    outcome,
  });
  state.challenge = null;
  state.targetReview = null;
  state.status = "round_end";
}

export async function createChainRoom(nameValue: unknown) {
  const name = cleanName(nameValue);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = roomCode();
    const token = playerToken();
    const id = randomUUID();
    const state: State = {
      code,
      status: "lobby",
      hostPlayerId: id,
      players: [{ id, name, tokenHash: hash(token), score: 0, seat: 0 }],
      links: [],
      turnSeat: 0,
      maxLinks: MAX_LINKS,
      challenge: null,
      targetReview: null,
      message: "Invite your table, then start Chain Reaction.",
      round: 0,
      maxRounds: 0,
      secretOrder: [],
      secretPlayerId: null,
      targetWord: null,
      usedPairIndexes: [],
      results: [],
    };

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("ppl_chain_reaction_rooms").insert({ code, state, version: 1 });
    if (!error) return { code, playerId: id, token, state: project(state, id) };
  }
  throw new Error("Unable to create a room.");
}

export async function joinChainRoom(codeValue: unknown, nameValue: unknown) {
  const code = cleanCode(codeValue);
  const name = cleanName(nameValue);
  const row = await read(code);
  if (!row) throw new Error("Room not found.");
  if (row.state.status !== "lobby") throw new Error("That game has already started.");
  if (row.state.players.length >= 8) throw new Error("That room is full.");

  const token = playerToken();
  const id = randomUUID();
  row.state.players.push({
    id,
    name,
    tokenHash: hash(token),
    score: 0,
    seat: row.state.players.length,
  });
  const saved = await save(row, row.state);
  return { code, playerId: id, token, state: project(saved.state, id) };
}

export async function getChainRoom(codeValue: unknown, id: string, token: string) {
  const code = cleanCode(codeValue);
  const row = await read(code);
  if (!row) throw new Error("Room not found.");
  auth(row.state, id, token);
  return { state: project(row.state, id) };
}

export async function actChainRoom(
  codeValue: unknown,
  id: string,
  token: string,
  action: string,
  payload: Record<string, unknown> = {},
) {
  const code = cleanCode(codeValue);
  const row = await read(code);
  if (!row) throw new Error("Room not found.");

  const state = row.state;
  const me = auth(state, id, token);

  if (action === "start") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can start.");
    if (state.players.length < 2) throw new Error("Invite at least one more player.");
    state.players.forEach((player) => {
      player.score = 0;
    });
    state.round = 0;
    state.maxRounds = state.players.length;
    state.secretOrder = shuffled(state.players.map((player) => player.id));
    state.usedPairIndexes = [];
    state.results = [];
    beginRound(state);
  } else if (action === "word") {
    if (state.status !== "playing" || state.challenge) {
      throw new Error("The chain is not ready for a word.");
    }
    if (me.seat !== state.turnSeat) throw new Error("It is not your turn.");

    const word = cleanWord(payload.word);
    if (state.links.some((link) => link.word === word)) {
      throw new Error("That word is already in this chain.");
    }

    const link: Link = {
      id: randomUUID(),
      word,
      playerId: id,
      createdAt: new Date().toISOString(),
    };
    state.links.push(link);

    if (state.targetWord && word === state.targetWord) {
      state.status = "review";
      state.targetReview = { linkId: link.id, hitterId: id, votes: {} };
      state.message = `${me.name} played ${word}. Before the target is scored, the table decides whether that connection counts.`;
    } else if (state.links.length - 1 >= state.maxLinks) {
      finishRound(state, "miss", null);
    } else {
      state.turnSeat = (state.turnSeat + 1) % state.players.length;
      state.message = `${me.name} linked ${word}.`;
    }
  } else if (action === "challenge") {
    if (state.status !== "playing" || state.challenge) {
      throw new Error("There is nothing to challenge.");
    }
    const latest = state.links.at(-1);
    if (!latest?.playerId || latest.playerId === id) {
      throw new Error("You cannot challenge that link.");
    }
    state.challenge = { challengerId: id, linkId: latest.id, votes: { [id]: "no_way" } };
    state.message = `${me.name} challenged ${latest.word}.`;
  } else if (action === "vote") {
    if (!state.challenge) throw new Error("There is no active challenge.");
    const vote = payload.vote === "counts" ? "counts" : payload.vote === "no_way" ? "no_way" : null;
    if (!vote) throw new Error("Choose a vote.");

    const challenged = state.links.find((link) => link.id === state.challenge!.linkId);
    if (!challenged) throw new Error("Challenged link is missing.");
    if (challenged.playerId === id) throw new Error("The challenged player does not vote.");

    state.challenge.votes[id] = vote;
    const eligible = state.players.filter((player) => player.id !== challenged.playerId).length;
    const neededToReject = Math.floor(eligible / 2) + 1;
    const votes = Object.values(state.challenge.votes);
    const noWay = votes.filter((value) => value === "no_way").length;
    const counts = votes.filter((value) => value === "counts").length;

    if (noWay >= neededToReject) {
      const author = state.players.find((player) => player.id === challenged.playerId);
      state.links = state.links.filter((link) => link.id !== challenged.id);
      if (author) state.turnSeat = author.seat;
      state.message = `No way! ${challenged.word} is removed. Try another connection.`;
      state.challenge = null;
    } else if (counts >= neededToReject || votes.length >= eligible) {
      state.message = `It counts! ${challenged.word} stays in the chain.`;
      state.challenge = null;
    }
  } else if (action === "review_vote") {
    if (state.status !== "review" || !state.targetReview) {
      throw new Error("There is no target connection to review.");
    }
    if (state.targetReview.hitterId === id) throw new Error("The player who made the link does not vote.");

    const vote = payload.vote === "counts" ? "counts" : payload.vote === "no_way" ? "no_way" : null;
    if (!vote) throw new Error("Choose a vote.");
    state.targetReview.votes[id] = vote;

    const eligible = state.players.filter((player) => player.id !== state.targetReview!.hitterId).length;
    const neededToReject = Math.floor(eligible / 2) + 1;
    const votes = Object.values(state.targetReview.votes);
    const noWay = votes.filter((value) => value === "no_way").length;
    const counts = votes.filter((value) => value === "counts").length;

    if (noWay >= neededToReject) {
      const attemptedLinks = state.links.length - 1;
      const rejectedLinkId = state.targetReview.linkId;
      state.links = state.links.filter((link) => link.id !== rejectedLinkId);
      finishRound(state, "rejected", state.targetReview.hitterId, attemptedLinks);
    } else if (counts >= neededToReject || votes.length >= eligible) {
      const hitterId = state.targetReview.hitterId;
      finishRound(
        state,
        hitterId === state.secretPlayerId ? "self_hit" : "other_hit",
        hitterId,
      );
    }
  } else if (action === "next_round") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can move to the next round.");
    if (state.status !== "round_end") throw new Error("Finish this round first.");

    if (state.round + 1 >= state.maxRounds) {
      state.status = "finished";
      state.message = "Every player has had the secret target. Final scores are in.";
    } else {
      state.round += 1;
      beginRound(state);
    }
  } else if (action === "restart") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can restart.");
    state.status = "lobby";
    state.links = [];
    state.challenge = null;
    state.targetReview = null;
    state.round = 0;
    state.maxRounds = 0;
    state.secretOrder = [];
    state.secretPlayerId = null;
    state.targetWord = null;
    state.usedPairIndexes = [];
    state.results = [];
    state.players.forEach((player) => {
      player.score = 0;
    });
    state.message = "Ready for another game.";
  } else {
    throw new Error("Unknown action.");
  }

  const saved = await save(row, state);
  return { state: project(saved.state, id) };
}
