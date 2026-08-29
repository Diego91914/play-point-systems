import "server-only";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  ON_MY_LIST_ALL_QUESTIONS,
  formatOnMyListPrompt,
  getOnMyListQuestionPack,
  type OnMyListQuestionPack,
} from "@/lib/play-point-core/on-my-list-question-bank";
import { scoreOnMyListAnswers } from "@/lib/play-point-core/on-my-list-scoring";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
type Player = { id: string; name: string; tokenHash: string; score: number; seat: number };
type Answer = { text: string; points: number; revealed: boolean; foundBy: string | null };
type State = {
  code: string;
  status: "lobby" | "setup" | "guessing" | "round-reveal" | "finished";
  hostPlayerId: string;
  hostAccountId?: string;
  players: Player[];
  round: number;
  maxRounds: number;
  questionOrder: string[];
  questionPack?: OnMyListQuestionPack;
  surveyStartSeat: number;
  answers: Answer[];
  misses: Record<string, number>;
  guessOrder: string[];
  turnIndex: number;
  pendingHitBy: string | null;
  message: string;
};
type Row = { code: string; state: State; version: number };

const hash = (v: string) => createHash("sha256").update(v).digest("hex");
function tokenMatches(expected: string, token: string) {
  const a = Buffer.from(hash(token), "hex"), b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function cleanName(v: unknown) {
  const n = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  if (!n || n.length > 24) throw new Error("Enter a name up to 24 characters.");
  return n;
}
function cleanCode(v: unknown) {
  const c = typeof v === "string" ? v.trim().toUpperCase() : "";
  if (!/^[A-Z2-9]{6}$/.test(c)) throw new Error("Enter a valid 6-character room code.");
  return c;
}
function cleanQuestionPack(v: unknown): OnMyListQuestionPack {
  return v === "reunion" ? "reunion" : "classic";
}
function roomCode() {
  const b = randomBytes(6);
  return Array.from(b, v => ALPHABET[v % ALPHABET.length]).join("");
}
const playerToken = () => randomBytes(32).toString("base64url");
function shuffle<T>(items: T[]) {
  const c = [...items];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}
function activePack(state: State) {
  return getOnMyListQuestionPack(state.questionPack ?? "classic");
}
function surveyed(state: State) {
  if (!state.players.length) return null;
  const seat = (state.surveyStartSeat + state.round) % state.players.length;
  return state.players.find(p => p.seat === seat) ?? state.players[seat] ?? null;
}
function question(state: State) {
  const id = state.questionOrder[state.round];
  return ON_MY_LIST_ALL_QUESTIONS.find(q => q.id === id) ?? null;
}
function currentGuesser(state: State) {
  if (state.status !== "guessing" || state.pendingHitBy) return null;
  for (let n = 0; n < state.guessOrder.length; n++) {
    const idx = (state.turnIndex + n) % state.guessOrder.length, id = state.guessOrder[idx];
    if ((state.misses[id] ?? 0) < 2) {
      state.turnIndex = idx;
      return state.players.find(p => p.id === id) ?? null;
    }
  }
  return null;
}
function advance(state: State) {
  if (!state.guessOrder.length) return;
  state.turnIndex = (state.turnIndex + 1) % state.guessOrder.length;
  currentGuesser(state);
}
function boardDone(state: State) {
  return state.answers.length > 0 && state.answers.every(a => a.revealed);
}
function allOut(state: State) {
  return state.guessOrder.length > 0 && state.guessOrder.every(id => (state.misses[id] ?? 0) >= 2);
}
function refillFutureQuestions(state: State, startIndex: number) {
  const bank = activePack(state);
  const needed = Math.max(0, state.maxRounds - startIndex);
  if (!needed) return;
  const usedBefore = new Set(state.questionOrder.slice(0, startIndex));
  const preferred = bank.map(q => q.id).filter(id => !usedBefore.has(id));
  const source = preferred.length >= needed ? preferred : bank.map(q => q.id);
  const picks = shuffle(source).slice(0, needed);
  state.questionOrder = [...state.questionOrder.slice(0, startIndex), ...picks];
}
async function read(code: string): Promise<Row | null> {
  const s = getSupabaseServerClient();
  const { data, error } = await s.from("ppl_on_my_list_rooms").select("code,state,version").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Row | null;
}
async function save(row: Row, state: State) {
  const s = getSupabaseServerClient();
  const { data, error } = await s.from("ppl_on_my_list_rooms").update({
    state,
    version: row.version + 1,
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  }).eq("code", row.code).eq("version", row.version).select("code,state,version").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The table changed. Try again.");
  return data as Row;
}
function auth(state: State, id: string, token: string) {
  const p = state.players.find(x => x.id === id);
  if (!p || !tokenMatches(p.tokenHash, token)) throw new Error("Invalid player session.");
  return p;
}
function project(state: State, viewer: string) {
  const s = surveyed(state), q = question(state), isSurvey = s?.id === viewer;
  const showAll = state.status === "round-reveal" || state.status === "finished";
  const answers = state.answers.map(a => ({
    points: a.points,
    revealed: a.revealed,
    text: (a.revealed || showAll || isSurvey) ? a.text : "",
    foundBy: a.revealed || showAll ? a.foundBy : null,
  }));
  const { hostAccountId: _hostAccountId, ...publicState } = state;
  return {
    ...publicState,
    questionPack: state.questionPack ?? "classic",
    players: state.players.map(({ tokenHash: _t, ...p }) => p),
    answers,
    pendingHitBy: state.pendingHitBy ? {
      id: state.pendingHitBy,
      name: state.players.find(p => p.id === state.pendingHitBy)?.name ?? "Player",
    } : null,
    me: { id: viewer, isHost: state.hostPlayerId === viewer, isSurveyed: isSurvey },
    surveyed: s ? { id: s.id, name: s.name } : null,
    currentGuesser: (() => {
      const g = currentGuesser(state);
      return g ? { id: g.id, name: g.name } : null;
    })(),
    currentQuestion: q && s ? {
      id: q.id,
      prompt: formatOnMyListPrompt(q.prompt, s.name),
      minAnswers: 5,
      maxAnswers: 10,
    } : null,
  };
}
function endRound(state: State) {
  state.status = "round-reveal";
  state.pendingHitBy = null;
  state.message = "Board complete. See what was left, then rotate the Surveyed Player.";
}

export async function createOnMyListRoom(nameValue: unknown, hostAccountId: string) {
  const name = cleanName(nameValue);
  if (!hostAccountId) throw new Error("A signed-in host account is required.");
  for (let i = 0; i < 8; i++) {
    const code = roomCode(), token = playerToken(), id = randomUUID();
    const state: State = {
      code,
      status: "lobby",
      hostPlayerId: id,
      hostAccountId,
      players: [{ id, name, tokenHash: hash(token), score: 0, seat: 0 }],
      round: 0,
      maxRounds: 0,
      questionOrder: [],
      questionPack: "classic",
      surveyStartSeat: 0,
      answers: [],
      misses: {},
      guessOrder: [],
      turnIndex: 0,
      pendingHitBy: null,
      message: "Invite the table, then find out who really knows your list.",
    };
    const s = getSupabaseServerClient();
    const { error } = await s.from("ppl_on_my_list_rooms").insert({ code, state, version: 1 });
    if (!error) return { code, playerId: id, token, state: project(state, id) };
  }
  throw new Error("Unable to create a room.");
}

export async function joinOnMyListRoom(codeValue: unknown, nameValue: unknown) {
  const code = cleanCode(codeValue), name = cleanName(nameValue), row = await read(code);
  if (!row) throw new Error("Room not found.");
  if (row.state.status !== "lobby") throw new Error("That game has already started. If you were already in this room, use Rejoin as Host or return on the device that still has your player session.");
  if (row.state.players.length >= 8) throw new Error("That room is full.");
  const token = playerToken(), id = randomUUID();
  row.state.players.push({ id, name, tokenHash: hash(token), score: 0, seat: row.state.players.length });
  const saved = await save(row, row.state);
  return { code, playerId: id, token, state: project(saved.state, id) };
}

export async function recoverOnMyListHost(codeValue: unknown, accountId: string, allowLegacyFounder = false) {
  const code = cleanCode(codeValue), row = await read(code);
  if (!row) throw new Error("Room not found.");
  const state = row.state;
  const accountMatches = Boolean(state.hostAccountId && state.hostAccountId === accountId);
  const legacyFounderRecovery = Boolean(!state.hostAccountId && allowLegacyFounder);
  if (!accountMatches && !legacyFounderRecovery) throw new Error("This signed-in account is not the host of that room.");
  const host = state.players.find(p => p.id === state.hostPlayerId);
  if (!host) throw new Error("The host seat could not be found.");
  const token = playerToken();
  host.tokenHash = hash(token);
  state.hostAccountId = accountId;
  state.message = `${host.name} rejoined as host.`;
  const saved = await save(row, state);
  return { code, playerId: host.id, token, state: project(saved.state, host.id) };
}

export async function getOnMyListRoom(codeValue: unknown, id: string, token: string) {
  const code = cleanCode(codeValue), row = await read(code);
  if (!row) throw new Error("Room not found.");
  auth(row.state, id, token);
  return { state: project(row.state, id) };
}

export async function actOnMyListRoom(codeValue: unknown, id: string, token: string, action: string, payload: Record<string, unknown> = {}) {
  const code = cleanCode(codeValue), row = await read(code);
  if (!row) throw new Error("Room not found.");
  const state = row.state;
  auth(state, id, token);
  const s = surveyed(state);

  if (action === "set-question-pack") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can change the question pack.");
    const nextPack = cleanQuestionPack(payload.pack);
    state.questionPack = nextPack;
    if (state.status === "setup") {
      refillFutureQuestions(state, state.round);
      state.answers = [];
      state.message = nextPack === "reunion"
        ? "Reunion Edition is on. The current board now uses a reunion question."
        : "Classic questions are back on. The current board now uses the classic pack.";
    } else if (state.status === "guessing" || state.status === "round-reveal") {
      refillFutureQuestions(state, state.round + 1);
      state.message = nextPack === "reunion"
        ? "Reunion Edition is on. It will begin with the next board."
        : "Classic questions are back on. They will begin with the next board.";
    } else {
      state.message = nextPack === "reunion"
        ? "Reunion Edition is on. People questions can include anyone from your Huntland school years."
        : "Classic question pack selected.";
    }
  }
  else if (action === "start") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can start.");
    if (state.players.length < 2) throw new Error("Invite at least one more player.");
    state.status = "setup";
    state.round = 0;
    state.maxRounds = state.players.length * 2;
    state.questionOrder = shuffle(activePack(state).map(q => q.id)).slice(0, state.maxRounds);
    state.surveyStartSeat = Math.floor(Math.random() * state.players.length);
    state.answers = [];
    state.misses = {};
    state.guessOrder = [];
    state.turnIndex = 0;
    state.pendingHitBy = null;
    state.players.forEach(p => p.score = 0);
    state.message = state.questionPack === "reunion"
      ? "Reunion Edition: Surveyed Player, build your ranked board privately."
      : "Surveyed Player: build your ranked board privately.";
  }
  else if (action === "skip-question") {
    if (state.status !== "setup" || !s || s.id !== id) throw new Error("Only the Surveyed Player can skip this question.");
    const bank = activePack(state);
    const currentId = state.questionOrder[state.round];
    const scheduled = new Set(state.questionOrder);
    const unused = bank.map(q => q.id).filter(qid => !scheduled.has(qid));
    const pool = unused.length ? unused : bank.map(q => q.id).filter(qid => qid !== currentId);
    if (!pool.length) throw new Error("No alternate questions are available.");
    state.questionOrder[state.round] = pool[Math.floor(Math.random() * pool.length)];
    state.answers = [];
    state.message = "Different question selected. Build your new board privately.";
  }
  else if (action === "submit-board") {
    if (state.status !== "setup" || !s || s.id !== id) throw new Error("Only the Surveyed Player can build this board.");
    if (!question(state)) throw new Error("Question missing.");
    const raw = Array.isArray(payload.answers) ? payload.answers : [];
    const texts = raw.map(v => typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "").filter(Boolean);
    if (texts.length < 5 || texts.length > 10) throw new Error("Enter between 5 and 10 answers.");
    if (texts.some(v => v.length > 60)) throw new Error("Keep every answer to 60 characters or fewer.");
    if (new Set(texts.map(v => v.toLowerCase())).size !== texts.length) throw new Error("Each answer must be different.");
    state.answers = scoreOnMyListAnswers(texts);
    state.misses = {};
    state.guessOrder = shuffle(state.players.filter(p => p.id !== s.id).map(p => p.id));
    state.turnIndex = 0;
    state.pendingHitBy = null;
    state.status = "guessing";
    state.message = `${currentGuesser(state)?.name ?? "A player"} guesses first.`;
  }
  else if (action === "got-it") {
    const g = currentGuesser(state);
    if (state.status !== "guessing" || !g || g.id !== id) throw new Error("It is not your turn.");
    if (state.pendingHitBy) throw new Error("Waiting for the Surveyed Player to reveal the answer.");
    state.pendingHitBy = id;
    state.message = `${g.name} got one. Surveyed Player: reveal it.`;
  }
  else if (action === "miss") {
    const g = currentGuesser(state);
    if (state.status !== "guessing" || !g || g.id !== id) throw new Error("It is not your turn.");
    state.misses[id] = (state.misses[id] ?? 0) + 1;
    if (allOut(state)) endRound(state);
    else {
      advance(state);
      state.message = state.misses[id] >= 2 ? `${g.name} is out for this board.` : `${g.name} has ${state.misses[id]} miss.`;
    }
  }
  else if (action === "reveal-answer") {
    if (state.status !== "guessing" || !s || s.id !== id || !state.pendingHitBy) throw new Error("There is no hit to confirm.");
    const index = Number(payload.index);
    const a = state.answers[index];
    if (!Number.isInteger(index) || !a || a.revealed) throw new Error("Choose an unrevealed answer.");
    const finder = state.players.find(p => p.id === state.pendingHitBy);
    if (!finder) throw new Error("Guesser missing.");
    a.revealed = true;
    a.foundBy = finder.id;
    finder.score += a.points;
    state.pendingHitBy = null;
    if (boardDone(state)) endRound(state);
    else {
      advance(state);
      state.message = `${finder.name} scored ${a.points}. Next guess.`;
    }
  }
  else if (action === "next") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can continue.");
    if (state.status !== "round-reveal") throw new Error("Finish this board first.");
    if (state.round + 1 >= state.maxRounds) {
      state.status = "finished";
      state.message = "Final scores are in.";
    } else {
      state.round++;
      state.status = "setup";
      state.answers = [];
      state.misses = {};
      state.guessOrder = [];
      state.turnIndex = 0;
      state.pendingHitBy = null;
      state.message = state.questionPack === "reunion"
        ? "Reunion Edition: new Surveyed Player. Build the next board."
        : "New Surveyed Player. Build the next board.";
    }
  }
  else if (action === "restart") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can restart.");
    state.status = "lobby";
    state.round = 0;
    state.maxRounds = 0;
    state.questionOrder = [];
    state.answers = [];
    state.misses = {};
    state.guessOrder = [];
    state.turnIndex = 0;
    state.pendingHitBy = null;
    state.players.forEach(p => p.score = 0);
    state.message = state.questionPack === "reunion" ? "Reunion Edition is ready for another game." : "Ready for another game.";
  }
  else throw new Error("Unknown action.");

  const saved = await save(row, state);
  return { state: project(saved.state, id) };
}
