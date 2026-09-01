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
  { id: "after", label: "What did you do immediately after 10:30?" },
  { id: "before", label: "What were you doing just before 10:30?" },
  { id: "secret", label: "What are you not telling everyone?" },
  { id: "money", label: "Did money connect you to the victim?" },
  { id: "door", label: "What do you know about the back door or porch?" },
  { id: "drink", label: "What do you know about the victim's drinks tonight?" },
  { id: "ledger", label: "What do you know about the blue ledger?" },
  { id: "suspect", label: "Who seemed suspicious to you tonight, and why?" },
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
  core?: boolean;
};

const ROLES: RoleTemplate[] = [
  {
    id: "partner",
    title: "The Business Partner",
    core: true,
    publicBio: "You helped the victim build Blackwood Holdings. Everyone knows the partnership had become tense.",
    memory: [
      "You and the victim built Blackwood Holdings together, but the books stopped making sense months ago.",
      "At 10:20 you argued with the victim in the library about missing company money.",
      "At 10:25 you left the library and went to the downstairs study with copies of bank records.",
      "At 10:30 you were alone in the study reviewing those records.",
      "Around 10:33 you stepped into the hall, angry and frustrated, then returned to the study.",
      "At 10:42 you passed the kitchen and noticed the back door was partly open.",
      "Your secret: you had begun quietly collecting evidence because you feared the victim planned to blame you for the missing money.",
      "You did not kill the victim. Your goal is to prove that your argument and financial motive are not the whole story.",
    ],
    answers: {
      where: { mustReveal: "You were alone in the downstairs study at 10:30.", mayHide: "You were examining copies of bank records you had taken without telling the victim." },
      victim: { mustReveal: "You last saw the victim around 10:20 in the library during a heated argument." },
      heard: { mustReveal: "You did not hear the murder. Later, around 10:42, you noticed the kitchen back door was partly open." },
      motive: { mustReveal: "Yes. You were furious about missing company money and believed the victim was hiding something.", mayHide: "You feared the victim planned to make you the scapegoat." },
      after: { mustReveal: "You stayed around the study, briefly stepped into the hall near 10:33, then went back to the records." },
      before: { mustReveal: "Just before 10:30, you had left a heated argument with the victim and gone to the study." },
      secret: { mustReveal: "You were privately investigating the company's missing money.", mayHide: "You copied financial records without permission." },
      money: { mustReveal: "Yes. Your entire partnership was tied to the missing company funds, and you believed the victim knew where the money went." },
      door: { mustReveal: "At about 10:42 you saw the kitchen back door partly open. You did not open it." },
      drink: { mustReveal: "You remember the victim carrying red wine during your argument. You did not see the victim drink whiskey." },
      ledger: { mustReveal: "You knew the victim kept private financial records, but you had never seen the blue ledger before tonight." },
      suspect: { mustReveal: "The victim's Old Friend bothers you because the victim had recently become tense whenever that person's name came up.", mayHide: "You have no direct proof yet." },
    },
  },
  {
    id: "sister",
    title: "The Younger Sister",
    core: true,
    publicBio: "You and the victim were close once, but a recent family inheritance caused a serious rift.",
    memory: [
      "You grew up protecting each other, but the victim recently changed how a family inheritance would be divided.",
      "At 9:50 you confronted the victim briefly, then avoided another argument.",
      "At 10:25 you went outside behind the house to make a private call about the inheritance dispute.",
      "At 10:30 you were near the garden gate, where the porch and kitchen door were partly visible.",
      "Around 10:35 you saw someone in a dark jacket cross the back porch quickly. You could not see the face.",
      "The person moved like they were trying not to be noticed and went toward the kitchen entrance.",
      "Your secret: the private call was with a family accountant because you suspected the victim had hidden part of the inheritance.",
      "You did not kill the victim. Your most important fact is the dark-jacket figure crossing the porch after the likely time of death.",
    ],
    answers: {
      where: { mustReveal: "You were outside near the garden gate at 10:30.", mayHide: "You were on a private call about the inheritance." },
      victim: { mustReveal: "You last spoke directly with the victim around 9:50, when you argued about the inheritance." },
      heard: { mustReveal: "Around 10:35 you saw someone in a dark jacket cross the back porch quickly, but you could not identify the face." },
      motive: { mustReveal: "Yes. You were angry about the inheritance, but you wanted an explanation and accounting, not revenge." },
      after: { mustReveal: "You remained outside for several minutes, then came back toward the house after seeing the dark-jacket figure." },
      before: { mustReveal: "You went outside at about 10:25 to make a private call." },
      secret: { mustReveal: "Your private call was about the inheritance dispute.", mayHide: "You contacted a family accountant because you suspected money had been concealed." },
      money: { mustReveal: "Yes. The inheritance dispute involved a large amount of family money, giving you an obvious motive." },
      door: { mustReveal: "You saw a dark-jacket figure cross the back porch toward the kitchen side of the house around 10:35." },
      drink: { mustReveal: "At dinner you remember the victim drinking red wine. You never saw whiskey in the victim's hand." },
      ledger: { mustReveal: "You had heard the victim mention a private ledger once, but you did not know where it was kept or what was in it." },
      suspect: { mustReveal: "The person in the dark jacket is your strongest lead. Think about who was wearing one tonight." },
    },
  },
  {
    id: "chef",
    title: "The Private Chef",
    core: true,
    publicBio: "You worked the dinner and knew the victim's habits, including exactly what they ate and drank.",
    memory: [
      "You have cooked for the victim many times and know their food and drink habits unusually well.",
      "The victim drank red wine throughout dinner and afterward. They specifically disliked whiskey.",
      "At 10:15 you saw the victim carry a glass of red wine toward the library.",
      "At 10:30 you were cleaning the kitchen and had already cleared most glassware.",
      "At about 10:38 you found a freshly rinsed whiskey glass in the sink that had not been there earlier.",
      "The kitchen back door was not fully latched when you noticed the glass.",
      "Your secret: the victim had told you earlier that evening your services would no longer be needed after tonight.",
      "You did not kill the victim. The whiskey glass is important because it does not fit the victim's behavior at all.",
    ],
    answers: {
      where: { mustReveal: "You were cleaning the kitchen at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:15 carrying red wine toward the library." },
      heard: { mustReveal: "Around 10:38 you found a freshly rinsed whiskey glass in the sink that had not been there earlier." },
      motive: { mustReveal: "Yes. The victim had told you they planned to replace you after tonight's dinner." },
      after: { mustReveal: "You continued cleaning. Around 10:38 you noticed the whiskey glass and the poorly latched back door." },
      before: { mustReveal: "You were clearing dinner service and cleaning the kitchen before 10:30." },
      secret: { mustReveal: "The victim had just fired you from future work, which gives you a motive you would rather not advertise." },
      money: { mustReveal: "Only indirectly. Losing this client would cost you significant income, but the victim did not owe you money." },
      door: { mustReveal: "The kitchen back door was not fully latched when you found the rinsed whiskey glass around 10:38." },
      drink: { mustReveal: "The victim drank red wine all evening and disliked whiskey. The rinsed whiskey glass is highly suspicious." },
      ledger: { mustReveal: "You know nothing firsthand about the blue ledger." },
      suspect: { mustReveal: "Anyone connected to that whiskey glass or the back door deserves scrutiny. Neither fits the victim's normal routine." },
    },
  },
  {
    id: "murderer",
    title: "The Old Friend",
    core: true,
    murderer: true,
    publicBio: "You and the victim had known each other for decades. Tonight, old history came back to the surface.",
    memory: [
      "You are the murderer. Decades ago you stole money from a venture you shared with the victim, and the victim recently discovered proof.",
      "At about 10:28 you entered the library for what you expected to be a private conversation.",
      "The victim confronted you with entries from a blue ledger and threatened to expose you the next morning.",
      "At approximately 10:33 the confrontation turned violent and you killed the victim in the library.",
      "Your cover story is that you were in the downstairs bathroom from 10:25 until about 10:40.",
      "After the murder you crossed the back porch wearing your dark jacket, entered through the kitchen side, and rinsed a whiskey glass to create a false trail.",
      "You had been drinking whiskey earlier, so the glass actually belongs to you—not the victim.",
      "Your goal is to survive the final accusation. Never volunteer the murder, the ledger confrontation, the porch crossing, or the whiskey glass unless the phone explicitly requires it.",
    ],
    answers: {
      where: { mustReveal: "Use your cover story: you were in the downstairs bathroom at 10:30.", mayHide: "In reality, you were in the library confronting the victim." },
      victim: { mustReveal: "Say you last saw the victim around 9:55 after dinner.", mayHide: "In reality, you met the victim again in the library around 10:28." },
      heard: { mustReveal: "Say you heard nothing unusual while you were in the bathroom.", mayHide: "You know exactly what happened because you were in the library." },
      motive: { mustReveal: "Admit you had an old disagreement with the victim, but describe it as settled years ago.", mayHide: "The victim had discovered your old theft and planned to expose you." },
      after: { mustReveal: "Claim you stayed in the bathroom until roughly 10:40, then returned to the gathering.", mayHide: "You actually crossed the back porch, entered near the kitchen, and rinsed your whiskey glass." },
      before: { mustReveal: "Claim you stepped away from the group around 10:25 to use the downstairs bathroom.", mayHide: "You actually went to meet the victim in the library." },
      secret: { mustReveal: "Say your only secret is an old financial disagreement with the victim that you believed was long settled.", mayHide: "The disagreement was theft, the victim had proof, and you killed them to stop the exposure." },
      money: { mustReveal: "Acknowledge that you and the victim had money disputes many years ago, but insist they were resolved.", mayHide: "You stole the money and never truly repaid it." },
      door: { mustReveal: "Say you know nothing about the back door or porch because you were in the bathroom.", mayHide: "You crossed the back porch after the murder." },
      drink: { mustReveal: "Admit you had whiskey earlier in the evening, but say you left your glass somewhere downstairs.", mayHide: "You rinsed that glass in the kitchen after the murder." },
      ledger: { mustReveal: "Say you have heard the victim mention private financial records but never saw the blue ledger.", mayHide: "The victim confronted you with the ledger immediately before the murder." },
      suspect: { mustReveal: "Point out that several people had obvious motives tonight—the Partner, Sister, Chef, and others all had conflicts with the victim.", mayHide: "Your goal is to spread suspicion without making one lie too elaborate." },
    },
  },
  {
    id: "lawyer",
    title: "The Family Lawyer",
    publicBio: "You handle the family's legal affairs and know more about everyone's finances than anyone at the house.",
    memory: [
      "You have represented the family for years and recently helped the victim revise several financial documents.",
      "At 10:05 you met the victim privately about the will and financial irregularities.",
      "At 10:30 you were in the dining room collecting papers from your briefcase.",
      "At 10:35 the victim's phone sent you a delayed message: 'If anything happens, check the blue ledger.'",
      "You knew the victim was afraid an old financial secret was about to surface.",
      "Your secret: you know who benefits most from the newly revised will, and you have not told the family yet.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the dining room with your briefcase at 10:30." },
      victim: { mustReveal: "You last saw the victim face-to-face around 10:05." },
      heard: { mustReveal: "At 10:35 the victim's phone sent you a message: 'If anything happens, check the blue ledger.'" },
      motive: { mustReveal: "You had no personal feud, but your knowledge of the new will makes you look involved.", mayHide: "You know who benefits from the revised will." },
      after: { mustReveal: "You remained in or near the dining room gathering legal papers." },
      before: { mustReveal: "You were organizing papers and preparing to leave before 10:30." },
      secret: { mustReveal: "You know details of a newly revised will that the family does not know yet." },
      money: { mustReveal: "You handled financial documents for the victim but were not personally owed money." },
      door: { mustReveal: "You did not use the back door and have no firsthand porch information." },
      drink: { mustReveal: "You remember the victim drinking red wine. You do not recall seeing the victim with whiskey." },
      ledger: { mustReveal: "The victim's 10:35 message specifically told you to check the blue ledger if anything happened." },
      suspect: { mustReveal: "The message makes you think the murder is tied to an old financial secret rather than the new will alone." },
    },
  },
  {
    id: "assistant",
    title: "The Personal Assistant",
    publicBio: "You managed the victim's calendar, messages, and secrets. You knew where everyone was supposed to be tonight.",
    memory: [
      "You managed nearly every detail of the victim's life and knew which meetings were normal and which were deliberately hidden.",
      "At 10:18 you saw the victim alone in the library, visibly tense.",
      "Earlier, you saw the victim hide a small brass key inside a blue book on a library shelf.",
      "At 10:30 you were upstairs delivering a folder to the guest room.",
      "Shortly before 10:32 you heard the library door close downstairs.",
      "Your secret: you copied private files because you had learned the victim planned to fire you next week.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the upstairs hall at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:18 in the library." },
      heard: { mustReveal: "You heard the library door close shortly before 10:32." },
      motive: { mustReveal: "You had learned the victim planned to fire you next week.", mayHide: "You copied private files before dinner." },
      after: { mustReveal: "You finished delivering the folder upstairs and came back downstairs several minutes later." },
      before: { mustReveal: "You were carrying a folder upstairs just before 10:30." },
      secret: { mustReveal: "You copied several private files after learning you were about to be fired." },
      money: { mustReveal: "Losing your job mattered financially, but the victim did not owe you a separate debt." },
      door: { mustReveal: "You have no firsthand knowledge of the back porch, but you heard the library door close before 10:32." },
      drink: { mustReveal: "You remember the victim with red wine in the library earlier." },
      ledger: { mustReveal: "You saw the victim hide a small brass key in a blue book, but you did not know what it unlocked." },
      suspect: { mustReveal: "Someone entered or left the library shortly before 10:32. That timing feels important." },
    },
  },
  {
    id: "cousin",
    title: "The Cousin",
    publicBio: "You arrived hoping the victim would finally repay a large personal loan.",
    memory: [
      "The victim borrowed a large amount of money from you and had repeatedly delayed repayment.",
      "At 10:12 you confronted the victim about the loan and were brushed off again.",
      "At 10:30 you were in the billiard room trying to calm down.",
      "Around 10:33 you saw the Business Partner step into the hall from the study looking angry, then go back inside.",
      "Your secret: you are in deeper financial trouble than anyone here realizes and desperately needed repayment.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the billiard room at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:12 when you demanded repayment of a personal loan." },
      heard: { mustReveal: "Around 10:33 you saw the Business Partner step into the hall from the study looking angry, then return." },
      motive: { mustReveal: "Yes. The victim owed you a large amount of money and you desperately needed it." },
      after: { mustReveal: "You stayed in the billiard room and later saw people moving through the hall." },
      before: { mustReveal: "You were brooding over the unpaid loan before 10:30." },
      secret: { mustReveal: "You are in serious financial trouble and needed the victim to repay you immediately." },
      money: { mustReveal: "Yes. The victim owed you a large personal loan." },
      door: { mustReveal: "You did not use the back door and saw nothing on the porch." },
      drink: { mustReveal: "You saw the victim with red wine earlier. You were drinking something else and paid little attention." },
      ledger: { mustReveal: "You knew the victim kept meticulous financial records but had never heard the phrase 'blue ledger.'" },
      suspect: { mustReveal: "The Business Partner looked angry around 10:33, although you never saw that person enter the library." },
    },
  },
  {
    id: "neighbor",
    title: "The Neighbor",
    publicBio: "You were invited at the last minute. Your property dispute with the victim was hardly a secret.",
    memory: [
      "You and the victim had been fighting over a property line for months and legal action was becoming likely.",
      "At 10:10 you saw the victim near the staircase and exchanged a cold few words.",
      "At 10:30 you were in the front sitting room.",
      "At approximately 10:34 you heard a heavy thump from the library side of the house, not upstairs as you first assumed.",
      "At 10:36 you saw the Family Lawyer in the dining room, which supports the lawyer's location.",
      "Your secret: you had threatened the victim with an expensive lawsuit earlier that week.",
      "You did not kill the victim.",
    ],
    answers: {
      where: { mustReveal: "You were in the front sitting room at 10:30." },
      victim: { mustReveal: "You last saw the victim around 10:10 near the staircase." },
      heard: { mustReveal: "Around 10:34 you heard a heavy thump from the library side of the house." },
      motive: { mustReveal: "Yes. You had an ugly property dispute and had threatened a lawsuit." },
      after: { mustReveal: "You stayed in the sitting room, then saw the Family Lawyer in the dining room around 10:36." },
      before: { mustReveal: "You were alone in the front sitting room before 10:30." },
      secret: { mustReveal: "You recently threatened the victim with a costly property lawsuit." },
      money: { mustReveal: "The property dispute could cost both of you substantial money, but there was no personal loan." },
      door: { mustReveal: "You were nowhere near the back door and saw nothing on the porch." },
      drink: { mustReveal: "You remember the victim with red wine, not whiskey." },
      ledger: { mustReveal: "You know nothing firsthand about the blue ledger." },
      suspect: { mustReveal: "The timing of the heavy thump near 10:34 makes whoever was near the library then especially suspicious." },
    },
  },
];

const CORE_ROLE_IDS = ["murderer", "partner", "sister", "chef"] as const;
const OPTIONAL_ROLE_IDS = ["lawyer", "assistant", "cousin", "neighbor"] as const;

const EVIDENCE = [
  {
    title: "The time of death",
    publicText: "The medical examiner places the fatal event between 10:31 and 10:35. The victim died in the library. Any alibi covering those four minutes matters.",
    privateByRole: {
      partner: "Your argument ended around 10:20, well before the likely time of death.",
      sister: "The dark-jacket figure you saw crossed the porch around the end of this window.",
      chef: "You were continuously working in the kitchen during most of this window.",
    },
  },
  {
    title: "The rinsed whiskey glass",
    publicText: "A freshly rinsed whiskey glass was found in the kitchen sink shortly after the murder. Multiple witnesses remember the victim drinking red wine, not whiskey.",
    privateByRole: {
      chef: "You are certain the victim disliked whiskey and had not used that glass. Someone else rinsed it after the murder.",
      sister: "The glass discovery happened only minutes after you saw the dark-jacket figure head toward the kitchen side of the house.",
    },
  },
  {
    title: "The back porch",
    publicText: "A damp dress-shoe print was found just inside the back door. Investigators also confirm a witness saw a person in a dark jacket cross the back porch around 10:35.",
    privateByRole: {
      sister: "You are that witness. The figure moved quickly from the library side of the house toward the kitchen entrance.",
      partner: "This fits the partly open back door you noticed later at 10:42.",
    },
  },
  {
    title: "The blue ledger",
    publicText: "A locked blue financial ledger was recovered from the library. It documents a decades-old theft by someone from the victim's personal circle. A note beside the entry reads: 'Old friend. Last chance to make this right.'",
    privateByRole: {
      lawyer: "The victim's delayed 10:35 message—'If anything happens, check the blue ledger'—points directly to this old theft.",
      partner: "This theft predates your current partnership dispute and explains why the missing-money trail never fully matched your books.",
      assistant: "The brass key you saw hidden in the blue book likely opened this ledger.",
    },
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
  const core = CORE_ROLE_IDS.map(id => ROLES.find(role => role.id === id)!).filter(Boolean);
  const optional = shuffle(OPTIONAL_ROLE_IDS.map(id => ROLES.find(role => role.id === id)!).filter(Boolean));
  const chosen = shuffle([...core, ...optional.slice(0, Math.max(0, state.players.length - core.length))]);
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
  const privateEvidence = evidence && role ? evidence.privateByRole[role.id as keyof typeof evidence.privateByRole] ?? null : null;
  const murdererPlayer = state.status === "reveal" ? state.players.find(p => roleFor(p)?.murderer) ?? null : null;
  const voteCounts: Record<string, number> = {};
  for (const targetId of Object.values(state.votes)) voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
  const solvedBy = murdererPlayer
    ? Object.entries(state.votes).filter(([, targetId]) => targetId === murdererPlayer.id).map(([voterId]) => state.players.find(p => p.id === voterId)?.name ?? "Player")
    : [];

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
    pendingQuestion: pending ? {
      questioner: state.players.find(p => p.id === pending.questionerId)?.name ?? "Player",
      target: state.players.find(p => p.id === pending.targetId)?.name ?? "Player",
      questionId: pending.questionId,
      questionLabel: QUESTIONS.find(q => q.id === pending.questionId)?.label ?? "Question",
      isTarget,
      answerPrompt: isTarget ? pendingAnswer : null,
    } : null,
    questions: QUESTIONS,
    evidence: evidence ? {
      index: state.evidenceIndex + 1,
      total: EVIDENCE.length,
      title: evidence.title,
      publicText: evidence.publicText,
      privateText: privateEvidence,
      acknowledged: state.evidenceAcknowledged.includes(viewerId),
    } : null,
    votesCast: Object.keys(state.votes).length,
    myVote: state.votes[viewerId] ?? null,
    reveal: murdererPlayer ? {
      murderer: { id: murdererPlayer.id, name: murdererPlayer.name, role: roleFor(murdererPlayer)?.title ?? "The Murderer" },
      voteCounts,
      solvedBy,
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
    const code = roomCode(), token = playerToken(), playerId = randomUUID();
    const state: State = {
      code,
      status: "lobby",
      hostPlayerId: playerId,
      hostAccountId,
      players: [{ id: playerId, name, tokenHash: hash(token), seat: 0 }],
      turnIndex: 0,
      interrogationCount: 0,
      pendingQuestion: null,
      evidenceIndex: -1,
      evidenceAcknowledged: [],
      votes: {},
      message: "Invite 3–7 more suspects. The case is fully solvable with four players.",
    };
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

export async function getMysteryRoom(codeValue: unknown, playerId: string, token: string) {
  const code = cleanCode(codeValue), row = await read(code);
  if (!row) throw new Error("Mystery room not found.");
  auth(row.state, playerId, token);
  return { state: project(row.state, playerId) };
}

export async function actMysteryRoom(codeValue: unknown, playerId: string, token: string, action: string, payload: Record<string, unknown> = {}) {
  const code = cleanCode(codeValue), row = await read(code);
  if (!row) throw new Error("Mystery room not found.");
  const state = row.state;
  auth(state, playerId, token);

  if (action === "start") {
    if (state.hostPlayerId !== playerId) throw new Error("Only the host can begin the mystery.");
    if (state.players.length < MIN_PLAYERS) throw new Error(`This mystery needs at least ${MIN_PLAYERS} players.`);
    assignRoles(state);
    state.status = "interrogation";
    state.turnIndex = 0;
    state.interrogationCount = 0;
    state.pendingQuestion = null;
    state.evidenceIndex = -1;
    state.evidenceAcknowledged = [];
    state.votes = {};
    state.message = "Read your private story. The first investigator may choose a suspect and question.";
  }
  else if (action === "ask") {
    if (state.status !== "interrogation" || state.pendingQuestion) throw new Error("No question can be asked right now.");
    const questioner = currentQuestioner(state);
    if (!questioner || questioner.id !== playerId) throw new Error("It is not your turn to investigate.");
    const targetId = typeof payload.targetId === "string" ? payload.targetId : "";
    const questionId = typeof payload.questionId === "string" ? payload.questionId as QuestionId : "" as QuestionId;
    if (!state.players.some(p => p.id === targetId) || targetId === playerId) throw new Error("Choose another player to question.");
    if (!QUESTIONS.some(q => q.id === questionId)) throw new Error("Choose a valid question.");
    state.pendingQuestion = { questionerId: playerId, targetId, questionId };
    state.message = `${state.players.find(p => p.id === targetId)?.name ?? "The suspect"}'s phone has the answer prompt.`;
  }
  else if (action === "answered") {
    if (state.status !== "interrogation" || !state.pendingQuestion) throw new Error("There is no question waiting for an answer.");
    if (state.pendingQuestion.targetId !== playerId) throw new Error("Only the questioned player can complete this answer.");
    state.pendingQuestion = null;
    state.interrogationCount += 1;
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
    if (state.interrogationCount % state.players.length === 0) {
      const nextEvidence = state.evidenceIndex + 1;
      if (nextEvidence < EVIDENCE.length) {
        state.evidenceIndex = nextEvidence;
        state.evidenceAcknowledged = [];
        state.status = "evidence";
        state.message = "New evidence has interrupted the investigation. Everyone read it before questioning resumes.";
      } else {
        state.status = "accusation";
        state.message = "The investigation is complete. Make your accusation privately.";
      }
    } else {
      state.message = `${currentQuestioner(state)?.name ?? "Next player"}, choose a suspect and question.`;
    }
  }
  else if (action === "ack-evidence") {
    if (state.status !== "evidence") throw new Error("There is no evidence to acknowledge.");
    if (!state.evidenceAcknowledged.includes(playerId)) state.evidenceAcknowledged.push(playerId);
    if (state.evidenceAcknowledged.length >= state.players.length) {
      if (state.evidenceIndex >= EVIDENCE.length - 1) {
        state.status = "accusation";
        state.message = "All evidence is in. Make your accusation privately.";
      } else {
        state.status = "interrogation";
        state.message = `${currentQuestioner(state)?.name ?? "Next player"}, continue the investigation.`;
      }
    }
  }
  else if (action === "vote") {
    if (state.status !== "accusation") throw new Error("Accusations are not open yet.");
    if (state.votes[playerId]) throw new Error("You already made your accusation.");
    const targetId = typeof payload.targetId === "string" ? payload.targetId : "";
    if (!state.players.some(p => p.id === targetId)) throw new Error("Choose a valid suspect.");
    state.votes[playerId] = targetId;
    if (Object.keys(state.votes).length >= state.players.length) {
      state.status = "reveal";
      state.message = "The murderer has been revealed.";
    } else {
      state.message = `${Object.keys(state.votes).length} of ${state.players.length} accusations are locked in.`;
    }
  }
  else if (action === "restart") {
    if (state.hostPlayerId !== playerId) throw new Error("Only the host can start over.");
    state.status = "lobby";
    state.players.forEach(player => { delete player.roleId; });
    state.turnIndex = 0;
    state.interrogationCount = 0;
    state.pendingQuestion = null;
    state.evidenceIndex = -1;
    state.evidenceAcknowledged = [];
    state.votes = {};
    state.message = "Mystery reset. Invite players, then begin again.";
  }
  else {
    throw new Error("Unknown mystery action.");
  }

  const saved = await save(row, state);
  return { state: project(saved.state, playerId) };
}
