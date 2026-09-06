import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export type AllAboutYouRoundType = "pick" | "finish" | "rank" | "who" | "memory";
type Status = "lobby" | "guest-answer" | "guessing" | "judge" | "reveal" | "memory-submit" | "memory-pick" | "finished" | "closed";
type Player = { id: string; name: string; tokenHash: string; score: number; seat: number };
type MemoryEntry = { id: string; authorId: string; text: string };
type Recap = { type: AllAboutYouRoundType; prompt: string; answer: string };
type Prompt = { id: string; type: AllAboutYouRoundType; text: string; choices?: string[] };
type State = {
  code: string;
  status: Status;
  hostPlayerId: string;
  hostAccountId: string;
  guestId: string | null;
  players: Player[];
  round: number;
  promptIds: string[];
  guestAnswer: string | string[] | null;
  guesses: Record<string, string | string[]>;
  roundPoints: Record<string, number>;
  judgedPlayerIds: string[];
  memoryEntries: MemoryEntry[];
  memoryFavoriteId: string | null;
  recap: Recap[];
  message: string;
};
type Row = { code: string; state: State; version: number };

const PROMPTS: readonly Prompt[] = [
  { id: "pick-5000", type: "pick", text: "You get an unexpected $5,000 tomorrow. What are you MOST likely to do with it?", choices: ["Take a trip", "Save or invest it", "Buy something fun", "Treat people I love"] },
  { id: "pick-free-day", type: "pick", text: "A completely free day appears on your calendar. Where do you want to be?", choices: ["Home with no plans", "Outside somewhere", "On a day trip", "With a crowd"] },
  { id: "pick-table", type: "pick", text: "What matters most to you at a great get-together?", choices: ["The food", "The laughs", "The people", "The stories"] },
  { id: "finish-saturday", type: "finish", text: "Finish this sentence privately: My perfect Saturday starts with _____ ." },
  { id: "finish-always", type: "finish", text: "Finish this sentence privately: I can almost always be talked into _____ ." },
  { id: "finish-home", type: "finish", text: "Finish this sentence privately: Home feels most like home when _____ ." },
  { id: "rank-getaway", type: "rank", text: "Rank these from MOST like your ideal getaway to LEAST.", choices: ["Beach", "Mountains", "City", "Stay home"] },
  { id: "rank-night", type: "rank", text: "Rank these from MOST like your kind of night to LEAST.", choices: ["Dinner out", "Game night", "Live music", "Quiet night in"] },
  { id: "rank-gift", type: "rank", text: "Rank these gifts from MOST exciting to LEAST.", choices: ["An experience", "Something useful", "Something sentimental", "A surprise"] },
  { id: "who-stranded", type: "who", text: "If you were stranded somewhere overnight, which person here would you want with you?" },
  { id: "who-roadtrip", type: "who", text: "Which person here would you trust most to keep a long road trip fun?" },
  { id: "who-secret", type: "who", text: "Which person here would you trust first with a ridiculous secret?" },
  { id: "memory-laugh", type: "memory", text: "Share one memory with the Guest of Honor that still makes you laugh." },
  { id: "memory-meaning", type: "memory", text: "Share a moment with the Guest of Honor that meant more to you than they may realize." },
  { id: "memory-only-us", type: "memory", text: "Share a memory that could only belong to you and the Guest of Honor." },
] as const;

const ROUND_ORDER: readonly AllAboutYouRoundType[] = ["pick", "finish", "rank", "who", "memory"];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function tokenMatches(expected: string, token: string) { const a = Buffer.from(hash(token), "hex"), b = Buffer.from(expected, "hex"); return a.length === b.length && timingSafeEqual(a, b); }
function cleanName(value: unknown) { const name = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""; if (!name || name.length > 24) throw new Error("Enter a name up to 24 characters."); return name; }
function cleanCode(value: unknown) { const code = typeof value === "string" ? value.trim().toUpperCase() : ""; if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Enter a valid 6-character room code."); return code; }
function cleanText(value: unknown, max = 140) { const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""; if (!text) throw new Error("Enter an answer first."); if (text.length > max) throw new Error(`Keep it to ${max} characters or fewer.`); return text; }
function roomCode() { const bytes = randomBytes(6); return Array.from(bytes, value => ALPHABET[value % ALPHABET.length]).join(""); }
const playerToken = () => randomBytes(32).toString("base64url");
function shuffle<T>(items: readonly T[]) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function guest(state: State) { return state.players.find(player => player.id === state.guestId) ?? null; }
function guessers(state: State) { return state.players.filter(player => player.id !== state.guestId); }
function promptFor(state: State) { const id = state.promptIds[state.round]; return PROMPTS.find(prompt => prompt.id === id) ?? null; }
function choosePrompts() { return ROUND_ORDER.map(type => shuffle(PROMPTS.filter(prompt => prompt.type === type))[0]?.id ?? ""); }
function labelForWho(state: State, id: string) { return state.players.find(player => player.id === id)?.name ?? "Someone at the table"; }
function answerLabel(state: State) { const prompt = promptFor(state); if (!prompt || state.guestAnswer == null) return ""; if (prompt.type === "rank" && Array.isArray(state.guestAnswer)) return state.guestAnswer.join(" → "); if (prompt.type === "who" && typeof state.guestAnswer === "string") return labelForWho(state, state.guestAnswer); return String(state.guestAnswer); }
function addRecap(state: State, answer?: string) { const prompt = promptFor(state); if (!prompt) return; state.recap = [...state.recap.filter(item => item.prompt !== prompt.text), { type: prompt.type, prompt: prompt.text, answer: answer ?? answerLabel(state) }]; }
function resetRound(state: State) { state.guestAnswer = null; state.guesses = {}; state.roundPoints = {}; state.judgedPlayerIds = []; state.memoryEntries = []; state.memoryFavoriteId = null; const type = promptFor(state)?.type; state.status = type === "memory" ? "memory-submit" : "guest-answer"; state.message = type === "memory" ? "Everyone else: send in one memory. The Guest of Honor will choose a favorite anonymously." : `${guest(state)?.name ?? "Guest of Honor"} answers first. Everyone else stays locked out until the answer is sealed.`; }
function allGuessersAnswered(state: State) { return guessers(state).every(player => state.guesses[player.id] !== undefined); }
function scoreAutomaticRound(state: State) {
  const prompt = promptFor(state); if (!prompt) throw new Error("Round prompt is missing.");
  const target = state.guestAnswer;
  for (const player of guessers(state)) {
    let points = 0; const guess = state.guesses[player.id];
    if ((prompt.type === "pick" || prompt.type === "who") && typeof target === "string" && guess === target) points = 3;
    if (prompt.type === "rank" && Array.isArray(target) && Array.isArray(guess)) { const matches = target.reduce((sum, value, index) => sum + (guess[index] === value ? 1 : 0), 0); points = matches + (matches === target.length ? 2 : 0); }
    state.roundPoints[player.id] = points; player.score += points;
  }
  addRecap(state); state.status = "reveal"; state.message = `This is ${guest(state)?.name ?? "the Guest of Honor"}. See who called it.`;
}

async function read(code: string): Promise<Row | null> { const supabase = getSupabaseServerClient(); const { data, error } = await supabase.from("ppl_all_about_you_rooms").select("code,state,version").eq("code", code).maybeSingle(); if (error) throw new Error(error.message); return data as Row | null; }
async function save(row: Row, state: State) { const supabase = getSupabaseServerClient(); const { data, error } = await supabase.from("ppl_all_about_you_rooms").update({ state, version: row.version + 1, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86_400_000).toISOString() }).eq("code", row.code).eq("version", row.version).select("code,state,version").maybeSingle(); if (error) throw new Error(error.message); if (!data) throw new Error("The table changed. Try again."); return data as Row; }
function auth(state: State, id: string, token: string) { const player = state.players.find(candidate => candidate.id === id); if (!player || !tokenMatches(player.tokenHash, token)) throw new Error("Invalid player session."); return player; }
function project(state: State, viewer: string) {
  const me = state.players.find(player => player.id === viewer); const star = guest(state); const prompt = promptFor(state); const reveal = state.status === "reveal" || state.status === "finished";
  const canJudge = state.status === "judge" && viewer === state.guestId;
  const visibleGuesses = reveal || canJudge ? state.guesses : state.guesses[viewer] === undefined ? {} : { [viewer]: state.guesses[viewer] };
  const visibleGuestAnswer = reveal || viewer === state.guestId ? state.guestAnswer : null;
  const visibleMemories = state.status === "memory-pick" && viewer === state.guestId ? state.memoryEntries.map(entry => ({ id: entry.id, text: entry.text })) : reveal || state.status === "finished" ? state.memoryEntries.map(entry => ({ id: entry.id, text: entry.text, authorId: entry.authorId })) : state.memoryEntries.filter(entry => entry.authorId === viewer).map(entry => ({ id: entry.id, text: entry.text }));
  const whoChoices = prompt?.type === "who" ? state.players.filter(player => player.id !== state.guestId).map(player => ({ value: player.id, label: player.name })) : (prompt?.choices ?? []).map(choice => ({ value: choice, label: choice }));
  const { hostAccountId: _hostAccountId, ...publicState } = state;
  return { ...publicState, players: state.players.map(({ tokenHash: _tokenHash, ...player }) => player), guestAnswer: visibleGuestAnswer, guesses: visibleGuesses, roundPoints: reveal ? state.roundPoints : {}, memoryEntries: visibleMemories, me: me ? { id: me.id, isHost: me.id === state.hostPlayerId, isGuest: me.id === state.guestId } : null, guest: star ? { id: star.id, name: star.name } : null, currentPrompt: prompt ? { id: prompt.id, type: prompt.type, text: prompt.text, choices: whoChoices } : null, answeredCount: Object.keys(state.guesses).length, guesserCount: guessers(state).length };
}

export async function createAllAboutYouRoom(nameValue: unknown, hostAccountId: string) {
  const name = cleanName(nameValue); if (!hostAccountId) throw new Error("A signed-in host account is required.");
  for (let attempt = 0; attempt < 8; attempt++) { const code = roomCode(), token = playerToken(), id = randomUUID(); const state: State = { code, status: "lobby", hostPlayerId: id, hostAccountId, guestId: id, players: [{ id, name, tokenHash: hash(token), score: 0, seat: 0 }], round: 0, promptIds: [], guestAnswer: null, guesses: {}, roundPoints: {}, judgedPlayerIds: [], memoryEntries: [], memoryFavoriteId: null, recap: [], message: "Invite everyone, then choose tonight's Guest of Honor." }; const supabase = getSupabaseServerClient(); const { error } = await supabase.from("ppl_all_about_you_rooms").insert({ code, state, version: 1 }); if (!error) return { code, playerId: id, token, state: project(state, id) }; }
  throw new Error("Unable to create a room.");
}
export async function joinAllAboutYouRoom(codeValue: unknown, nameValue: unknown) { const code = cleanCode(codeValue), name = cleanName(nameValue), row = await read(code); if (!row) throw new Error("Room not found."); if (row.state.status !== "lobby") throw new Error("That game has already started."); if (row.state.players.length >= 10) throw new Error("That room is full."); const token = playerToken(), id = randomUUID(); row.state.players.push({ id, name, tokenHash: hash(token), score: 0, seat: row.state.players.length }); const saved = await save(row, row.state); return { code, playerId: id, token, state: project(saved.state, id) }; }
export async function recoverAllAboutYouHost(codeValue: unknown, accountId: string) { const code = cleanCode(codeValue), row = await read(code); if (!row) throw new Error("Room not found."); if (row.state.hostAccountId !== accountId) throw new Error("This signed-in account is not the host of that room."); const host = row.state.players.find(player => player.id === row.state.hostPlayerId); if (!host) throw new Error("The host seat could not be found."); const token = playerToken(); host.tokenHash = hash(token); const saved = await save(row, row.state); return { code, playerId: host.id, token, state: project(saved.state, host.id) }; }
export async function getAllAboutYouRoom(codeValue: unknown, id: string, token: string) { const code = cleanCode(codeValue), row = await read(code); if (!row) throw new Error("Room not found."); auth(row.state, id, token); return { state: project(row.state, id) }; }

export async function actAllAboutYouRoom(codeValue: unknown, id: string, token: string, action: string, payload: Record<string, unknown> = {}) {
  const code = cleanCode(codeValue), row = await read(code); if (!row) throw new Error("Room not found."); const state = row.state; const me = auth(state, id, token); const star = guest(state); const prompt = promptFor(state);
  if (action === "set-guest") { if (state.status !== "lobby" || me.id !== state.hostPlayerId) throw new Error("Only the host can choose the Guest of Honor in the lobby."); const guestId = typeof payload.guestId === "string" ? payload.guestId : ""; if (!state.players.some(player => player.id === guestId)) throw new Error("Choose someone in this room."); state.guestId = guestId; state.message = `${guest(state)?.name ?? "Guest of Honor"} is tonight's Guest of Honor.`; }
  else if (action === "start") { if (state.status !== "lobby" || me.id !== state.hostPlayerId) throw new Error("Only the host can start."); if (state.players.length < 3) throw new Error("All About You needs at least three people total."); if (!state.guestId) throw new Error("Choose the Guest of Honor first."); state.players.forEach(player => player.score = 0); state.round = 0; state.promptIds = choosePrompts(); state.recap = []; resetRound(state); }
  else if (action === "guest-answer") { if (state.status !== "guest-answer" || me.id !== state.guestId || !prompt) throw new Error("The Guest of Honor answers first."); if (prompt.type === "pick") { const value = cleanText(payload.answer, 80); if (!prompt.choices?.includes(value)) throw new Error("Choose one of the options."); state.guestAnswer = value; } else if (prompt.type === "finish") state.guestAnswer = cleanText(payload.answer, 60); else if (prompt.type === "rank") { const value = Array.isArray(payload.answer) ? payload.answer.map(String) : []; if (!prompt.choices || value.length !== prompt.choices.length || new Set(value).size !== value.length || value.some(item => !prompt.choices?.includes(item))) throw new Error("Rank every option once."); state.guestAnswer = value; } else if (prompt.type === "who") { const value = typeof payload.answer === "string" ? payload.answer : ""; if (!state.players.some(player => player.id === value && player.id !== state.guestId)) throw new Error("Choose someone at the table."); state.guestAnswer = value; } else throw new Error("This round does not use a private answer."); state.status = "guessing"; state.message = `${star?.name ?? "The Guest of Honor"} is locked in. Everyone else: make your prediction.`; }
  else if (action === "guess") { if (state.status !== "guessing" || me.id === state.guestId || !prompt) throw new Error("This answer is not open for you."); if (state.guesses[me.id] !== undefined) throw new Error("Your answer is already locked."); if (prompt.type === "pick") { const value = cleanText(payload.answer, 80); if (!prompt.choices?.includes(value)) throw new Error("Choose one of the options."); state.guesses[me.id] = value; } else if (prompt.type === "finish") state.guesses[me.id] = cleanText(payload.answer, 60); else if (prompt.type === "rank") { const value = Array.isArray(payload.answer) ? payload.answer.map(String) : []; if (!prompt.choices || value.length !== prompt.choices.length || new Set(value).size !== value.length || value.some(item => !prompt.choices?.includes(item))) throw new Error("Rank every option once."); state.guesses[me.id] = value; } else if (prompt.type === "who") { const value = typeof payload.answer === "string" ? payload.answer : ""; if (!state.players.some(player => player.id === value && player.id !== state.guestId)) throw new Error("Choose someone at the table."); state.guesses[me.id] = value; } else throw new Error("This round uses memories instead."); state.message = `${Object.keys(state.guesses).length}/${guessers(state).length} predictions locked.`; if (allGuessersAnswered(state)) { if (prompt.type === "finish") { state.status = "judge"; state.message = `${star?.name ?? "Guest of Honor"}: decide which answers are close enough to count.`; } else scoreAutomaticRound(state); } }
  else if (action === "judge-finish") { if (state.status !== "judge" || me.id !== state.guestId || prompt?.type !== "finish") throw new Error("Only the Guest of Honor can score this round."); const allowed = new Set(guessers(state).map(player => player.id)); const selected = Array.isArray(payload.playerIds) ? payload.playerIds.map(String).filter(playerId => allowed.has(playerId)) : []; state.judgedPlayerIds = [...new Set(selected)]; for (const player of guessers(state)) { const points = state.judgedPlayerIds.includes(player.id) ? 3 : 0; state.roundPoints[player.id] = points; player.score += points; } addRecap(state); state.status = "reveal"; state.message = "Close enough counts when the Guest of Honor says it does."; }
  else if (action === "memory-submit") { if (state.status !== "memory-submit" || me.id === state.guestId) throw new Error("The Guest of Honor sits this part out."); if (state.memoryEntries.some(entry => entry.authorId === me.id)) throw new Error("Your memory is already locked."); state.memoryEntries.push({ id: randomUUID(), authorId: me.id, text: cleanText(payload.text, 140) }); state.message = `${state.memoryEntries.length}/${guessers(state).length} memories locked.`; if (state.memoryEntries.length === guessers(state).length) { state.status = "memory-pick"; state.message = `${star?.name ?? "Guest of Honor"}: read the memories anonymously and choose the one that hits home tonight.`; } }
  else if (action === "memory-pick") { if (state.status !== "memory-pick" || me.id !== state.guestId) throw new Error("Only the Guest of Honor can choose the memory."); const entryId = typeof payload.entryId === "string" ? payload.entryId : ""; const entry = state.memoryEntries.find(item => item.id === entryId); if (!entry) throw new Error("Choose one of the memories."); state.memoryFavoriteId = entry.id; const author = state.players.find(player => player.id === entry.authorId); if (author) { author.score += 4; state.roundPoints[author.id] = 4; } addRecap(state, entry.text); state.status = "reveal"; state.message = author ? `${author.name} wrote the memory ${star?.name ?? "the Guest of Honor"} chose.` : "Favorite memory revealed."; }
  else if (action === "next") { if (state.status !== "reveal" || me.id !== state.hostPlayerId) throw new Error("Only the host can continue after the reveal."); if (state.round + 1 >= ROUND_ORDER.length) { state.status = "finished"; state.message = `Tonight was all about ${star?.name ?? "the Guest of Honor"}.`; } else { state.round += 1; resetRound(state); } }
  else if (action === "restart") { if (me.id !== state.hostPlayerId) throw new Error("Only the host can start over."); state.status = "lobby"; state.round = 0; state.promptIds = []; state.guestAnswer = null; state.guesses = {}; state.roundPoints = {}; state.judgedPlayerIds = []; state.memoryEntries = []; state.memoryFavoriteId = null; state.recap = []; state.players.forEach(player => player.score = 0); state.message = "Choose the Guest of Honor for the next game."; }
  else if (action === "quit") { if (me.id !== state.hostPlayerId) throw new Error("Only the host can end the room."); state.status = "closed"; state.message = "The host ended this game."; }
  else throw new Error("Unknown action.");
  const saved = await save(row, state); return { state: project(saved.state, id) };
}
