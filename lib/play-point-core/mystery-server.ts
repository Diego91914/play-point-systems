import "server-only";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 8;

const QUESTIONS = [
  { id: "where", label: "Where were you at 10:30?" },
  { id: "victim", label: "When did you last see the victim?" },
  { id: "heard", label: "Did you hear or see anything unusual?" },
  { id: "motive", label: "Did you have a reason to be angry with the victim?" },
] as const;

type QuestionId = (typeof QUESTIONS)[number]["id"];
type PromptAnswer = { mustReveal: string; mayHide?: string };
type RoleTemplate = {
  id: string;
  title: string;
  publicBio: string;
  memory: string[];
  answers: Record<QuestionId, PromptAnswer>;
  murderer?: boolean;
};

const ROLES: RoleTemplate[] = [
  {
    id: "partner",
    title: "The Business Partner",
    publicBio: "You helped the victim build Blackwood Holdings. Everyone knows the partnership had become tense.",
    memory: [
      "At 10:20 you argued with the victim in the library about missing company money.",
      "At 10:30 you were alone in the downstairs study reviewing bank records.",
      "At 10:42 you passed the kitchen and noticed the back door was partly open.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were alone in the downstairs study at 10:30.", mayHide: "You were looking for proof that company money was missing." },
      victim: { mustReveal: "You last saw the victim around 10:20 in the library during an argument." },
      heard: { mustReveal: "Around 10:42 you noticed the kitchen's back door was partly open." },
      motive: { mustReveal: "Yes. You were furious about missing company money.", mayHide: "You suspected the victim was preparing to blame you." },
    },
  },
  {
    id: "sister",
    title: "The Younger Sister",
    publicBio: "You and the victim were close once, but a recent family inheritance caused a serious rift.",
    memory: [
      "At 10:25 you went outside behind the house to make a private phone call.",
      "At 10:30 you were still outside near the garden gate.",
      "You saw someone in a dark jacket cross the back porch, but could not see the face.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were outside near the garden gate at 10:30.", mayHide: "You were making a private call about the inheritance dispute." },
      victim: { mustReveal: "You last spoke with the victim shortly after dinner, around 9:50." },
      heard: { mustReveal: "You saw someone in a dark jacket cross the back porch around 10:30, but you could not identify them." },
      motive: { mustReveal: "You were angry about the inheritance, but you insist you wanted an explanation, not revenge." },
    },
  },
  {
    id: "lawyer",
    title: "The Family Lawyer",
    publicBio: "You handle the family's legal affairs and know more about everyone's finances than anyone at the house.",
    memory: [
      "At 10:30 you were in the dining room collecting papers from your briefcase.",
      "At 10:35 the victim sent you a text: 'If anything happens, check the blue ledger.'",
      "You know the victim had recently changed the will.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the dining room with your briefcase at 10:30." },
      victim: { mustReveal: "You last saw the victim face-to-face around 10:05." },
      heard: { mustReveal: "At 10:35 the victim texted you: 'If anything happens, check the blue ledger.'" },
      motive: { mustReveal: "You had no personal feud, but you knew the victim had changed the will.", mayHide: "You have not told the family who benefits from the new will." },
    },
  },
  {
    id: "chef",
    title: "The Private Chef",
    publicBio: "You worked the dinner and knew the victim's habits, including exactly what they ate and drank.",
    memory: [
      "At 10:30 you were cleaning the kitchen.",
      "The victim drank red wine all evening, never whiskey.",
      "At about 10:38 you found a whiskey glass in the sink that had not been there earlier.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were cleaning the kitchen at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:15 carrying a glass of red wine toward the library." },
      heard: { mustReveal: "Around 10:38 you found a whiskey glass in the sink that had not been there earlier." },
      motive: { mustReveal: "You were upset because the victim planned to replace you after tonight's dinner." },
    },
  },
  {
    id: "neighbor",
    title: "The Neighbor",
    publicBio: "You were invited at the last minute. Your property dispute with the victim was hardly a secret.",
    memory: [
      "At 10:30 you were in the front sitting room.",
      "You heard a heavy thump upstairs at approximately 10:34.",
      "At 10:36 you saw the family lawyer in the dining room.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the front sitting room at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:10 near the staircase." },
      heard: { mustReveal: "You heard a heavy thump upstairs around 10:34." },
      motive: { mustReveal: "Yes. You had an ugly property-line dispute with the victim." },
    },
  },
  {
    id: "assistant",
    title: "The Personal Assistant",
    publicBio: "You managed the victim's calendar, messages, and secrets. You knew where everyone was supposed to be tonight.",
    memory: [
      "At 10:30 you were in the upstairs hall delivering a folder to the guest room.",
      "You heard the library door close downstairs shortly before 10:32.",
      "Earlier, you saw the victim hide a small brass key inside a blue book.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the upstairs hall at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:18 in the library." },
      heard: { mustReveal: "You heard the library door close shortly before 10:32." },
      motive: { mustReveal: "You had learned the victim planned to fire you next week.", mayHide: "You copied several private files before dinner." },
    },
  },
  {
    id: "cousin",
    title: "The Cousin",
    publicBio: "You arrived hoping the victim would finally repay a large personal loan.",
    memory: [
      "At 10:30 you were in the billiard room.",
      "At 10:33 you saw the business partner leave the study looking angry.",
      "You owe money yourself and desperately needed the victim to repay you.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the billiard room at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:12 and asked about the unpaid loan." },
      heard: { mustReveal: "Around 10:33 you saw the business partner leave the study looking angry." },
      motive: { mustReveal: "Yes. The victim owed you a large amount of money and you urgently needed it." },
    },
  },
  {
    id: "murderer",
    title: "The Old Friend",
    publicBio: "You and the victim had known each other for decades. Tonight, old history came back to the surface.",
    murderer: true,
    memory: [
      "You killed the victim in the library at approximately 10:33 after being confronted about money you stole years ago.",
      "Your cover story: you claim you were in the downstairs bathroom from 10:25 until 10:40.",
      "You wore a dark jacket and briefly crossed the back porch after the murder.",
      "You rinsed a whiskey glass in the kitchen to create a false trail.",
      "Your goal is to survive the final accusation. Keep your story consistent.",
    ],
    answers: {
      where: { mustReveal: "Use your cover story: you were in the downstairs bathroom at 10:30.", mayHide: "In reality, you were in the library with the victim." },
      victim: { mustReveal: "Say you last saw the victim around 9:55 after dinner.", mayHide: "In reality, you confronted the victim again at 10:33." },
      heard: { mustReveal: "Say you heard nothing unusual while you were in the bathroom.", mayHide: "You crossed the back porch and rinsed a whiskey glass afterward." },
      motive: { mustReveal: "Admit you had an old disagreement, but describe it as settled years ago.", mayHide: "The victim had discovered you stole money and intended to expose you." },
    },
  },
];

const EVIDENCE = [
  {
    title: "A strange glass",
    publicText: "A whiskey glass was found freshly rinsed in the kitchen sink. The victim had no whiskey in their glass when the body was discovered.",
    privateByRole: { chef: "You know the victim drank only red wine tonight. That whiskey glass does not belong in the victim's normal routine." },
  },
  {
    title: "The back porch",
    publicText: "A damp shoe print was found just inside the back door. The tread is from a dress shoe, not a boot or sneaker.",
    privateByRole: { sister: "You remember the person in the dark jacket crossed the back porch at roughly the right time." },
  },
  {
    title: "The blue ledger",
    publicText: "Police found a blue financial ledger hidden in the library. One entry documents a large theft from years ago tied to someone in the victim's personal circle.",
    privateByRole: { lawyer: "The victim's 10:35 message about the blue ledger now makes sense. They believed the ledger was dangerous evidence." },
  },
] as const;

type Player = { id: string; name: string; tokenHash: string; seat: number; roleId?: string };
type PendingQuestion = { questionerId: string; targetId: string; questionId: QuestionId };
type State = {
  code: string;
  status: "lobby" | "interrogation" | "evidence" | "accusation" | "reveal";
  hostPlayerId: string;
  hostAccountId: string;
  players: Player[];
  turnIndex: number;
  interrogationCount: number;
  pendingQuestion: PendingQuestion | null;
  evidenceIndex: number;
  evidenceAcknowledged: string[];
  votes: Record<string, string>;
  message: string;
};
type Row = { code: string; state: State; version: number };

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function tokenMatches(expected: string, token: string) {
  const a = Buffer.from(hash(token), "hex"), b = Buffer.from(expected, "hex");
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
  return Array.from(bytes, value => ALPHABET[value % ALPHABET.length]).join("");
}
const playerToken = () => randomBytes(32).toString("base64url");
function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function auth(state: State, id: string, token: string) {
  const player = state.players.find(p => p.id === id);
  if (!player || !tokenMatches(player.tokenHash, token)) throw new Error("Invalid player session.");
  return player;
}
function currentQuestioner(state: State) {
  if (!state.players.length) return null;
  return state.players[state.turnIndex % state.players.length] ?? null;
}
function roleFor(player: Player) {
  return ROLES.find(role => role.id === player.roleId) ?? null;
}
async function read(code: string): Promise<Row | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_mystery_rooms").select("code,state,version").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Row | null;
}
async function save(row: Row, state: State) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_mystery_rooms").update({
    state,
    version: row.version + 1,
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  }).eq("code", row.code).eq("version", row.version).select("code,state,version").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The room changed. Try again.");
  return data as Row;
}
function assignRoles(state: State) {
  const innocentPool = shuffle(ROLES.filter(role => !role.murderer));
  const chosen = shuffle([ROLES.find(role => role.murderer)!, ...innocentPool.slice(0, state.players.length - 1)]);
  state.players.forEach((player, index) => { player.roleId = chosen[index].id; });
}
function project(state: State, viewerId: string) {
  const viewer = state.players.find(p => p.id === viewerId)!;
  const role = roleFor(viewer);
  const questioner = currentQuestioner(state);
  const pending = state.pendingQuestion;
  const isTarget = pending?.targetId === viewerId;
  const pendingRole = isTarget ? role : null;
  const pendingAnswer = pendingRole && pending ? pendingRole.answers[pending.questionId] : null;
  const evidence = state.status === "evidence" && state.evidenceIndex >= 0 ? EVIDENCE[state.evidenceIndex] : null;
  const privateEvidence = evidence && role ? evidence.privateByRole[role.id as keyof typeof evidence.privateByRole] : undefined;
  const murderer = state.status === "reveal" ? state.players.find(p => roleFor(p)?.murderer) : null;
  const voteCounts = state.status === "reveal" ? Object.values(state.votes).reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {}) : {};
  return {
    code: state.code,
    status: state.status,
    players: state.players.map(({ tokenHash: _tokenHash, roleId: _roleId, ...player }) => player),
    message: state.message,
    currentQuestioner: questioner ? { id: questioner.id, name: questioner.name } : null,
    pendingQuestion: pending ? {
      questioner: state.players.find(p => p.id === pending.questionerId)?.name ?? "Player",
      target: state.players.find(p => p.id === pending.targetId)?.name ?? "Player",
      questionId: pending.questionId,
      questionLabel: QUESTIONS.find(q => q.id === pending.questionId)?.label ?? "Question",
      isTarget,
      answerPrompt: isTarget && pendingAnswer ? pendingAnswer : null,
    } : null,
    questions: state.status === "interrogation" && questioner?.id === viewerId && !pending ? QUESTIONS : [],
    evidence: evidence ? {
      index: state.evidenceIndex + 1,
      total: EVIDENCE.length,
      title: evidence.title,
      publicText: evidence.publicText,
      privateText: privateEvidence ?? null,
      acknowledged: state.evidenceAcknowledged.includes(viewerId),
    } : null,
    votesCast: Object.keys(state.votes).length,
    myVote: state.votes[viewerId] ?? null,
    reveal: murderer ? {
      murderer: { id: murderer.id, name: murderer.name, role: roleFor(murderer)?.title ?? "The murderer" },
      voteCounts,
      solvedBy: state.players.filter(player => state.votes[player.id] === murderer.id).map(player => player.name),
    } : null,
    me: {
      id: viewerId,
      isHost: state.hostPlayerId === viewerId,
      role: role ? {
        title: role.title,
        publicBio: role.publicBio,
        memory: role.memory,
        isMurderer: Boolean(role.murderer),
      } : null,
    },
  };
}

export async function createMysteryRoom(nameValue: unknown, hostAccountId: string) {
  const name = cleanName(nameValue);
  if (!hostAccountId) throw new Error("A signed-in host account is required.");
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = roomCode(), token = playerToken(), id = randomUUID();
    const state: State = {
      code,
      status: "lobby",
      hostPlayerId: id,
      hostAccountId,
      players: [{ id, name, tokenHash: hash(token), seat: 0 }],
      turnIndex: 0,
      interrogationCount: 0,
      pendingQuestion: null,
      evidenceIndex: -1,
      evidenceAcknowledged: [],
      votes: {},
      message: "Invite 4–8 players. The phone will be the brain and guide once the mystery begins.",
    };
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("ppl_mystery_rooms").insert({ code, state, version: 1 });
    if (!error) return { code, playerId: id, token, state: project(state, id) };
  }
  throw new Error("Unable to create a room.");
}

export async function joinMysteryRoom(codeValue: unknown, nameValue: unknown) {
  const code = cleanCode(codeValue), name = cleanName(nameValue), row = await read(code);
  if (!row) throw new Error("Room not found.");
  if (row.state.status !== "lobby") throw new Error("That mystery has already started.");
  if (row.state.players.length >= MAX_PLAYERS) throw new Error("That room is full.");
  const token = playerToken(), id = randomUUID();
  row.state.players.push({ id, name, tokenHash: hash(token), seat: row.state.players.length });
  const saved = await save(row, row.state);
  return { code, playerId: id, token, state: project(saved.state, id) };
}

export async function getMysteryRoom(codeValue: unknown, id: string, token: string) {
  const code = cleanCode(codeValue), row = await read(code);
  if (!row) throw new Error("Room not found.");
  auth(row.state, id, token);
  return { state: project(row.state, id) };
}

export async function actMysteryRoom(codeValue: unknown, id: string, token: string, action: string, payload: Record<string, unknown> = {}) {
  const code = cleanCode(codeValue), row = await read(code);
  if (!row) throw new Error("Room not found.");
  const state = row.state;
  auth(state, id, token);

  if (action === "start") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can start.");
    if (state.players.length < MIN_PLAYERS) throw new Error("This mystery needs at least 4 players.");
    assignRoles(state);
    state.status = "interrogation";
    state.turnIndex = Math.floor(Math.random() * state.players.length);
    state.interrogationCount = 0;
    state.pendingQuestion = null;
    state.evidenceIndex = -1;
    state.evidenceAcknowledged = [];
    state.votes = {};
    state.message = `${currentQuestioner(state)?.name ?? "A player"} begins the investigation.`;
  } else if (action === "ask") {
    if (state.status !== "interrogation" || state.pendingQuestion) throw new Error("A question is already in progress.");
    const questioner = currentQuestioner(state);
    if (!questioner || questioner.id !== id) throw new Error("It is not your turn to question someone.");
    const targetId = typeof payload.targetId === "string" ? payload.targetId : "";
    const questionId = typeof payload.questionId === "string" ? payload.questionId as QuestionId : "" as QuestionId;
    if (!state.players.some(player => player.id === targetId) || targetId === id) throw new Error("Choose another player.");
    if (!QUESTIONS.some(question => question.id === questionId)) throw new Error("Choose a valid question.");
    state.pendingQuestion = { questionerId: id, targetId, questionId };
    state.message = `${state.players.find(p => p.id === targetId)?.name ?? "The suspect"}'s phone has the answer guidance.`;
  } else if (action === "answered") {
    const pending = state.pendingQuestion;
    if (state.status !== "interrogation" || !pending) throw new Error("There is no active question.");
    if (pending.targetId !== id) throw new Error("Only the person who was questioned can finish this turn.");
    state.pendingQuestion = null;
    state.interrogationCount += 1;
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
    if (state.interrogationCount % state.players.length === 0) {
      state.evidenceIndex += 1;
      state.evidenceAcknowledged = [];
      state.status = "evidence";
      state.message = "New evidence has interrupted the interrogation.";
    } else {
      state.message = `${currentQuestioner(state)?.name ?? "The next player"}, choose someone to question.`;
    }
  } else if (action === "ack-evidence") {
    if (state.status !== "evidence") throw new Error("There is no evidence to acknowledge.");
    if (!state.evidenceAcknowledged.includes(id)) state.evidenceAcknowledged.push(id);
    if (state.evidenceAcknowledged.length >= state.players.length) {
      state.evidenceAcknowledged = [];
      if (state.evidenceIndex >= EVIDENCE.length - 1) {
        state.status = "accusation";
        state.message = "Investigation complete. Everyone must secretly accuse one player.";
      } else {
        state.status = "interrogation";
        state.message = `${currentQuestioner(state)?.name ?? "The next player"}, continue the investigation.`;
      }
    }
  } else if (action === "vote") {
    if (state.status !== "accusation") throw new Error("It is not time to accuse yet.");
    const targetId = typeof payload.targetId === "string" ? payload.targetId : "";
    if (!state.players.some(player => player.id === targetId)) throw new Error("Choose a player to accuse.");
    state.votes[id] = targetId;
    if (Object.keys(state.votes).length >= state.players.length) {
      state.status = "reveal";
      state.message = "All accusations are locked. The truth is revealed.";
    }
  } else if (action === "restart") {
    if (state.hostPlayerId !== id) throw new Error("Only the host can start over.");
    state.status = "lobby";
    state.players.forEach(player => { delete player.roleId; });
    state.turnIndex = 0;
    state.interrogationCount = 0;
    state.pendingQuestion = null;
    state.evidenceIndex = -1;
    state.evidenceAcknowledged = [];
    state.votes = {};
    state.message = "Mystery reset. Everyone remains in the room; start when 4–8 players are ready.";
  } else {
    throw new Error("Unknown action.");
  }

  const saved = await save(row, state);
  return { state: project(saved.state, id) };
}
