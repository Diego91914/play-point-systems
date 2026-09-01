import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { blackwoodBranchProgress, resolveBlackwoodVariant, type MysteryBranchSignals } from "@/lib/play-point-core/mystery-case-variants";

type Player = { id: string; name: string; tokenHash: string; seat: number; roleId?: string };
type DormantChoice = { status: string; decidedAt?: string };
type State = {
  code: string;
  status: "lobby" | "interrogation" | "evidence" | "accusation" | "reveal";
  players: Player[];
  evidenceIndex: number;
  dormantEvidence?: Record<string, DormantChoice>;
  branchSignals?: MysteryBranchSignals;
  caseVariantId?: string;
};
type Row = { code: string; state: State; version: number };

type PrivateEvidence = {
  available: boolean;
  id?: string;
  title?: string;
  reminder?: string;
  status?: string;
  decisionText?: string | null;
  choices?: { id: string; label: string; primary?: boolean }[];
  rule?: string;
};

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function tokenMatches(expected: string, token: string) {
  const a = Buffer.from(hash(token), "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function cleanCode(value: unknown) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Enter a valid 6-character room code.");
  return code;
}
async function read(code: string): Promise<Row | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_mystery_rooms").select("code,state,version").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data as Row) : null;
}
async function save(row: Row, state: State) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_mystery_rooms")
    .update({ state, version: row.version + 1, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() })
    .eq("code", row.code).eq("version", row.version).select("code,state,version").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The room changed. Try again.");
  return data as Row;
}
function auth(state: State, playerId: string, token: string) {
  const player = state.players.find(item => item.id === playerId);
  if (!player || !tokenMatches(player.tokenHash, token)) throw new Error("Invalid player session.");
  return player;
}
function evidenceKey(playerId: string, evidenceId: string) { return `${playerId}:${evidenceId}`; }
function getChoice(state: State, viewer: Player, evidenceId: string) {
  const keyed = state.dormantEvidence?.[evidenceKey(viewer.id, evidenceId)];
  if (keyed) return keyed;
  if (evidenceId === "adrian_sealed_letter") return state.dormantEvidence?.[viewer.id]; // legacy rooms
  return undefined;
}

function letterEvidence(state: State, viewer: Player): PrivateEvidence | null {
  if (viewer.roleId !== "sister" || state.status === "lobby" || state.evidenceIndex < 0) return null;
  const choice = getChoice(state, viewer, "adrian_sealed_letter");
  const status = choice?.status ?? "available";
  return {
    available: true,
    id: "adrian_sealed_letter",
    title: "The sealed envelope",
    reminder: "Three days before dinner, Adrian gave you a sealed envelope. He said: ‘If something happens to me, open this.’ You had pushed it into your bag and, until now, forgotten it was there.",
    status,
    decisionText: status === "open"
      ? "You opened it. Adrian wrote that he had uncovered something serious involving someone close to him and planned a private confrontation tonight. He did not fully identify the person or explain the entire dispute."
      : status === "seal"
        ? "You kept Adrian’s envelope sealed. It remains in your possession. You may tell the room it exists, but you genuinely do not know what is inside."
        : null,
    choices: status === "available" ? [
      { id: "open", label: "OPEN THE LETTER", primary: true },
      { id: "seal", label: "KEEP IT SEALED" },
    ] : [],
    rule: "This is a private story choice. Your phone does not explain what other parts of the mystery it may affect.",
  };
}

function voiceDraftEvidence(state: State, viewer: Player): PrivateEvidence | null {
  // Branch Point 2 is intentionally unavailable until Branch Point 1 has been
  // resolved. It becomes available during the first evidence stage, before any
  // variant-dependent second evidence card can legally appear.
  if (viewer.roleId !== "chef" || state.status === "lobby" || state.evidenceIndex < 0 || !state.branchSignals?.adrian_sealed_letter) return null;
  const choice = getChoice(state, viewer, "adrian_voice_draft");
  const status = choice?.status ?? "available";
  return {
    available: true,
    id: "adrian_voice_draft",
    title: "The unfinished voice memo",
    reminder: "While clearing the sideboard earlier, you noticed Adrian had left his small voice recorder beside his phone charger. A draft recording was still queued and had never been sent. You remember it now because the recorder is still where he left it.",
    status,
    decisionText: status === "listen"
      ? "You listened privately. Adrian sounds tense and says: ‘Tonight ends one way or another. I’m done carrying someone else’s lie.’ The recording cuts off before he names the person or explains which lie he means."
      : status === "leave"
        ? "You left the recording untouched. You know an unsent voice memo exists, but you do not know what Adrian said in it."
        : null,
    choices: status === "available" ? [
      { id: "listen", label: "LISTEN TO THE DRAFT", primary: true },
      { id: "leave", label: "LEAVE IT UNPLAYED" },
    ] : [],
    rule: "Nobody else is automatically told about the recorder. This is your private decision unless you choose to talk about it.",
  };
}

function project(state: State, viewer: Player): PrivateEvidence {
  const letter = letterEvidence(state, viewer);
  if (letter) return letter;
  const voice = voiceDraftEvidence(state, viewer);
  if (voice) return voice;
  return { available: false };
}

export async function getMysteryDormantEvidence(codeValue: unknown, playerId: string, token: string) {
  const code = cleanCode(codeValue);
  const row = await read(code);
  if (!row) throw new Error("Mystery room not found.");
  const viewer = auth(row.state, playerId, token);
  return { evidence: project(row.state, viewer) };
}

export async function decideMysteryDormantEvidence(codeValue: unknown, playerId: string, token: string, evidenceIdValue: unknown, decisionValue: unknown) {
  const code = cleanCode(codeValue);
  const row = await read(code);
  if (!row) throw new Error("Mystery room not found.");
  const viewer = auth(row.state, playerId, token);
  const evidenceId = typeof evidenceIdValue === "string" ? evidenceIdValue : "adrian_sealed_letter";
  const decision = typeof decisionValue === "string" ? decisionValue : "";

  const valid = evidenceId === "adrian_sealed_letter"
    ? viewer.roleId === "sister" && row.state.evidenceIndex >= 0 && (decision === "open" || decision === "seal")
    : evidenceId === "adrian_voice_draft"
      ? viewer.roleId === "chef" && row.state.evidenceIndex >= 0 && Boolean(row.state.branchSignals?.adrian_sealed_letter) && (decision === "listen" || decision === "leave")
      : false;
  if (!valid || row.state.status === "lobby") throw new Error("That private evidence choice is not available to you.");

  const key = evidenceKey(playerId, evidenceId);
  const existing = getChoice(row.state, viewer, evidenceId);
  if (existing && existing.status !== "available") throw new Error("You already made this choice.");

  row.state.dormantEvidence = {
    ...(row.state.dormantEvidence ?? {}),
    [key]: { status: decision, decidedAt: new Date().toISOString() },
  };
  row.state.branchSignals = { ...(row.state.branchSignals ?? {}), [evidenceId]: decision };

  const progress = blackwoodBranchProgress(row.state.branchSignals);
  if (progress.readyToResolve) {
    const variant = resolveBlackwoodVariant(row.state.branchSignals, row.state.caseVariantId);
    if (variant) row.state.caseVariantId = variant.id;
  }

  const saved = await save(row, row.state);
  return { evidence: project(saved.state, viewer) };
}
