import "server-only";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 8;

type AnswerKey = "where" | "victim" | "heard" | "motive" | "after" | "before" | "secret" | "money" | "door" | "drink" | "ledger" | "suspect";
type PromptAnswer = { mustReveal: string; mayHide?: string };
type QuestionTemplate = { id: string; label: string; answerKey: AnswerKey; minEvidence: number };

const QUESTIONS: QuestionTemplate[] = [
  { id: "where", label: "Where were you at 10:30?", answerKey: "where", minEvidence: -1 },
  { id: "victim", label: "When did you last see the victim?", answerKey: "victim", minEvidence: -1 },
  { id: "motive", label: "Did you have a reason to be angry with the victim?", answerKey: "motive", minEvidence: -1 },
  { id: "before", label: "What were you doing just before 10:30?", answerKey: "before", minEvidence: -1 },
  { id: "after", label: "What did you do immediately after 10:30?", answerKey: "after", minEvidence: -1 },
  { id: "secret", label: "What are you not telling everyone?", answerKey: "secret", minEvidence: -1 },
  { id: "alibi", label: "Who can verify your alibi?", answerKey: "where", minEvidence: 0 },
  { id: "timeline", label: "Walk us through 10:25 to 10:40.", answerKey: "after", minEvidence: 0 },
  { id: "relationship", label: "What was your relationship with the victim really like?", answerKey: "motive", minEvidence: 0 },
  { id: "last_words", label: "What was the last important thing the victim said to you?", answerKey: "victim", minEvidence: 0 },
  { id: "library", label: "What do you know about the library around the time of death?", answerKey: "heard", minEvidence: 0 },
  { id: "opportunity", label: "Could you have reached the library between 10:31 and 10:35?", answerKey: "where", minEvidence: 0 },
  { id: "drink", label: "What do you know about the victim's drinks tonight?", answerKey: "drink", minEvidence: 1 },
  { id: "glass", label: "Did you handle or notice a whiskey glass tonight?", answerKey: "drink", minEvidence: 1 },
  { id: "whiskey_owner", label: "Who was actually drinking whiskey tonight?", answerKey: "drink", minEvidence: 1 },
  { id: "door", label: "What do you know about the back door or porch?", answerKey: "door", minEvidence: 2 },
  { id: "porch_route", label: "Could you have used the back porch after 10:30?", answerKey: "door", minEvidence: 2 },
  { id: "dark_jacket", label: "Who was wearing or could have been wearing a dark jacket?", answerKey: "suspect", minEvidence: 2 },
  { id: "suspect", label: "Who seems most suspicious to you right now, and why?", answerKey: "suspect", minEvidence: 2 },
  { id: "money", label: "Did money connect you to the victim?", answerKey: "money", minEvidence: 3 },
  { id: "old_money", label: "What do you know about an old theft or old financial dispute?", answerKey: "money", minEvidence: 3 },
  { id: "ledger", label: "What do you know about the blue ledger?", answerKey: "ledger", minEvidence: 3 },
  { id: "ledger_entry", label: "What does the ledger's phrase 'Old friend' mean to you?", answerKey: "ledger", minEvidence: 3 },
  { id: "final_pressure", label: "What fact makes you look worst now that all the evidence is in?", answerKey: "secret", minEvidence: 3 },
];

type RoleTemplate = {
  id: string;
  title: string;
  publicBio: string;
  memory: string[];
  answers: Record<AnswerKey, PromptAnswer>;
  murderer?: boolean;
  core?: boolean;
};

const ROLES: RoleTemplate[] = [
  {
    id: "partner", title: "The Business Partner", core: true,
    publicBio: "You helped the victim build Blackwood Holdings. Everyone knows the partnership had become tense.",
    memory: [
      "You and the victim built Blackwood Holdings together, but the books stopped making sense months ago.",
      "At 10:20 you argued with the victim in the library about missing company money.",
      "At 10:25 you left the library and went to the downstairs study with copies of bank records.",
      "At 10:30 you were alone in the study reviewing those records.",
      "Around 10:33 you stepped into the hall, angry and frustrated, then returned to the study.",
      "At 10:42 you passed the kitchen and noticed the back door was partly open.",
      "Your secret: you had begun quietly collecting evidence because you feared the victim planned to blame you for the missing money.",
      "Earlier you texted a forensic accountant: 'If he doesn't change his mind tonight, I'll handle it myself.' You meant you would order an outside audit.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were alone in the downstairs study at 10:30.", mayHide: "You were examining copied bank records." },
      victim: { mustReveal: "You last saw the victim around 10:20 during a heated library argument." },
      heard: { mustReveal: "You did not hear the murder. Around 10:42 you noticed the kitchen back door partly open." },
      motive: { mustReveal: "You were furious about missing company money.", mayHide: "You feared the victim planned to make you the scapegoat." },
      after: { mustReveal: "You stayed around the study, briefly stepped into the hall near 10:33, then returned to the records." },
      before: { mustReveal: "You had just left a heated argument and gone to the study." },
      secret: { mustReveal: "You were privately investigating the company's missing money.", mayHide: "You copied records and contacted a forensic accountant." },
      money: { mustReveal: "The current company money problem gave you a strong motive, but it is separate from the decades-old theft in the blue ledger." },
      door: { mustReveal: "At about 10:42 you saw the kitchen back door partly open. You did not open it." },
      drink: { mustReveal: "You remember the victim carrying red wine. You did not see the victim drink whiskey." },
      ledger: { mustReveal: "You had never seen the blue ledger. Its old theft predates your current partnership dispute." },
      suspect: { mustReveal: "The Old Friend bothers you because the victim had recently become tense whenever that person's name came up." },
    },
  },
  {
    id: "sister", title: "The Younger Sister", core: true,
    publicBio: "You and the victim were close once, but a recent family inheritance caused a serious rift.",
    memory: [
      "At 9:50 you confronted the victim about a changed inheritance.",
      "At 10:25 you went outside to make a private call to a family accountant.",
      "At 10:30 you were near the garden gate.",
      "Around 10:35 you saw someone in a dark jacket cross the back porch quickly toward the kitchen entrance. You could not see the face.",
      "Your secret is that you suspected part of the inheritance was being hidden.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were outside near the garden gate at 10:30.", mayHide: "You were on a private inheritance call." },
      victim: { mustReveal: "You last spoke directly with the victim around 9:50 during an inheritance argument." },
      heard: { mustReveal: "Around 10:35 you saw a dark-jacket figure cross the back porch quickly toward the kitchen entrance." },
      motive: { mustReveal: "You were angry about the inheritance, but wanted an accounting rather than revenge." },
      after: { mustReveal: "You remained outside, saw the dark-jacket figure, then came back toward the house." },
      before: { mustReveal: "You went outside around 10:25 for a private call." },
      secret: { mustReveal: "The call concerned the inheritance.", mayHide: "You contacted an accountant because you suspected hidden money." },
      money: { mustReveal: "The inheritance gave you an obvious financial motive, but it has nothing to do with the old theft in the ledger." },
      door: { mustReveal: "You saw the dark-jacket figure cross the back porch around 10:35." },
      drink: { mustReveal: "You remember the victim drinking red wine, never whiskey." },
      ledger: { mustReveal: "You had heard the victim mention a private ledger once but did not know what was in it." },
      suspect: { mustReveal: "The dark-jacket figure is your strongest lead. Focus on who could fit that description." },
    },
  },
  {
    id: "chef", title: "The Private Chef", core: true,
    publicBio: "You worked dinner and knew the victim's food and drink habits unusually well.",
    memory: [
      "The victim drank red wine all evening and specifically disliked whiskey.",
      "At 10:15 you saw the victim carry red wine toward the library.",
      "At 10:30 you were cleaning the kitchen.",
      "At about 10:38 you found a freshly rinsed whiskey glass in the sink that had not been there earlier.",
      "The kitchen back door was not fully latched.",
      "Your secret: the victim had told you your services would no longer be needed after tonight.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were cleaning the kitchen at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:15 carrying red wine toward the library." },
      heard: { mustReveal: "Around 10:38 you found a freshly rinsed whiskey glass that had not been there earlier." },
      motive: { mustReveal: "The victim had just told you they planned to replace you." },
      after: { mustReveal: "You continued cleaning and around 10:38 noticed the whiskey glass and poorly latched back door." },
      before: { mustReveal: "You were clearing dinner service and cleaning before 10:30." },
      secret: { mustReveal: "The victim had effectively fired you from future work." },
      money: { mustReveal: "Losing the client cost you income, but you were not tied to the old theft." },
      door: { mustReveal: "The kitchen back door was not fully latched when you found the glass." },
      drink: { mustReveal: "The victim disliked whiskey and drank red wine all evening. The rinsed whiskey glass was someone else's." },
      ledger: { mustReveal: "You know nothing firsthand about the blue ledger." },
      suspect: { mustReveal: "Anyone tied to the whiskey glass and back door deserves scrutiny." },
    },
  },
  {
    id: "murderer", title: "The Old Friend", core: true, murderer: true,
    publicBio: "You and the victim had known each other for decades. Tonight, old history came back to the surface.",
    memory: [
      "You are the murderer. Decades ago you stole money from a venture you shared with the victim.",
      "At about 10:28 you entered the library for a private conversation.",
      "The victim confronted you with the blue ledger and threatened to expose you the next morning.",
      "At approximately 10:33 the confrontation turned violent and you killed the victim.",
      "Your cover story is that you were in the downstairs bathroom from 10:25 until about 10:40.",
      "After the murder you crossed the back porch wearing your dark jacket, entered near the kitchen, and rinsed your whiskey glass.",
      "Your goal is to survive the accusation. Keep the cover story consistent unless the phone requires a fact.",
    ],
    answers: {
      where: { mustReveal: "Use your cover story: you were in the downstairs bathroom at 10:30.", mayHide: "In reality, you were in the library." },
      victim: { mustReveal: "Say you last saw the victim around 9:55 after dinner.", mayHide: "You met again in the library around 10:28." },
      heard: { mustReveal: "Say you heard nothing unusual from the bathroom.", mayHide: "You know what happened because you were in the library." },
      motive: { mustReveal: "Admit an old disagreement but describe it as settled years ago.", mayHide: "The victim had proof you stole money and planned to expose you." },
      after: { mustReveal: "Claim you stayed in the bathroom until roughly 10:40.", mayHide: "You crossed the porch and rinsed your whiskey glass." },
      before: { mustReveal: "Claim you stepped away around 10:25 to use the bathroom.", mayHide: "You actually went to the library." },
      secret: { mustReveal: "Say your only secret is an old financial disagreement you believed was settled.", mayHide: "It was theft, the victim had proof, and you killed them." },
      money: { mustReveal: "Acknowledge an old money dispute but insist it was resolved.", mayHide: "You stole the money and never truly repaid it." },
      door: { mustReveal: "Say you know nothing about the back door or porch.", mayHide: "You crossed the back porch after the murder." },
      drink: { mustReveal: "Admit you drank whiskey earlier and say you left your glass somewhere downstairs.", mayHide: "You rinsed that glass after the murder." },
      ledger: { mustReveal: "Say you had heard of private financial records but never saw the blue ledger.", mayHide: "The victim confronted you with it immediately before the murder." },
      suspect: { mustReveal: "Point out that several people had obvious motives tonight.", mayHide: "Spread suspicion without inventing unnecessary details." },
    },
  },
  {
    id: "lawyer", title: "The Family Lawyer",
    publicBio: "You handle the family's legal affairs and know more about everyone's finances than anyone at the house.",
    memory: [
      "At 10:05 you met the victim about the will and financial irregularities.",
      "At 10:30 you were in the dining room with your briefcase.",
      "At 10:35 the victim's phone sent a delayed message: 'If anything happens, check the blue ledger.'",
      "You know who benefits from the revised will and have not told the family.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the dining room with your briefcase at 10:30." },
      victim: { mustReveal: "You last saw the victim face-to-face around 10:05." },
      heard: { mustReveal: "At 10:35 the victim's phone sent a delayed message telling you to check the blue ledger." },
      motive: { mustReveal: "You had no personal feud, but your knowledge of the new will makes you look involved." },
      after: { mustReveal: "You remained in or near the dining room gathering papers." },
      before: { mustReveal: "You were organizing legal papers before 10:30." },
      secret: { mustReveal: "You know details of the revised will the family does not know." },
      money: { mustReveal: "You handled financial documents but were not personally owed money." },
      door: { mustReveal: "You did not use the back door and have no firsthand porch information." },
      drink: { mustReveal: "You remember the victim drinking red wine, not whiskey." },
      ledger: { mustReveal: "The victim's delayed message specifically directed you to the blue ledger." },
      suspect: { mustReveal: "The message makes you think the murder is tied to an old financial secret." },
    },
  },
  {
    id: "assistant", title: "The Personal Assistant",
    publicBio: "You managed the victim's calendar, messages, and secrets.",
    memory: [
      "At 10:18 you saw the victim alone in the library, visibly tense.",
      "Earlier you saw the victim hide a small brass key inside a blue book.",
      "At 10:30 you were upstairs delivering a folder.",
      "Shortly before 10:32 you heard the library door close downstairs.",
      "Your secret: you copied private files because you learned the victim planned to fire you.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the upstairs hall at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:18 in the library." },
      heard: { mustReveal: "You heard the library door close shortly before 10:32." },
      motive: { mustReveal: "You had learned the victim planned to fire you next week." },
      after: { mustReveal: "You finished delivering the folder upstairs and came back down several minutes later." },
      before: { mustReveal: "You were carrying a folder upstairs just before 10:30." },
      secret: { mustReveal: "You copied private files after learning you were about to be fired." },
      money: { mustReveal: "Losing your job mattered financially, but you were not tied to the old theft." },
      door: { mustReveal: "You have no firsthand porch knowledge, but you heard the library door close before 10:32." },
      drink: { mustReveal: "You remember the victim with red wine in the library earlier." },
      ledger: { mustReveal: "You saw the victim hide a brass key in a blue book, but did not know what it unlocked." },
      suspect: { mustReveal: "Someone entered or left the library shortly before 10:32. That timing matters." },
    },
  },
  {
    id: "cousin", title: "The Cousin",
    publicBio: "You arrived hoping the victim would finally repay a large personal loan.",
    memory: [
      "At 10:12 you confronted the victim about an unpaid loan.",
      "At 10:30 you were in the billiard room.",
      "Around 10:33 you saw the Business Partner step into the hall looking angry, then return to the study.",
      "You are in deeper financial trouble than anyone realizes.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the billiard room at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:12 when you demanded repayment." },
      heard: { mustReveal: "Around 10:33 you saw the Business Partner step into the hall looking angry, then return to the study." },
      motive: { mustReveal: "The victim owed you a large amount of money and you desperately needed it." },
      after: { mustReveal: "You stayed in the billiard room and later saw people moving through the hall." },
      before: { mustReveal: "You were brooding over the unpaid loan before 10:30." },
      secret: { mustReveal: "You are in serious financial trouble." },
      money: { mustReveal: "The victim owed you a large personal loan, but it is unrelated to the decades-old theft." },
      door: { mustReveal: "You did not use the back door." },
      drink: { mustReveal: "You saw the victim with red wine earlier." },
      ledger: { mustReveal: "You knew the victim kept financial records but had never heard 'blue ledger.'" },
      suspect: { mustReveal: "The Business Partner looked angry around 10:33, although you never saw that person enter the library." },
    },
  },
  {
    id: "neighbor", title: "The Neighbor",
    publicBio: "Your property dispute with the victim was hardly a secret.",
    memory: [
      "At 10:10 you saw the victim near the staircase.",
      "At 10:30 you were in the front sitting room.",
      "Around 10:34 you heard a heavy thump from the library side of the house.",
      "At 10:36 you saw the Family Lawyer in the dining room.",
      "Your secret: you had threatened the victim with an expensive lawsuit.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the front sitting room at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:10 near the staircase." },
      heard: { mustReveal: "Around 10:34 you heard a heavy thump from the library side of the house." },
      motive: { mustReveal: "You had an ugly property dispute and had threatened a lawsuit." },
      after: { mustReveal: "You stayed in the sitting room, then saw the Family Lawyer in the dining room around 10:36." },
      before: { mustReveal: "You were alone in the front sitting room before 10:30." },
      secret: { mustReveal: "You recently threatened the victim with a costly lawsuit." },
      money: { mustReveal: "The property dispute could cost substantial money, but it is unrelated to the old theft." },
      door: { mustReveal: "You were nowhere near the back door." },
      drink: { mustReveal: "You remember the victim with red wine, not whiskey." },
      ledger: { mustReveal: "You know nothing firsthand about the blue ledger." },
      suspect: { mustReveal: "The heavy thump near 10:34 makes whoever was near the library especially suspicious." },
    },
  },
];

const CORE_ROLE_IDS = ["murderer", "partner", "sister", "chef"] as const;
const OPTIONAL_ROLE_IDS = ["lawyer", "assistant", "cousin", "neighbor"] as const;

type Interruption = { label: "Suspicious information" | "Clarification"; title: string; text: string };
const EVIDENCE = [
  {
    title: "The time of death",
    publicText: "The fatal event occurred between 10:31 and 10:35 in the library. Any alibi covering those four minutes matters.",
    privateByRole: { partner: "Your argument ended well before the likely time of death.", sister: "The dark-jacket figure crossed the porch near the end of this window.", chef: "You were working in the kitchen during most of this window." },
    interruption: { label: "Suspicious information", title: "A deleted text", text: "A deleted message from the Business Partner reads: 'If he doesn't change his mind tonight, I'll handle it myself.' Investigators do not yet know what 'handle it' means." } as Interruption,
  },
  {
    title: "The rinsed whiskey glass",
    publicText: "A freshly rinsed whiskey glass was found in the kitchen sink shortly after the murder. Multiple witnesses remember the victim drinking red wine, not whiskey.",
    privateByRole: { chef: "You are certain the victim disliked whiskey. Someone else rinsed that glass.", sister: "The glass appeared only minutes after you saw the dark-jacket figure head toward the kitchen side." },
    interruption: null,
  },
  {
    title: "The back porch",
    publicText: "A damp dress-shoe print was found just inside the back door. A witness saw a dark-jacket figure cross the porch around 10:35.",
    privateByRole: { sister: "You are that witness. The figure moved from the library side toward the kitchen entrance.", partner: "This fits the partly open back door you noticed later." },
    interruption: { label: "Clarification", title: "The deleted text is explained", text: "Phone records show the Business Partner sent the deleted message to a forensic accountant. 'I'll handle it myself' referred to ordering an outside audit if the victim refused to cooperate. Suspicious, but not a murder threat." } as Interruption,
  },
  {
    title: "The blue ledger",
    publicText: "A locked blue ledger documents a decades-old theft by someone in the victim's personal circle. Beside the entry: 'Old friend. Last chance to make this right.'",
    privateByRole: { lawyer: "The victim's delayed message points directly to this old theft.", partner: "This theft predates your current partnership dispute.", assistant: "The brass key you saw likely opened this ledger." },
    interruption: null,
  },
] as const;

type Player = { id: string; name: string; tokenHash: string; seat: number; roleId?: string };
type PendingQuestion = { questionerId: string; targetId: string; questionId: string };
type InterviewRecord = { questionerId: string; targetId: string; questionId: string; questionLabel: string; answer: string };
type State = {
  code: string;
  status: "lobby" | "interrogation" | "evidence" | "accusation" | "reveal";
  hostPlayerId: string;
  hostAccountId: string;
  players: Player[];
  turnIndex: number;
  interrogationCount: number;
  pendingQuestion: PendingQuestion | null;
  asked: InterviewRecord[];
  evidenceIndex: number;
  evidenceAcknowledged: string[];
  votes: Record<string, string>;
  message: string;
};
type Row = { code: string; state: State; version: number };

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function tokenMatches(expected: string, token: string) { const a = Buffer.from(hash(token), "hex"), b = Buffer.from(expected, "hex"); return a.length === b.length && timingSafeEqual(a, b); }
function cleanName(value: unknown) { const name = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""; if (!name || name.length > 24) throw new Error("Enter a name up to 24 characters."); return name; }
function cleanCode(value: unknown) { const code = typeof value === "string" ? value.trim().toUpperCase() : ""; if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Enter a valid 6-character room code."); return code; }
function roomCode() { const bytes = randomBytes(6); return Array.from(bytes, value => ALPHABET[value % ALPHABET.length]).join(""); }
const playerToken = () => randomBytes(32).toString("base64url");
function shuffle<T>(items: T[]) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function normalize(state: State) { if (!Array.isArray(state.asked)) state.asked = []; return state; }
function auth(state: State, id: string, token: string) { const player = state.players.find(p => p.id === id); if (!player || !tokenMatches(player.tokenHash, token)) throw new Error("Invalid player session."); return player; }
function currentQuestioner(state: State) { return state.players.length ? state.players[state.turnIndex % state.players.length] ?? null : null; }
function roleFor(player: Player) { return ROLES.find(role => role.id === player.roleId) ?? null; }
function questionFor(id: string) { return QUESTIONS.find(q => q.id === id) ?? null; }
function questionOptions(state: State, targetId: string) {
  const unlocked = QUESTIONS.filter(q => q.minEvidence <= state.evidenceIndex && !state.asked.some(a => a.targetId === targetId && a.questionId === q.id));
  const offset = unlocked.length > 6 ? state.interrogationCount % Math.max(1, unlocked.length - 5) : 0;
  return unlocked.slice(offset, offset + 6);
}
async function read(code: string): Promise<Row | null> { const supabase = getSupabaseServerClient(); const { data, error } = await supabase.from("ppl_mystery_rooms").select("code,state,version").eq("code", code).maybeSingle(); if (error) throw new Error(error.message); if (!data) return null; const row = data as Row; normalize(row.state); return row; }
async function save(row: Row, state: State) { const supabase = getSupabaseServerClient(); const { data, error } = await supabase.from("ppl_mystery_rooms").update({ state, version: row.version + 1, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() }).eq("code", row.code).eq("version", row.version).select("code,state,version").maybeSingle(); if (error) throw new Error(error.message); if (!data) throw new Error("The room changed. Try again."); return data as Row; }
function assignRoles(state: State) { const core = CORE_ROLE_IDS.map(id => ROLES.find(role => role.id === id)!).filter(Boolean); const optional = shuffle(OPTIONAL_ROLE_IDS.map(id => ROLES.find(role => role.id === id)!).filter(Boolean)); const chosen = shuffle([...core, ...optional.slice(0, Math.max(0, state.players.length - core.length))]); state.players.forEach((player, index) => { player.roleId = chosen[index].id; }); }

function caseFile(state: State, viewer: Player) {
  const role = roleFor(viewer);
  const evidence = EVIDENCE.slice(0, Math.max(0, state.evidenceIndex + 1)).map((item, index) => ({ index: index + 1, title: item.title, text: item.publicText }));
  const privateClues = role ? EVIDENCE.slice(0, Math.max(0, state.evidenceIndex + 1)).flatMap((item, index) => { const text = item.privateByRole[role.id as keyof typeof item.privateByRole]; return text ? [{ index: index + 1, text }] : []; }) : [];
  const interruptions = EVIDENCE.slice(0, Math.max(0, state.evidenceIndex + 1)).flatMap(item => item.interruption ? [item.interruption] : []);
  const interviews = state.asked.map(record => ({ questioner: state.players.find(p => p.id === record.questionerId)?.name ?? "Player", target: state.players.find(p => p.id === record.targetId)?.name ?? "Player", question: record.questionLabel, answer: record.answer }));
  return { evidence, privateClues, interruptions, interviews };
}

function project(state: State, viewerId: string) {
  normalize(state);
  const viewer = state.players.find(p => p.id === viewerId)!;
  const role = roleFor(viewer);
  const questioner = currentQuestioner(state);
  const pending = state.pendingQuestion;
  const selectedQuestion = pending ? questionFor(pending.questionId) : null;
  const isTarget = pending?.targetId === viewerId;
  const pendingAnswer = isTarget && role && selectedQuestion ? role.answers[selectedQuestion.answerKey] : null;
  const evidence = state.status === "evidence" && state.evidenceIndex >= 0 ? EVIDENCE[state.evidenceIndex] : null;
  const privateEvidence = evidence && role ? evidence.privateByRole[role.id as keyof typeof evidence.privateByRole] ?? null : null;
  const murdererPlayer = state.status === "reveal" ? state.players.find(p => roleFor(p)?.murderer) ?? null : null;
  const voteCounts: Record<string, number> = {};
  for (const targetId of Object.values(state.votes)) voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
  const solvedBy = murdererPlayer ? Object.entries(state.votes).filter(([, targetId]) => targetId === murdererPlayer.id).map(([voterId]) => state.players.find(p => p.id === voterId)?.name ?? "Player") : [];
  return {
    code: state.code,
    status: state.status,
    hostPlayerId: state.hostPlayerId,
    players: state.players.map(({ tokenHash: _tokenHash, roleId: _roleId, ...player }) => player),
    turnIndex: state.turnIndex,
    interrogationCount: state.interrogationCount,
    evidenceIndex: state.evidenceIndex,
    message: state.message,
    currentQuestioner: questioner ? { id: questioner.id, name: questioner.name } : null,
    pendingQuestion: pending && selectedQuestion ? { questioner: state.players.find(p => p.id === pending.questionerId)?.name ?? "Player", target: state.players.find(p => p.id === pending.targetId)?.name ?? "Player", questionId: pending.questionId, questionLabel: selectedQuestion.label, isTarget, answerPrompt: isTarget ? pendingAnswer : null } : null,
    questions: questioner?.id === viewerId && !pending ? questionOptions(state, "") : [],
    questionCount: QUESTIONS.length,
    caseFile: caseFile(state, viewer),
    evidence: evidence ? { index: state.evidenceIndex + 1, total: EVIDENCE.length, title: evidence.title, publicText: evidence.publicText, privateText: privateEvidence, interruption: evidence.interruption, acknowledged: state.evidenceAcknowledged.includes(viewerId) } : null,
    votesCast: Object.keys(state.votes).length,
    myVote: state.votes[viewerId] ?? null,
    reveal: murdererPlayer ? { murderer: { id: murdererPlayer.id, name: murdererPlayer.name, role: roleFor(murdererPlayer)?.title ?? "The Murderer" }, voteCounts, solvedBy } : null,
    me: { id: viewerId, isHost: state.hostPlayerId === viewerId, role: role ? { title: role.title, publicBio: role.publicBio, memory: role.memory, isMurderer: Boolean(role.murderer) } : null },
  };
}

function projectWithTarget(state: State, viewerId: string, targetId?: string) {
  const base = project(state, viewerId);
  if (base.currentQuestioner?.id === viewerId && !base.pendingQuestion && targetId) base.questions = questionOptions(state, targetId);
  return base;
}

export async function createMysteryRoom(nameValue: unknown, hostAccountId: string) {
  const name = cleanName(nameValue);
  if (!hostAccountId) throw new Error("A signed-in host account is required.");
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = roomCode(), token = playerToken(), playerId = randomUUID();
    const state: State = { code, status: "lobby", hostPlayerId: playerId, hostAccountId, players: [{ id: playerId, name, tokenHash: hash(token), seat: 0 }], turnIndex: 0, interrogationCount: 0, pendingQuestion: null, asked: [], evidenceIndex: -1, evidenceAcknowledged: [], votes: {}, message: "Invite 3–7 more suspects. The case is fully solvable with four players." };
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("ppl_mystery_rooms").insert({ code, state, version: 1 });
    if (!error) return { code, playerId, token, state: project(state, playerId) };
  }
  throw new Error("Unable to create a mystery room.");
}

export async function joinMysteryRoom(codeValue: unknown, nameValue: unknown) {
  const code = cleanCode(codeValue), name = cleanName(nameValue), row = await read(code);
  if (!row) throw new Error("Mystery room not found.");
  if (row.state.status !== "lobby") throw new Error("That mystery has already begun.");
  if (row.state.players.length >= MAX_PLAYERS) throw new Error("That mystery is full.");
  const token = playerToken(), playerId = randomUUID();
  row.state.players.push({ id: playerId, name, tokenHash: hash(token), seat: row.state.players.length });
  const saved = await save(row, row.state);
  return { code, playerId, token, state: project(saved.state, playerId) };
}

export async function getMysteryRoom(codeValue: unknown, playerId: string, token: string, targetId?: string) {
  const code = cleanCode(codeValue), row = await read(code);
  if (!row) throw new Error("Mystery room not found.");
  auth(row.state, playerId, token);
  return { state: projectWithTarget(row.state, playerId, targetId) };
}

export async function actMysteryRoom(codeValue: unknown, playerId: string, token: string, action: string, payload: Record<string, unknown> = {}) {
  const code = cleanCode(codeValue), row = await read(code);
  if (!row) throw new Error("Mystery room not found.");
  const state = normalize(row.state);
  auth(state, playerId, token);

  if (action === "start") {
    if (state.hostPlayerId !== playerId) throw new Error("Only the host can begin the mystery.");
    if (state.players.length < MIN_PLAYERS) throw new Error(`This mystery needs at least ${MIN_PLAYERS} players.`);
    assignRoles(state); state.status = "interrogation"; state.turnIndex = 0; state.interrogationCount = 0; state.pendingQuestion = null; state.asked = []; state.evidenceIndex = -1; state.evidenceAcknowledged = []; state.votes = {}; state.message = "Read your private story. The first investigator may choose a suspect and question.";
  } else if (action === "ask") {
    if (state.status !== "interrogation" || state.pendingQuestion) throw new Error("No question can be asked right now.");
    const questioner = currentQuestioner(state); if (!questioner || questioner.id !== playerId) throw new Error("It is not your turn to investigate.");
    const targetId = typeof payload.targetId === "string" ? payload.targetId : ""; const questionId = typeof payload.questionId === "string" ? payload.questionId : "";
    if (!state.players.some(p => p.id === targetId) || targetId === playerId) throw new Error("Choose another player to question.");
    const allowed = questionOptions(state, targetId); if (!allowed.some(q => q.id === questionId)) throw new Error("Choose one of the available questions.");
    state.pendingQuestion = { questionerId: playerId, targetId, questionId }; state.message = `${state.players.find(p => p.id === targetId)?.name ?? "The suspect"}'s phone has the answer prompt.`;
  } else if (action === "answered") {
    if (state.status !== "interrogation" || !state.pendingQuestion) throw new Error("There is no question waiting for an answer.");
    if (state.pendingQuestion.targetId !== playerId) throw new Error("Only the questioned player can complete this answer.");
    const pending = state.pendingQuestion; const target = state.players.find(p => p.id === pending.targetId)!; const role = roleFor(target); const question = questionFor(pending.questionId);
    if (role && question) state.asked.push({ questionerId: pending.questionerId, targetId: pending.targetId, questionId: pending.questionId, questionLabel: question.label, answer: role.answers[question.answerKey].mustReveal });
    state.pendingQuestion = null; state.interrogationCount += 1; state.turnIndex = (state.turnIndex + 1) % state.players.length;
    if (state.interrogationCount % state.players.length === 0) {
      const nextEvidence = state.evidenceIndex + 1;
      if (nextEvidence < EVIDENCE.length) { state.evidenceIndex = nextEvidence; state.evidenceAcknowledged = []; state.status = "evidence"; state.message = "New information has interrupted the investigation. Everyone read it before questioning resumes."; }
      else { state.status = "accusation"; state.message = "The investigation is complete. Make your accusation privately."; }
    } else state.message = `${currentQuestioner(state)?.name ?? "Next player"}, choose a suspect and question.`;
  } else if (action === "ack-evidence") {
    if (state.status !== "evidence") throw new Error("There is no evidence to acknowledge.");
    if (!state.evidenceAcknowledged.includes(playerId)) state.evidenceAcknowledged.push(playerId);
    if (state.evidenceAcknowledged.length >= state.players.length) {
      if (state.evidenceIndex >= EVIDENCE.length - 1) { state.status = "accusation"; state.message = "All evidence is in. Make your accusation privately."; }
      else { state.status = "interrogation"; state.message = `${currentQuestioner(state)?.name ?? "Next player"}, continue the investigation.`; }
    }
  } else if (action === "vote") {
    if (state.status !== "accusation") throw new Error("Accusations are not open yet."); if (state.votes[playerId]) throw new Error("You already made your accusation.");
    const targetId = typeof payload.targetId === "string" ? payload.targetId : ""; if (!state.players.some(p => p.id === targetId)) throw new Error("Choose a valid suspect.");
    state.votes[playerId] = targetId; if (Object.keys(state.votes).length >= state.players.length) { state.status = "reveal"; state.message = "The murderer has been revealed."; } else state.message = `${Object.keys(state.votes).length} of ${state.players.length} accusations are locked in.`;
  } else if (action === "restart") {
    if (state.hostPlayerId !== playerId) throw new Error("Only the host can start over.");
    state.status = "lobby"; state.players.forEach(player => { delete player.roleId; }); state.turnIndex = 0; state.interrogationCount = 0; state.pendingQuestion = null; state.asked = []; state.evidenceIndex = -1; state.evidenceAcknowledged = []; state.votes = {}; state.message = "Mystery reset. Invite players, then begin again.";
  } else throw new Error("Unknown mystery action.");

  const saved = await save(row, state);
  const targetId = typeof payload.targetId === "string" ? payload.targetId : undefined;
  return { state: projectWithTarget(saved.state, playerId, targetId) };
}
