import "server-only";
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { getSupabaseServerClient } from "./quick-score-supabase";
import {
  initialStoryState,
  projectStory,
  applyStoryAction,
  type StoryState,
} from "./thats-your-story-engine";

const TABLE = "ppl_thats_your_story_rooms";
type Row = {
  code: string;
  state: StoryState;
  version: number;
  updated_at: string;
  expires_at: string;
};
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("base64url");
function codeOf(value: unknown) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Enter a valid room code.");
  return code;
}
function nameOf(value: unknown) {
  const name =
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!name || name.length > 24)
    throw new Error("Enter a name up to 24 characters.");
  return name;
}
function auth(state: StoryState, id: unknown, secret: unknown) {
  const p = state.players.find((p) => p.id === id);
  if (!p || typeof secret !== "string")
    throw new Error("Invalid player session.");
  const a = Buffer.from(p.tokenHash, "hex"),
    b = Buffer.from(hash(secret), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b))
    throw new Error("Invalid player session.");
  return p;
}
async function read(code: string): Promise<Row> {
  const { data, error } = await getSupabaseServerClient()
    .from(TABLE)
    .select("code,state,version,updated_at,expires_at")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || Date.parse(data.expires_at) <= Date.now())
    throw new Error("Room not found or expired.");
  return data as Row;
}
async function mutate<T>(
  code: string,
  change: (state: StoryState) => T,
  skipWrite?: (result: T) => boolean,
) {
  for (let i = 0; i < 24; i++) {
    const row = await read(code);
    if (row.state.playAmplifiedEndedAt)
      throw new Error("The host ended this session.");
    const result = change(row.state);
    if (skipWrite?.(result)) return { state: row.state, result };
    const { data, error } = await getSupabaseServerClient()
      .from(TABLE)
      .update({
        state: row.state,
        version: row.version + 1,
        updated_at: new Date(
          Math.max(Date.now(), Date.parse(row.updated_at) + 1),
        ).toISOString(),
      })
      .eq("code", code)
      .eq("version", row.version)
      .eq("updated_at", row.updated_at)
      .select("code")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return { state: row.state, result };
  }
  throw new Error("The room is busy. Please retry.");
}
export async function createStoryRoom(
  nameValue: unknown,
  hostAccountId: string,
  reservedCode: string,
  expiresAt: string,
) {
  if (!hostAccountId) throw new Error("A host account is required.");
  const code = codeOf(reservedCode),
    name = nameOf(nameValue),
    id = randomUUID(),
    secret = token();
  const state = initialStoryState(code, hostAccountId, {
    id,
    name,
    tokenHash: hash(secret),
    seat: 0,
    score: 0,
  });
  const { error } = await getSupabaseServerClient()
    .from(TABLE)
    .insert({ code, state, version: 1, expires_at: expiresAt });
  if (error) throw new Error(error.message);
  return { code, playerId: id, token: secret, state: projectStory(state, id) };
}
export async function joinStoryRoom(codeValue: unknown, nameValue: unknown) {
  const code = codeOf(codeValue),
    name = nameOf(nameValue),
    id = randomUUID(),
    secret = token();
  const { state } = await mutate(code, (s) => {
    if (s.phase !== "lobby") throw new Error("The game has already started.");
    if (s.players.length >= 12) throw new Error("The room is full.");
    if (s.players.some((p) => p.name.toLowerCase() === name.toLowerCase()))
      throw new Error("Choose a different display name.");
    s.players.push({
      id,
      name,
      tokenHash: hash(secret),
      seat: s.players.length,
      score: 0,
    });
  });
  return { code, playerId: id, token: secret, state: projectStory(state, id) };
}
export async function recoverStoryHost(codeValue: unknown, accountId: string) {
  const code = codeOf(codeValue),
    secret = token();
  const { state, result: id } = await mutate(code, (s) => {
    if (s.hostAccountId !== accountId)
      throw new Error("This account is not the room host.");
    const p = s.players.find((p) => p.id === s.hostPlayerId);
    if (!p) throw new Error("Host seat missing.");
    p.tokenHash = hash(secret);
    return p.id;
  });
  return { code, playerId: id, token: secret, state: projectStory(state, id) };
}
export async function getStoryRoom(
  codeValue: unknown,
  id: unknown,
  secret: unknown,
) {
  const row = await read(codeOf(codeValue)),
    p = auth(row.state, id, secret);
  return { state: projectStory(row.state, p.id) };
}
export async function actStoryRoom(
  codeValue: unknown,
  id: unknown,
  secret: unknown,
  action: unknown,
  payload: unknown,
) {
  if (typeof action !== "string") throw new Error("Invalid action.");
  const { state, result } = await mutate(
    codeOf(codeValue),
    (s) => {
      const p = auth(s, id, secret);
      const changed = applyStoryAction(
        s,
        p.id,
        action,
        payload && typeof payload === "object" && !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {},
      );
      return { id: p.id, changed };
    },
    (result) => result.changed === false,
  );
  return { state: projectStory(state, result.id) };
}
