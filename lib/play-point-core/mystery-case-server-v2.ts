import "server-only";

import {
  getMysteryCase as getMysteryCaseBase,
  submitMysteryCase as submitMysteryCaseBase,
} from "@/lib/play-point-core/mystery-case-server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

type CaseResult = { state: { privateLeads?: Array<{ id: string; [key: string]: unknown }>; [key: string]: unknown } };
type RoomRow = { state?: { caseVariantId?: string } };

const UNREACHABLE_LEADS: Record<string, Set<string>> = {
  "blackwood-business-partner": new Set(["sealed_letter_company_warning"]),
  "blackwood-younger-sister": new Set(["voice_draft_inheritance"]),
};

function cleanCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

async function activeVariantId(code: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_mystery_rooms").select("state").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as RoomRow | null)?.state?.caseVariantId ?? null;
}

async function scrubUnreachableLeads<T extends CaseResult>(code: string, result: T): Promise<T> {
  const variantId = await activeVariantId(code);
  const blocked = variantId ? UNREACHABLE_LEADS[variantId] : null;
  if (blocked && Array.isArray(result.state.privateLeads)) {
    result.state.privateLeads = result.state.privateLeads.filter(lead => !blocked.has(lead.id));
  }
  return result;
}

export async function getMysteryCase(codeValue: unknown, playerId: string, token: string) {
  const code = cleanCode(codeValue);
  const result = await getMysteryCaseBase(codeValue, playerId, token) as CaseResult;
  return scrubUnreachableLeads(code, result);
}

export async function submitMysteryCase(codeValue: unknown, playerId: string, token: string, payload: Record<string, unknown>) {
  const code = cleanCode(codeValue);
  const result = await submitMysteryCaseBase(codeValue, playerId, token, payload) as CaseResult;
  return scrubUnreachableLeads(code, result);
}
