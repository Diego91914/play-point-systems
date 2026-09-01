import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

type Player = { id: string; name: string; tokenHash: string; seat: number; roleId?: string };
type DormantChoice = { status: "available" | "opened" | "sealed"; decidedAt?: string };
type State = {
  code: string;
  status: "lobby" | "interrogation" | "evidence" | "accusation" | "reveal";
  players: Player[];
  evidenceIndex: number;
  dormantEvidence?: Record<string, DormantChoice>;
};
type Row = { code: string; state: State; version: number };

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
function project(state: State, viewer: Player) {
  if (viewer.roleId !== "sister" || state.status === "lobby" || state.evidenceIndex < 0) return { available: false };
  const choice = state.dormantEvidence?.[viewer.id] ?? { status: "available" as const };
  return {
    available: true,
    id: "adrian_sealed_letter",
    title: "The sealed envelope",
    reminder: "Three days before dinner, Adrian gave you a sealed envelope. He said: ‘If something happens to me, open this.’ You had pushed it into your bag and, until now, forgotten it was there.",
    status: choice.status,
    openedText: choice.status === "opened" ? "Adrian wrote that he had uncovered an old theft by someone he had trusted for decades. He planned to confront that person privately tonight and give them one final chance to admit the truth. He did not name the person." : null,
    sealedText: choice.status === "sealed" ? "You chose not to open Adrian’s envelope. It remains in your possession. You may tell the room it exists, but you do not know what is inside." : null,
    rule: "This is a private avenue, not a required clue. Blackwood House remains solvable without opening it.",
  };
}

export async function getMysteryDormantEvidence(codeValue: unknown, playerId: string, token: string) {
  const code = cleanCode(codeValue);
  const row = await read(code);
  if (!row) throw new Error("Mystery room not found.");
  const viewer = auth(row.state, playerId, token);
  return { evidence: project(row.state, viewer) };
}

export async function decideMysteryDormantEvidence(codeValue: unknown, playerId: string, token: string, decision: unknown) {
  const code = cleanCode(codeValue);
  const row = await read(code);
  if (!row) throw new Error("Mystery room not found.");
  const viewer = auth(row.state, playerId, token);
  if (viewer.roleId !== "sister" || row.state.status === "lobby" || row.state.evidenceIndex < 0) throw new Error("That evidence is not available to you.");
  const existing = row.state.dormantEvidence?.[playerId];
  if (existing && existing.status !== "available") throw new Error("You already made this choice.");
  if (decision !== "open" && decision !== "seal") throw new Error("Choose whether to open the envelope or keep it sealed.");
  row.state.dormantEvidence = {
    ...(row.state.dormantEvidence ?? {}),
    [playerId]: { status: decision === "open" ? "opened" : "sealed", decidedAt: new Date().toISOString() },
  };
  const saved = await save(row, row.state);
  return { evidence: project(saved.state, viewer) };
}
