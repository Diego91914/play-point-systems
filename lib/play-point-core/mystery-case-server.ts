import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { getMysteryCaseVariant, type MysteryBranchSignals } from "@/lib/play-point-core/mystery-case-variants";
import { getBlackwoodVariantContent } from "@/lib/play-point-core/mystery-variant-content";

type Player = { id: string; name: string; tokenHash: string; seat: number; roleId?: string };
type InterviewRecord = { questionerId: string; targetId: string; questionId: string; questionLabel: string; answer: string };
type MysteryState = {
  code: string;
  status: "lobby" | "interrogation" | "evidence" | "accusation" | "reveal";
  players: Player[];
  asked?: InterviewRecord[];
  evidenceIndex: number;
  branchSignals?: MysteryBranchSignals;
  caseVariantId?: string;
  caseSubmissions?: { runSignature: string; items: Record<string, CaseSubmission> };
};
type Row = { code: string; state: MysteryState; version: number };
type CaseSubmission = { suspectId: string; motiveId: string; locationId: string; windowId: string; supportIds: string[]; submittedAt: string; score: number; supportCorrect: number; convicted: boolean };
type Lead = { id: string; title: string; text: string; source: "private-clue" | "personal-discovery" | "suspicious"; correctSupport: boolean };
type LinkRule = { id: string; title: string; text: string; targetRoles: string[]; questionIds: string[]; minEvidence: number; source?: Lead["source"] };

const MOTIVES = [
  { id: "old_theft_exposed", label: "Adrian was about to expose a decades-old theft." },
  { id: "inheritance", label: "The changed inheritance created a family revenge motive." },
  { id: "business_money", label: "The current Blackwood Holdings money dispute triggered the murder." },
  { id: "job_loss", label: "Being fired after dinner triggered the murder." },
  { id: "property_dispute", label: "The property lawsuit triggered the murder." },
];
const LOCATIONS = [
  { id: "library", label: "The library" },
  { id: "kitchen", label: "The kitchen" },
  { id: "back_porch", label: "The back porch" },
  { id: "study", label: "The downstairs study" },
];
const WINDOWS = [
  { id: "1031_1035", label: "Between 10:31 and 10:35" },
  { id: "1020_1025", label: "Between 10:20 and 10:25" },
  { id: "1038_1042", label: "Between 10:38 and 10:42" },
  { id: "after_1045", label: "After 10:45" },
];

const BASE_LINK_RULES: LinkRule[] = [
  { id: "bathroom_alibi_break", title: "The bathroom alibi has a hole", text: "Your questioning established a bathroom-until-10:40 claim. The later porch timeline gives you a reason to challenge whether that alibi can be true.", targetRoles: ["murderer"], questionIds: ["where", "alibi", "timeline", "opportunity", "after"], minEvidence: 2 },
  { id: "whiskey_cleanup_link", title: "The whiskey glass looks like cleanup", text: "Your questioning connected someone other than Adrian to whiskey. Combined with the freshly rinsed glass, you have a personal lead that the glass was cleaned after the confrontation.", targetRoles: ["murderer", "chef"], questionIds: ["drink", "glass", "whiskey_owner"], minEvidence: 1 },
  { id: "porch_route_link", title: "The porch may be the exit route", text: "Your questioning gave you a direct reason to connect the 10:35 dark-jacket sighting with movement from the library side toward the kitchen entrance.", targetRoles: ["murderer", "sister"], questionIds: ["door", "porch_route", "dark_jacket", "heard"], minEvidence: 2 },
  { id: "ledger_old_friend_link", title: "The ledger points backward, not to tonight's disputes", text: "Your questioning tied the blue ledger to an old personal money problem involving someone Adrian had known for decades, rather than the newer business or inheritance conflicts.", targetRoles: ["murderer", "partner", "lawyer"], questionIds: ["money", "old_money", "ledger", "ledger_entry", "final_pressure"], minEvidence: 3 },
  { id: "partner_text_red_herring", title: "The Business Partner's text sounded like a threat", text: "You spent part of your investigation on the deleted 'I'll handle it myself' message. It was suspicious, but later phone records identified the recipient as a forensic accountant.", targetRoles: ["partner"], questionIds: ["motive", "secret", "money", "relationship"], minEvidence: 0, source: "suspicious" },
  { id: "inheritance_red_herring", title: "The inheritance still looks ugly", text: "Your questioning confirmed a serious inheritance fight. It is a real motive to lie, but not proof of the murder by itself.", targetRoles: ["sister"], questionIds: ["motive", "money", "secret", "relationship"], minEvidence: 0, source: "suspicious" },
  { id: "chef_firing_red_herring", title: "The chef had just been fired", text: "Your questioning confirmed Adrian was ending the chef's employment. That is a real secret and motive for resentment, but not proof of murder by itself.", targetRoles: ["chef"], questionIds: ["motive", "secret", "relationship"], minEvidence: 0, source: "suspicious" },
];

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function tokenMatches(expected: string, token: string) { const a = Buffer.from(hash(token), "hex"); const b = Buffer.from(expected, "hex"); return a.length === b.length && timingSafeEqual(a, b); }
function cleanCode(value: unknown) { const code = typeof value === "string" ? value.trim().toUpperCase() : ""; if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Enter a valid 6-character room code."); return code; }
async function read(code: string): Promise<Row | null> { const supabase = getSupabaseServerClient(); const { data, error } = await supabase.from("ppl_mystery_rooms").select("code,state,version").eq("code", code).maybeSingle(); if (error) throw new Error(error.message); return data ? data as Row : null; }
async function save(row: Row, state: MysteryState) { const supabase = getSupabaseServerClient(); const { data, error } = await supabase.from("ppl_mystery_rooms").update({ state, version: row.version + 1, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() }).eq("code", row.code).eq("version", row.version).select("code,state,version").maybeSingle(); if (error) throw new Error(error.message); if (!data) throw new Error("The room changed. Try again."); return data as Row; }
function authenticate(state: MysteryState, playerId: string, token: string) { const player = state.players.find(item => item.id === playerId); if (!player || !tokenMatches(player.tokenHash, token)) throw new Error("Invalid player session."); return player; }
function variantFor(state: MysteryState) { return getMysteryCaseVariant(state.caseVariantId); }
function culpritFor(state: MysteryState) { const variant = variantFor(state); return state.players.find(player => player.roleId === variant.culpritRoleId) ?? null; }
function runSignature(state: MysteryState) { return hash(JSON.stringify({ variant: variantFor(state).id, roles: state.players.map(player => [player.id, player.roleId]), asked: state.asked ?? [] })).slice(0, 24); }

function privateRoleLeads(state: MysteryState, viewer: Player): Lead[] {
  const variant = variantFor(state);
  const correct = new Set(variant.correctSupportIds);
  const leads: Lead[] = [];
  const push = (lead: Omit<Lead, "correctSupport">) => leads.push({ ...lead, correctSupport: correct.has(lead.id) });

  if (state.evidenceIndex >= 0 && viewer.roleId === "sister") push({ id: "private_sister_timing", title: "Your timing memory matters", text: "Your private memory places meaningful movement near the end of the death window.", source: "private-clue" });
  if (state.evidenceIndex >= 1 && viewer.roleId === "chef") push({ id: "private_chef_drink", title: "You know Adrian's habits", text: "Your firsthand knowledge of Adrian's food and drink habits helps separate genuine physical evidence from misleading traces.", source: "private-clue" });
  if (state.evidenceIndex >= 2 && viewer.roleId === "partner") push({ id: "private_partner_door", title: "You noticed the back door later", text: "You personally saw the kitchen back door partly open around 10:42, reinforcing that someone may have used the rear route.", source: "private-clue" });
  if (state.evidenceIndex >= 3 && viewer.roleId === "lawyer") push({ id: "private_lawyer_ledger", title: "Adrian expected hidden records to matter", text: "Your legal context tells you Adrian was deliberately preserving records in case a private confrontation went badly.", source: "private-clue" });

  if (viewer.roleId === variant.culpritRoleId) {
    push({ id: "culprit_cover_story", title: "Protect your cover story", text: "Keep your stated timeline consistent and use the room's genuine alternate motives without inventing objective evidence.", source: "suspicious" });
    push({ id: "culprit_other_motives", title: "The room has other believable motives", text: "Several people have real reasons to lie. Redirect attention using facts that are actually true.", source: "suspicious" });
  }
  return leads;
}

function activeLinkRules(state: MysteryState) {
  const variant = variantFor(state);
  const extra = getBlackwoodVariantContent(variant.id)?.supportRules ?? [];
  return [...BASE_LINK_RULES, ...extra];
}

function personalDiscoveries(state: MysteryState, viewer: Player): Lead[] {
  const asked = state.asked ?? [];
  const variant = variantFor(state);
  const correct = new Set(variant.correctSupportIds);
  return activeLinkRules(state).filter(rule => state.evidenceIndex >= rule.minEvidence && asked.some(record => {
    if (record.questionerId !== viewer.id || !rule.questionIds.includes(record.questionId)) return false;
    const target = state.players.find(player => player.id === record.targetId);
    return Boolean(target?.roleId && rule.targetRoles.includes(target.roleId));
  })).map(rule => ({ id: rule.id, title: rule.title, text: rule.text, source: rule.source ?? "personal-discovery", correctSupport: correct.has(rule.id) } satisfies Lead));
}

function leadsFor(state: MysteryState, viewer: Player) { const combined = [...privateRoleLeads(state, viewer), ...personalDiscoveries(state, viewer)]; return combined.filter((lead, index) => combined.findIndex(item => item.id === lead.id) === index); }

function scoreCase(state: MysteryState, viewer: Player, input: Omit<CaseSubmission, "submittedAt" | "score" | "supportCorrect" | "convicted">) {
  const variant = variantFor(state); const culprit = culpritFor(state); if (!culprit) throw new Error("The mystery solution is not available.");
  const availableLeads = leadsFor(state, viewer); const availableIds = new Set(availableLeads.map(lead => lead.id));
  const supportIds = [...new Set(input.supportIds)].filter(id => availableIds.has(id)).slice(0, 4); const correctIds = new Set(variant.correctSupportIds);
  const supportCorrect = supportIds.filter(id => correctIds.has(id)).length; let score = 0;
  if (input.suspectId === culprit.id) score += 4; if (input.motiveId === variant.motiveId) score += 2; if (input.locationId === variant.locationId) score += 1; if (input.windowId === variant.windowId) score += 1; score += supportCorrect;
  const viewerIsCulprit = viewer.roleId === variant.culpritRoleId; const convicted = !viewerIsCulprit && input.suspectId === culprit.id && score >= 8 && supportCorrect >= 2;
  return { ...input, supportIds, submittedAt: new Date().toISOString(), score, supportCorrect, convicted } satisfies CaseSubmission;
}

function buildResults(state: MysteryState, submissions: Record<string, CaseSubmission>) {
  const variant = variantFor(state); const culprit = culpritFor(state)!;
  const rows = state.players.map(player => { const item = submissions[player.id]; return { playerId: player.id, name: player.name, isMurderer: player.id === culprit.id, score: item?.score ?? 0, convicted: item?.convicted ?? false, supportCorrect: item?.supportCorrect ?? 0 }; });
  const eligible = rows.filter(row => row.convicted && !row.isMurderer).sort((a, b) => b.score - a.score || b.supportCorrect - a.supportCorrect || a.name.localeCompare(b.name));
  return { murderer: { id: culprit.id, name: culprit.name, role: variant.culpritLabel }, winner: eligible[0] ?? null, murdererWins: eligible.length === 0, standings: [...rows].sort((a, b) => Number(a.isMurderer) - Number(b.isMurderer) || b.score - a.score), solution: variant.solution };
}

function project(state: MysteryState, viewer: Player) {
  const variant = variantFor(state); const signature = runSignature(state); const submissions = state.caseSubmissions?.runSignature === signature ? state.caseSubmissions.items : {}; const mySubmission = submissions[viewer.id] ?? null; const leads = leadsFor(state, viewer); const reveal = state.status === "reveal" ? buildResults(state, submissions) : null;
  return { status: state.status, players: state.players.map(player => ({ id: player.id, name: player.name })), myRoleId: viewer.roleId ?? null, isMurderer: viewer.roleId === variant.culpritRoleId, privateRule: "Everyone investigates the same murder. Nobody experiences exactly the same case.", privateLeads: leads.map(({ correctSupport: _correctSupport, ...lead }) => lead), options: { motives: MOTIVES, locations: LOCATIONS, windows: WINDOWS }, submittedCount: Object.keys(submissions).length, playerCount: state.players.length, mySubmission: mySubmission ? state.status === "reveal" ? { score: mySubmission.score, convicted: mySubmission.convicted, locked: true } : { locked: true } : null, reveal };
}

export async function getMysteryCase(codeValue: unknown, playerId: string, token: string) { const code = cleanCode(codeValue); const row = await read(code); if (!row) throw new Error("Mystery room not found."); const viewer = authenticate(row.state, playerId, token); return { state: project(row.state, viewer) }; }

export async function submitMysteryCase(codeValue: unknown, playerId: string, token: string, payload: Record<string, unknown>) {
  const code = cleanCode(codeValue); const row = await read(code); if (!row) throw new Error("Mystery room not found."); const state = row.state; const viewer = authenticate(state, playerId, token); if (state.status !== "accusation") throw new Error("Case building is not open right now.");
  const signature = runSignature(state); const existing = state.caseSubmissions?.runSignature === signature ? state.caseSubmissions.items : {}; if (existing[playerId]) throw new Error("Your case is already locked.");
  const suspectId = typeof payload.suspectId === "string" ? payload.suspectId : ""; const motiveId = typeof payload.motiveId === "string" ? payload.motiveId : ""; const locationId = typeof payload.locationId === "string" ? payload.locationId : ""; const windowId = typeof payload.windowId === "string" ? payload.windowId : ""; const supportIds = Array.isArray(payload.supportIds) ? payload.supportIds.filter((item): item is string => typeof item === "string") : [];
  if (!state.players.some(player => player.id === suspectId)) throw new Error("Choose who you believe committed the murder."); if (!MOTIVES.some(item => item.id === motiveId)) throw new Error("Choose a motive."); if (!LOCATIONS.some(item => item.id === locationId)) throw new Error("Choose the crime scene."); if (!WINDOWS.some(item => item.id === windowId)) throw new Error("Choose the murder window."); if (supportIds.length < 2) throw new Error("Use at least two facts from your private Case File to support the case.");
  const scored = scoreCase(state, viewer, { suspectId, motiveId, locationId, windowId, supportIds }); state.caseSubmissions = { runSignature: signature, items: { ...existing, [playerId]: scored } }; if (Object.keys(state.caseSubmissions.items).length >= state.players.length) state.status = "reveal"; const saved = await save(row, state); return { state: project(saved.state, viewer) };
}
