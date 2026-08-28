import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { HOW_CLOSE_QUESTIONS, formatHowClosePrompt } from "@/lib/play-point-core/how-close-questions";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type Player = { id: string; name: string; tokenHash: string; score: number; seat: number };
type State = {
  code: string;
  status: "lobby" | "playing" | "finished";
  hostPlayerId: string;
  players: Player[];
  round: number;
  maxRounds: number;
  questionOrder: string[];
  spotlightStartSeat: number;
  answers: Record<string, number>;
  revealed: boolean;
  roundPoints: Record<string, number>;
  roundDistances: Record<string, number>;
  closestPlayerIds: string[];
  message: string;
};
type Row = { code: string; state: State; version: number };

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function tokenMatches(expected: string, token: string) {
  const a = Buffer.from(hash(token), "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
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

function roomCode() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join("");
}

function playerToken() {
  return randomBytes(32).toString("base64url");
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestionOrder(count: number) {
  const byCategory = new Map<string, string[]>();
  for (const question of HOW_CLOSE_QUESTIONS) {
    const list = byCategory.get(question.category) ?? [];
    list.push(question.id);
    byCategory.set(question.category, list);
  }
  const categoryQueues = shuffle([...byCategory.entries()]).map(([category, ids]) => ({ category, ids: shuffle(ids) }));
  const order: string[] = [];
  while (order.length < count) {
    let added = false;
    for (const queue of categoryQueues) {
      const id = queue.ids.shift();
      if (!id) continue;
      order.push(id);
      added = true;
      if (order.length >= count) break;
    }
    if (!added) break;
  }
  return order;
}

function scoreForDistance(distance: number) {
  if (distance === 0) return 3;
  if (distance <= 5) return 2;
  if (distance <= 10) return 1;
  return 0;
}

function spotlightFor(state: State) {
  if (!state.players.length) return null;
  const seat = (state.spotlightStartSeat + state.round) % state.players.length;
  return state.players.find((player) => player.seat === seat) ?? state.players[seat] ?? null;
}

function currentQuestionFor(state: State) {
  const id = state.questionOrder[state.round];
  return HOW_CLOSE_QUESTIONS.find((question) => question.id === id) ?? null;
}

async function read(code: string): Promise<Row | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_how_close_rooms").select("code,state,version").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Row | null;
}

async function save(row: Row, state: State) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ppl_how_close_rooms")
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
  const reveal = state.revealed || state.status === "finished";
  const spotlight = spotlightFor(state);
  const question = currentQuestionFor(state);
  const publicPlayers = state.players.map(({ tokenHash: _tokenHash, ...player }) => player);
  const visibleAnswers = reveal
    ? state.answers
    : state.answers[viewer] !== undefined
      ? { [viewer]: state.answers[viewer] }
      : {};

  return {
    ...state,
    players: publicPlayers,
    answers: visibleAnswers,
    roundPoints: reveal ? state.roundPoints : {},
    roundDistances: reveal ? state.roundDistances : {},
    closestPlayerIds: reveal ? state.closestPlayerIds : [],
    me: state.players.find((player) => player.id === viewer)
      ? { id: viewer, isHost: state.hostPlayerId === viewer }
      : null,
    spotlight: spotlight ? { id: spotlight.id, name: spotlight.name } : null,
    currentQuestion: question && spotlight
      ? {
          id: question.id,
          category: question.category,
          prompt: formatHowClosePrompt(question.prompt, spotlight.name),
          low: question.low,
          high: question.high,
        }
      : null,
    answeredCount: Object.keys(state.answers).length,
  };
}

export async function createHowCloseRoom(nameValue: unknown) {
  const name = cleanName(nameValue);
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = roomCode();
    const token = playerToken();
    const id = randomUUID();
    const state: State = {
      code,
      status: "lobby",
      hostPlayerId: id,
      players: [{ id, name, tokenHash: hash(token), score: 0, seat: 0 }],
      round: 0,
      maxRounds: 0,
      questionOrder: [],
      spotlightStartSeat: 0,
      answers: {},
      revealed: false,
      roundPoints: {},
      roundDistances: {},
      closestPlayerIds: [],
      message: "Invite everyone. Then find out who really knows whom.",
    };
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("ppl_how_close_rooms").insert({ code, state, version: 1 });
    if (!error) return { code, playerId: id, token, state: project(state, id) };
  }
  throw new Error("Unable to create a room.");
}

export async function joinHowCloseRoom(codeValue: unknown, nameValue: unknown) {
  const code = cleanCode(codeValue);
  const name = cleanName(nameValue);
  const row = await read(code);
  if (!row) throw new Error("Room not found.");
  if (row.state.status !== "lobby") throw new Error("That game has already started.");
  if (row.state.players.length >= 8) throw new Error("That room is full.");

  const token = playerToken();
  const id = randomUUID();
  row.state.players.push({ id, name, tokenHash: hash(token), score: 0, seat: row.state.players.length });
  const saved = await save(row, row.state);
  return { code, playerId: id, token, state: project(saved.state, id) };
}

export async function getHowCloseRoom(codeValue: unknown, id: string, token: string) {
  const code = cleanCode(codeValue);
  const row = await read(code);
  if (!row) throw new Error("Room not found.");
  auth(row.state, id, token);
  return { state: project(row.state, id) };
}

export async function actHowCloseRoom(
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
  auth(state, id, token);

  if (action === "start") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can start.");
    if (state.players.length < 2) throw new Error("Invite at least one more player.");
    state.status = "playing";
    state.round = 0;
    state.maxRounds = state.players.length * 2;
    state.questionOrder = buildQuestionOrder(state.maxRounds);
    state.spotlightStartSeat = Math.floor(Math.random() * state.players.length);
    state.answers = {};
    state.revealed = false;
    state.roundPoints = {};
    state.roundDistances = {};
    state.closestPlayerIds = [];
    const spotlight = spotlightFor(state);
    state.message = spotlight ? `${spotlight.name} is in the Spotlight. Guess their number.` : "Guess the Spotlight Player.";
  } else if (action === "answer") {
    if (state.status !== "playing" || state.revealed) throw new Error("This round is not accepting answers.");
    if (state.answers[id] !== undefined) throw new Error("Your answer is already locked.");
    const value = Number(payload.value);
    if (!Number.isInteger(value) || value < 1 || value > 100) throw new Error("Choose a whole number from 1 to 100.");
    state.answers[id] = value;
    state.message = `${Object.keys(state.answers).length}/${state.players.length} answers locked.`;

    if (Object.keys(state.answers).length === state.players.length) {
      const spotlight = spotlightFor(state);
      if (!spotlight) throw new Error("Spotlight player is missing.");
      const target = state.answers[spotlight.id];
      const guessers = state.players.filter((player) => player.id !== spotlight.id);
      state.roundPoints = {};
      state.roundDistances = {};

      let bestDistance = Number.POSITIVE_INFINITY;
      for (const player of guessers) {
        const distance = Math.abs(state.answers[player.id] - target);
        const points = scoreForDistance(distance);
        state.roundDistances[player.id] = distance;
        state.roundPoints[player.id] = points;
        player.score += points;
        bestDistance = Math.min(bestDistance, distance);
      }
      state.roundDistances[spotlight.id] = 0;
      state.roundPoints[spotlight.id] = 0;
      state.closestPlayerIds = guessers
        .filter((player) => state.roundDistances[player.id] === bestDistance)
        .map((player) => player.id);
      state.revealed = true;
      const exact = state.closestPlayerIds.some((playerId) => state.roundDistances[playerId] === 0);
      state.message = exact ? `Exact match! Someone nailed ${spotlight.name}'s answer.` : `${spotlight.name}'s real answer was ${target}.`;
    }
  } else if (action === "next") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can continue.");
    if (!state.revealed) throw new Error("Wait for the reveal.");
    if (state.round + 1 >= state.maxRounds) {
      state.status = "finished";
      state.message = "Now you know who knows the table best.";
    } else {
      state.round += 1;
      state.answers = {};
      state.revealed = false;
      state.roundPoints = {};
      state.roundDistances = {};
      state.closestPlayerIds = [];
      const spotlight = spotlightFor(state);
      state.message = spotlight ? `${spotlight.name} is in the Spotlight. Guess their number.` : "New Spotlight Player.";
    }
  } else if (action === "restart") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can restart.");
    state.status = "lobby";
    state.round = 0;
    state.maxRounds = 0;
    state.questionOrder = [];
    state.answers = {};
    state.revealed = false;
    state.roundPoints = {};
    state.roundDistances = {};
    state.closestPlayerIds = [];
    state.players.forEach((player) => {
      player.score = 0;
    });
    state.message = "Ready to see how well you know each other?";
  } else {
    throw new Error("Unknown action.");
  }

  const saved = await save(row, state);
  return { state: project(saved.state, id) };
}
