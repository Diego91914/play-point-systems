import "server-only";

import {
  actMysteryRoom as actMysteryRoomV2,
  createMysteryRoom as createMysteryRoomV2,
  getMysteryRoom as getMysteryRoomV2,
  joinMysteryRoom as joinMysteryRoomV2,
} from "@/lib/play-point-core/mystery-server-v2";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { getMysteryCaseVariant } from "@/lib/play-point-core/mystery-case-variants";
import {
  BLACKWOOD_PRELOCK_EVIDENCE,
  getPrelockAnswerOverride,
  getPrelockRoleMemory,
} from "@/lib/play-point-core/mystery-prelock-runtime";
import {
  getVariantAnswerOverride,
  getVariantEvidence,
  getVariantRoleMemory,
  type MysteryAnswerKey,
  type MysteryPromptAnswer,
} from "@/lib/play-point-core/mystery-variant-runtime";

type RawPlayer = { id: string; name: string; roleId?: string };
type RawInterview = { questionerId: string; targetId: string; questionId: string; questionLabel: string; answer: string };
type RawPendingQuestion = { questionerId: string; targetId: string; questionId: string } | null;
type RawState = {
  code: string;
  status: string;
  players: RawPlayer[];
  interrogationCount: number;
  evidenceIndex: number;
  pendingQuestion?: RawPendingQuestion;
  asked?: RawInterview[];
  caseVariantId?: string;
  branchSignals?: Record<string, string>;
  dormantEvidence?: Record<string, unknown>;
  caseSubmissions?: unknown;
};
type RawRow = { code: string; state: RawState; version: number };

type ProjectedState = Record<string, any>;
type ProjectedResult = { state: ProjectedState; [key: string]: any };

const QUESTION_ANSWER_KEYS: Record<string, MysteryAnswerKey> = {
  where: "where",
  victim: "victim",
  motive: "motive",
  before: "before",
  after: "after",
  secret: "secret",
  alibi: "where",
  timeline: "after",
  relationship: "motive",
  last_words: "victim",
  library: "heard",
  opportunity: "where",
  drink: "drink",
  glass: "drink",
  whiskey_owner: "drink",
  door: "door",
  porch_route: "door",
  dark_jacket: "suspect",
  suspect: "suspect",
  money: "money",
  old_money: "money",
  ledger: "ledger",
  ledger_entry: "ledger",
  final_pressure: "secret",
};

async function readRaw(code: string): Promise<RawRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_mystery_rooms").select("code,state,version").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data as RawRow) : null;
}

async function saveRaw(row: RawRow, state: RawState) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_mystery_rooms")
    .update({ state, version: row.version + 1, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() })
    .eq("code", row.code)
    .eq("version", row.version)
    .select("code,state,version")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data as RawRow) : null;
}

export function shouldPauseForBranchLock(state: Pick<RawState, "caseVariantId" | "evidenceIndex" | "interrogationCount" | "players">) {
  if (state.caseVariantId || state.evidenceIndex < 0 || !state.players.length) return false;
  const answerWouldFinishRound = (state.interrogationCount + 1) % state.players.length === 0;
  const nextEvidenceIndex = state.evidenceIndex + 1;
  return answerWouldFinishRound && nextEvidenceIndex >= 1;
}

function answerOverrideFor(raw: RawState, roleId: string | undefined, questionId: string | undefined): MysteryPromptAnswer | null {
  if (!roleId || !questionId) return null;
  const answerKey = QUESTION_ANSWER_KEYS[questionId];
  if (!answerKey) return null;
  if (!raw.caseVariantId) return getPrelockAnswerOverride(roleId, answerKey);
  return getVariantAnswerOverride(raw.caseVariantId, roleId, answerKey);
}

function applyPrelockProjection(projected: ProjectedState, raw: RawState, viewerId: string) {
  const viewer = raw.players.find(player => player.id === viewerId);
  const roleId = viewer?.roleId;

  if (projected.me?.role && roleId) {
    projected.me.role.memory = getPrelockRoleMemory(roleId, projected.me.role.memory ?? []);
    projected.me.role.isMurderer = false;
  }

  const pending = projected.pendingQuestion;
  if (pending?.isTarget && roleId && pending.questionId) {
    const override = answerOverrideFor(raw, roleId, pending.questionId);
    if (override) pending.answerPrompt = override;
  }

  if (raw.evidenceIndex >= 0) {
    if (projected.evidence) {
      projected.evidence = {
        ...projected.evidence,
        total: 4,
        title: BLACKWOOD_PRELOCK_EVIDENCE.title,
        publicText: BLACKWOOD_PRELOCK_EVIDENCE.publicText,
        privateText: roleId ? BLACKWOOD_PRELOCK_EVIDENCE.privateByRole[roleId] ?? null : null,
        interruption: null,
      };
    }
    if (projected.caseFile) {
      projected.caseFile.evidence = [{ index: 1, title: BLACKWOOD_PRELOCK_EVIDENCE.title, text: BLACKWOOD_PRELOCK_EVIDENCE.publicText }];
      projected.caseFile.privateClues = roleId && BLACKWOOD_PRELOCK_EVIDENCE.privateByRole[roleId]
        ? [{ index: 1, text: BLACKWOOD_PRELOCK_EVIDENCE.privateByRole[roleId] }]
        : [];
      projected.caseFile.interruptions = [];
    }
  }

  return projected;
}

function enhanceProjection(projected: ProjectedState, raw: RawState, viewerId: string) {
  if (!raw.caseVariantId) return applyPrelockProjection(projected, raw, viewerId);

  const variant = getMysteryCaseVariant(raw.caseVariantId);
  const viewer = raw.players.find(player => player.id === viewerId);
  const roleId = viewer?.roleId;

  if (projected.me?.role && roleId) {
    projected.me.role.memory = getVariantRoleMemory(variant.id, roleId, projected.me.role.memory ?? []);
    projected.me.role.isMurderer = roleId === variant.culpritRoleId;
  }

  const pending = projected.pendingQuestion;
  if (pending?.isTarget && roleId && pending.questionId) {
    const override = answerOverrideFor(raw, roleId, pending.questionId);
    if (override) pending.answerPrompt = override;
  }

  const variantEvidence = getVariantEvidence(variant.id);
  if (variantEvidence?.length && raw.evidenceIndex >= 0) {
    if (projected.evidence) {
      const card = variantEvidence[raw.evidenceIndex];
      if (card) {
        projected.evidence = {
          ...projected.evidence,
          total: variantEvidence.length,
          title: card.title,
          publicText: card.publicText,
          privateText: roleId ? card.privateByRole?.[roleId] ?? null : null,
          interruption: null,
        };
      }
    }

    if (projected.caseFile) {
      projected.caseFile.evidence = variantEvidence.slice(0, raw.evidenceIndex + 1).map((card, index) => ({
        index: index + 1,
        title: card.title,
        text: card.publicText,
      }));
      projected.caseFile.privateClues = roleId
        ? variantEvidence.slice(0, raw.evidenceIndex + 1).flatMap((card, index) => {
            const text = card.privateByRole?.[roleId];
            return text ? [{ index: index + 1, text }] : [];
          })
        : [];
      projected.caseFile.interruptions = [];
    }
  }

  if (projected.reveal) {
    const culprit = raw.players.find(player => player.roleId === variant.culpritRoleId);
    if (culprit) projected.reveal.murderer = { id: culprit.id, name: culprit.name, role: variant.culpritLabel };
  }

  return projected;
}

async function enhanceResult<T extends ProjectedResult>(result: T, code: string, viewerId: string): Promise<T> {
  const row = await readRaw(code);
  if (!row) return result;
  result.state = enhanceProjection(result.state, row.state, viewerId);
  return result;
}

async function patchRecordedAnswer(code: string, expected: MysteryPromptAnswer | null) {
  if (!expected) return;
  for (let attempt = 0; attempt < 2; attempt++) {
    const row = await readRaw(code);
    if (!row?.state.asked?.length) return;
    const asked = [...row.state.asked];
    const last = asked[asked.length - 1];
    if (last.answer === expected.mustReveal) return;
    asked[asked.length - 1] = { ...last, answer: expected.mustReveal };
    const saved = await saveRaw(row, { ...row.state, asked });
    if (saved) return;
  }
  throw new Error("The interview record changed while the answer was being saved. Try again.");
}

async function clearExtendedRunState(code: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const row = await readRaw(code);
    if (!row) return;
    const state = { ...row.state } as RawState;
    delete state.caseVariantId;
    delete state.branchSignals;
    delete state.dormantEvidence;
    delete state.caseSubmissions;
    const saved = await saveRaw(row, state);
    if (saved) return;
  }
  throw new Error("The mystery changed while it was being reset. Try Start Over again.");
}

export async function createMysteryRoom(nameValue: unknown, hostAccountId: string) {
  return createMysteryRoomV2(nameValue, hostAccountId);
}

export async function joinMysteryRoom(codeValue: unknown, nameValue: unknown) {
  return joinMysteryRoomV2(codeValue, nameValue);
}

export async function getMysteryRoom(codeValue: unknown, playerId: string, token: string, targetId?: string) {
  const code = typeof codeValue === "string" ? codeValue.trim().toUpperCase() : "";
  const result = await getMysteryRoomV2(codeValue, playerId, token, targetId) as ProjectedResult;
  return enhanceResult(result, code, playerId);
}

export async function actMysteryRoom(codeValue: unknown, playerId: string, token: string, action: string, payload: Record<string, unknown> = {}) {
  const code = typeof codeValue === "string" ? codeValue.trim().toUpperCase() : "";

  let expectedRecordedAnswer: MysteryPromptAnswer | null = null;
  if (action === "answered") {
    const before = await readRaw(code);
    const pending = before?.state.pendingQuestion;
    const target = pending ? before?.state.players.find(item => item.id === pending.targetId) : null;
    expectedRecordedAnswer = before && pending ? answerOverrideFor(before.state, target?.roleId, pending.questionId) : null;
  }

  if (action === "ask") {
    const row = await readRaw(code);
    if (row && shouldPauseForBranchLock(row.state)) {
      throw new Error("A new development is being resolved. Check your phones, then continue the investigation.");
    }
  }

  const result = await actMysteryRoomV2(codeValue, playerId, token, action, payload) as ProjectedResult;

  if (action === "answered") {
    await patchRecordedAnswer(code, expectedRecordedAnswer);
    const refreshed = await getMysteryRoomV2(codeValue, playerId, token, typeof payload.targetId === "string" ? payload.targetId : undefined) as ProjectedResult;
    return enhanceResult(refreshed, code, playerId);
  }

  if (action === "restart") {
    await clearExtendedRunState(code);
    const refreshed = await getMysteryRoomV2(codeValue, playerId, token) as ProjectedResult;
    return enhanceResult(refreshed, code, playerId);
  }

  return enhanceResult(result, code, playerId);
}
