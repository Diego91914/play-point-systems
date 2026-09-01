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
  getVariantAnswerOverride,
  getVariantEvidence,
  getVariantRoleMemory,
  type MysteryAnswerKey,
} from "@/lib/play-point-core/mystery-variant-runtime";

type RawPlayer = { id: string; name: string; roleId?: string };
type RawState = {
  code: string;
  status: string;
  players: RawPlayer[];
  interrogationCount: number;
  evidenceIndex: number;
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

export function shouldPauseForBranchLock(state: Pick<RawState, "caseVariantId" | "evidenceIndex" | "interrogationCount" | "players">) {
  if (state.caseVariantId || state.evidenceIndex < 0 || !state.players.length) return false;
  const answerWouldFinishRound = (state.interrogationCount + 1) % state.players.length === 0;
  const nextEvidenceIndex = state.evidenceIndex + 1;
  return answerWouldFinishRound && nextEvidenceIndex >= 1;
}

function enhanceProjection(projected: ProjectedState, raw: RawState, viewerId: string) {
  if (!raw.caseVariantId) return projected;

  const variant = getMysteryCaseVariant(raw.caseVariantId);
  const viewer = raw.players.find(player => player.id === viewerId);
  const roleId = viewer?.roleId;

  if (projected.me?.role && roleId) {
    projected.me.role.memory = getVariantRoleMemory(variant.id, roleId, projected.me.role.memory ?? []);
    projected.me.role.isMurderer = roleId === variant.culpritRoleId;
  }

  const pending = projected.pendingQuestion;
  if (pending?.isTarget && roleId && pending.questionId) {
    const answerKey = QUESTION_ANSWER_KEYS[pending.questionId];
    const override = answerKey ? getVariantAnswerOverride(variant.id, roleId, answerKey) : null;
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

  // The old one-tap vote reveal is legacy UI. If it ever appears, make sure it
  // cannot identify the Old Friend in a different authored variant.
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

async function clearExtendedRunState(code: string) {
  const row = await readRaw(code);
  if (!row) return;
  const state = { ...row.state } as RawState;
  delete state.caseVariantId;
  delete state.branchSignals;
  delete state.dormantEvidence;
  delete state.caseSubmissions;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("ppl_mystery_rooms")
    .update({ state, version: row.version + 1, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() })
    .eq("code", code)
    .eq("version", row.version);
  if (error) throw new Error(error.message);
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

  if (action === "ask") {
    const row = await readRaw(code);
    if (row && shouldPauseForBranchLock(row.state)) {
      throw new Error("A private lead is still being resolved. Continue as soon as the phone advances the investigation.");
    }
  }

  const result = await actMysteryRoomV2(codeValue, playerId, token, action, payload) as ProjectedResult;

  if (action === "restart") {
    await clearExtendedRunState(code);
    const refreshed = await getMysteryRoomV2(codeValue, playerId, token) as ProjectedResult;
    return enhanceResult(refreshed, code, playerId);
  }

  return enhanceResult(result, code, playerId);
}
